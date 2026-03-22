/**
 * Custom domain stack for production deployments.
 *
 * Provisions shared domains for REST and WebSocket APIs so that
 * production deployments can use API mappings instead of creating
 * individual custom domains per service.
 *
 * REST: `api.armoury-app.com` — single domain; API mappings route by base path (`/{service}`).
 * WS:   `ws.armoury-app.com` — single domain; API mappings route by path key (`{service}`).
 */

import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import type { Construct } from 'constructs';

/**
 * @requirements
 * - REQ-PROD-DOMAIN-001: Provision a single ACM certificate covering both production REST and WS domains.
 * - REQ-PROD-DOMAIN-002: Create an API Gateway v2 custom domain for `api.armoury-app.com` (REST).
 * - REQ-PROD-DOMAIN-003: Create an API Gateway v2 custom domain for `ws.armoury-app.com` (WS).
 * - REQ-PROD-DOMAIN-004: Create Route53 A ALIAS records for `api.armoury-app.com` and `ws.armoury-app.com`.
 * - REQ-PROD-DOMAIN-005: Export domain names and regional endpoints for CI workflow consumption.
 */

/** The Route53 hosted zone ID for armoury-app.com (shared with dsql-stack). */
const HOSTED_ZONE_ID = 'Z09361641Z6OI455J4GGH';

/** The root domain name. */
const ROOT_DOMAIN = 'armoury-app.com';

/** REST API production domain. */
const REST_DOMAIN = `api.${ROOT_DOMAIN}`;

/** WebSocket API production domain. */
const WS_DOMAIN = `ws.${ROOT_DOMAIN}`;

/** Configuration for the production domain stack. */
export interface ProductionDomainStackProps extends cdk.StackProps {
    /** Environment name — currently only 'production' is supported. */
    readonly environment: 'production';
}

/**
 * Stack that provisions shared custom domains for production deployments.
 *
 * Creates:
 * - One ACM certificate covering both `api.armoury-app.com` and `ws.armoury-app.com`.
 * - Two API Gateway v2 custom domain names (REST + WS).
 * - Two Route53 A ALIAS records pointing to the API Gateway regional endpoints.
 *
 * Outputs:
 * - `RestDomainName` — The API Gateway domain name ID for REST APIs.
 * - `WsDomainName` — The API Gateway domain name ID for WebSocket APIs.
 * - `RestRegionalDomainName` — The regional endpoint for the REST domain.
 * - `WsRegionalDomainName` — The regional endpoint for the WS domain.
 */
export class ProductionDomainStack extends cdk.Stack {
    /** The API Gateway v2 custom domain for REST APIs. */
    public readonly restDomain: apigwv2.DomainName;

    /** The API Gateway v2 custom domain for WebSocket APIs. */
    public readonly wsDomain: apigwv2.DomainName;

    constructor(scope: Construct, id: string, props: ProductionDomainStackProps) {
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
        // ACM Certificate — single cert covering REST + WS production domains
        // -----------------------------------------------------------------

        // A single certificate with SANs for both domains avoids
        // creating two separate certificates and keeps TLS management simple.
        const certificate = new acm.Certificate(this, 'ProductionCertificate', {
            domainName: REST_DOMAIN,
            subjectAlternativeNames: [WS_DOMAIN],
            validation: acm.CertificateValidation.fromDns(hostedZone),
        });

        cdk.Tags.of(certificate).add('Name', 'armoury-production-api-cert');

        // -----------------------------------------------------------------
        // API Gateway v2 Custom Domains — REST + WS production domains
        // -----------------------------------------------------------------

        // REST production domain: `api.armoury-app.com`
        // CI workflows create API mappings per service using base paths.
        this.restDomain = new apigwv2.DomainName(this, 'RestProductionDomain', {
            domainName: REST_DOMAIN,
            certificate,
            securityPolicy: apigwv2.SecurityPolicy.TLS_1_2,
        });

        cdk.Tags.of(this.restDomain).add('Name', 'armoury-production-rest-domain');

        // WS production domain: `ws.armoury-app.com`
        // CI workflows create API mappings per service using mapping keys.
        this.wsDomain = new apigwv2.DomainName(this, 'WsProductionDomain', {
            domainName: WS_DOMAIN,
            certificate,
            securityPolicy: apigwv2.SecurityPolicy.TLS_1_2,
        });

        cdk.Tags.of(this.wsDomain).add('Name', 'armoury-production-ws-domain');

        // -----------------------------------------------------------------
        // Route53 A ALIAS Records — DNS → API Gateway
        // -----------------------------------------------------------------

        // REST A record: api.armoury-app.com → API Gateway regional endpoint
        new route53.ARecord(this, 'RestProductionARecord', {
            zone: hostedZone,
            recordName: 'api',
            target: route53.RecordTarget.fromAlias(
                new targets.ApiGatewayv2DomainProperties(
                    this.restDomain.regionalDomainName,
                    this.restDomain.regionalHostedZoneId,
                ),
            ),
        });

        // WS A record: ws.armoury-app.com → API Gateway regional endpoint
        new route53.ARecord(this, 'WsProductionARecord', {
            zone: hostedZone,
            recordName: 'ws',
            target: route53.RecordTarget.fromAlias(
                new targets.ApiGatewayv2DomainProperties(
                    this.wsDomain.regionalDomainName,
                    this.wsDomain.regionalHostedZoneId,
                ),
            ),
        });

        // -----------------------------------------------------------------
        // Stack Outputs — consumed by CI deploy workflows
        // -----------------------------------------------------------------

        new cdk.CfnOutput(this, 'RestDomainName', {
            value: REST_DOMAIN,
            description: 'REST API production custom domain name',
            exportName: 'armoury-production-rest-domain',
        });

        new cdk.CfnOutput(this, 'WsDomainName', {
            value: WS_DOMAIN,
            description: 'WebSocket API production custom domain name',
            exportName: 'armoury-production-ws-domain',
        });

        new cdk.CfnOutput(this, 'RestRegionalDomainName', {
            value: this.restDomain.regionalDomainName,
            description: 'Regional endpoint for the REST production domain (for DNS verification)',
            exportName: 'armoury-production-rest-regional-domain',
        });

        new cdk.CfnOutput(this, 'WsRegionalDomainName', {
            value: this.wsDomain.regionalDomainName,
            description: 'Regional endpoint for the WS production domain (for DNS verification)',
            exportName: 'armoury-production-ws-regional-domain',
        });
    }
}
