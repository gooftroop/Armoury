/**
 * Custom domain stack for PR sandbox deployments.
 *
 * Provisions shared domains for REST and WebSocket APIs so that
 * per-PR sandbox deployments can use routing rules (REST) or API mappings
 * (WS) instead of creating individual custom domains per PR per service.
 *
 * REST: `*.sandbox.armoury-app.com` — wildcard; routing rules route by Host header + base path.
 * WS:   `ws-sandbox.armoury-app.com` — single domain; API mappings route by path key (`pr-N-service`).
 */

import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import type { Construct } from 'constructs';

/**
 * @requirements
 * - REQ-WILDCARD-001: Provision a single ACM certificate covering both the REST wildcard and WS sandbox subdomains.
 * - REQ-WILDCARD-002: Create an API Gateway v2 custom domain for `*.sandbox.armoury-app.com` (REST).
 * - REQ-WILDCARD-003: Create an API Gateway v2 custom domain for `ws-sandbox.armoury-app.com` (WS).
 * - REQ-WILDCARD-004: Create Route53 A ALIAS records for the REST wildcard domain and the WS sandbox domain.
 * - REQ-WILDCARD-005: Export domain name IDs and regional endpoints for CI workflow consumption.
 * - REQ-WILDCARD-006: Sandbox-only stack — production uses direct domains, not PR sandboxes.
 */

/** The Route53 hosted zone ID for armoury-app.com (shared with dsql-stack). */
const HOSTED_ZONE_ID = 'Z09361641Z6OI455J4GGH';

/** The root domain name. */
const ROOT_DOMAIN = 'armoury-app.com';

/** REST API wildcard subdomain pattern. */
const REST_WILDCARD_DOMAIN = `*.sandbox.${ROOT_DOMAIN}`;

/** WebSocket API sandbox domain (single, non-wildcard). */
const WS_DOMAIN = `ws-sandbox.${ROOT_DOMAIN}`;

/** Configuration for the wildcard domain stack. */
export interface WildcardDomainStackProps extends cdk.StackProps {
    /** Environment name — currently only 'sandbox' is supported. */
    readonly environment: 'sandbox';
}

/**
 * Stack that provisions shared custom domains for PR sandbox deployments.
 *
 * Creates:
 * - One ACM certificate covering both `*.sandbox.armoury-app.com` and `ws-sandbox.armoury-app.com`.
 * - Two API Gateway v2 custom domain names (REST wildcard + WS single domain).
 * - Two Route53 A ALIAS records pointing to the API Gateway regional endpoints.
 *
 * Outputs:
 * - `RestDomainName` — The API Gateway domain name ID for REST APIs.
 * - `WsDomainName` — The API Gateway domain name ID for WebSocket APIs.
 * - `RestRegionalDomainName` — The regional endpoint for the REST wildcard domain.
 * - `WsRegionalDomainName` — The regional endpoint for the WS domain.
 */
export class WildcardDomainStack extends cdk.Stack {
    /** The API Gateway v2 custom domain for REST APIs. */
    public readonly restDomain: apigwv2.DomainName;

    /** The API Gateway v2 custom domain for WebSocket APIs. */
    public readonly wsDomain: apigwv2.DomainName;

    constructor(scope: Construct, id: string, props: WildcardDomainStackProps) {
        super(scope, id, props);

        const { environment } = props;

        // Apply standard tags to all taggable resources in this stack.
        cdk.Tags.of(this).add('Project', 'armoury');
        cdk.Tags.of(this).add('Environment', environment);
        cdk.Tags.of(this).add('ManagedBy', 'cdk');

        // -----------------------------------------------------------------
        // Route53 Hosted Zone (imported from existing zone)
        // -----------------------------------------------------------------

        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
            hostedZoneId: HOSTED_ZONE_ID,
            zoneName: ROOT_DOMAIN,
        });

        // -----------------------------------------------------------------
        // ACM Certificate — single cert covering REST wildcard + WS sandbox domain
        // -----------------------------------------------------------------

        // A single certificate with SANs for both patterns avoids
        // creating two separate certificates and keeps TLS management simple.
        const certificate = new acm.Certificate(this, 'WildcardCertificate', {
            domainName: REST_WILDCARD_DOMAIN,
            subjectAlternativeNames: [WS_DOMAIN],
            validation: acm.CertificateValidation.fromDns(hostedZone),
        });

        cdk.Tags.of(certificate).add('Name', `armoury-${environment}-wildcard-cert`);

        // -----------------------------------------------------------------
        // API Gateway v2 Custom Domains — REST wildcard + WS single domain
        // -----------------------------------------------------------------

        // REST wildcard: `*.sandbox.armoury-app.com`
        // CI workflows create routing rules per PR that match Host header + base path.
        this.restDomain = new apigwv2.DomainName(this, 'RestWildcardDomain', {
            domainName: REST_WILDCARD_DOMAIN,
            certificate,
            securityPolicy: apigwv2.SecurityPolicy.TLS_1_2,
        });

        cdk.Tags.of(this.restDomain).add('Name', `armoury-${environment}-rest-wildcard`);

        // WS sandbox: `ws-sandbox.armoury-app.com`
        // CI workflows create API mappings with path keys (pr-N-service) for per-PR WS isolation.
        this.wsDomain = new apigwv2.DomainName(this, 'WsWildcardDomain', {
            domainName: WS_DOMAIN,
            certificate,
            securityPolicy: apigwv2.SecurityPolicy.TLS_1_2,
        });

        cdk.Tags.of(this.wsDomain).add('Name', `armoury-${environment}-ws-sandbox`);

        // -----------------------------------------------------------------
        // Route53 A ALIAS Records — DNS → API Gateway
        // -----------------------------------------------------------------

        // REST wildcard A record: *.sandbox.armoury-app.com → API Gateway regional endpoint
        new route53.ARecord(this, 'RestWildcardARecord', {
            zone: hostedZone,
            recordName: `*.sandbox`,
            target: route53.RecordTarget.fromAlias(
                new targets.ApiGatewayv2DomainProperties(
                    this.restDomain.regionalDomainName,
                    this.restDomain.regionalHostedZoneId,
                ),
            ),
        });

        // WS sandbox A record: ws-sandbox.armoury-app.com → API Gateway regional endpoint
        new route53.ARecord(this, 'WsWildcardARecord', {
            zone: hostedZone,
            recordName: `ws-sandbox`,
            target: route53.RecordTarget.fromAlias(
                new targets.ApiGatewayv2DomainProperties(
                    this.wsDomain.regionalDomainName,
                    this.wsDomain.regionalHostedZoneId,
                ),
            ),
        });

        // -----------------------------------------------------------------
        // Stack Outputs — consumed by CI deploy/cleanup workflows
        // -----------------------------------------------------------------

        new cdk.CfnOutput(this, 'RestDomainName', {
            value: REST_WILDCARD_DOMAIN,
            description: 'REST API wildcard custom domain name',
            exportName: `armoury-${environment}-rest-wildcard-domain`,
        });

        new cdk.CfnOutput(this, 'WsDomainName', {
            value: WS_DOMAIN,
            description: 'WebSocket API sandbox custom domain name',
            exportName: `armoury-${environment}-ws-wildcard-domain`,
        });

        new cdk.CfnOutput(this, 'RestRegionalDomainName', {
            value: this.restDomain.regionalDomainName,
            description: 'Regional endpoint for the REST wildcard domain (for DNS verification)',
            exportName: `armoury-${environment}-rest-regional-domain`,
        });

        new cdk.CfnOutput(this, 'WsRegionalDomainName', {
            value: this.wsDomain.regionalDomainName,
            description: 'Regional endpoint for the WS wildcard domain (for DNS verification)',
            exportName: `armoury-${environment}-ws-regional-domain`,
        });
    }
}
