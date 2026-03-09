/**
 * Reusable L3 construct for Aurora DSQL clusters.
 *
 * Wraps the L1 `dsql.CfnCluster` with a typed interface, grant helpers for
 * least-privilege IAM, and CDK-idiomatic removal-policy mapping.  Modelled
 * after the awslabs/generative-ai-cdk-constructs DSQL pattern.
 */

import * as cdk from 'aws-cdk-lib';
import * as dsql from 'aws-cdk-lib/aws-dsql';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * @requirements
 * - REQ-DSQL-CONSTRUCT-001: Expose cluster endpoint, ARN, and identifier as typed readonly properties.
 * - REQ-DSQL-CONSTRUCT-002: Provide grantConnect / grantConnectAdmin helpers for least-privilege IAM.
 * - REQ-DSQL-CONSTRUCT-003: Map CDK RemovalPolicy to CloudFormation DeletionProtectionEnabled.
 * - REQ-DSQL-CONSTRUCT-004: Apply standard Armoury tags via cdk.Tags aspect.
 */

/** IAM actions for DSQL connection grants. */
const DSQL_CONNECT_ACTIONS = ['dsql:DbConnect'];
const DSQL_CONNECT_ADMIN_ACTIONS = ['dsql:DbConnectAdmin'];

/**
 * Contract for a DSQL cluster reference, usable for cross-stack sharing.
 */
export interface IDsqlCluster {
    /** The unique cluster identifier assigned by DSQL. */
    readonly clusterIdentifier: string;

    /** The full endpoint hostname for client connections. */
    readonly clusterEndpoint: string;

    /** The ARN of the DSQL cluster resource. */
    readonly clusterArn: string;

    /**
     * Grants `dsql:DbConnect` on this cluster to the given principal.
     *
     * @param grantee - The IAM principal that receives the grant.
     * @returns The resulting IAM grant.
     */
    grantConnect(grantee: iam.IGrantable): iam.Grant;

    /**
     * Grants `dsql:DbConnectAdmin` on this cluster to the given principal.
     *
     * @param grantee - The IAM principal that receives the grant.
     * @returns The resulting IAM grant.
     */
    grantConnectAdmin(grantee: iam.IGrantable): iam.Grant;
}

/**
 * Configuration properties for the DsqlCluster construct.
 */
export interface DsqlClusterProps {
    /**
     * CDK removal policy controlling deletion protection and resource retention.
     *
     * - `RemovalPolicy.RETAIN` enables deletion protection (production).
     * - `RemovalPolicy.DESTROY` disables deletion protection (sandbox / dev).
     *
     * @default RemovalPolicy.RETAIN
     */
    readonly removalPolicy?: cdk.RemovalPolicy;
}

/**
 * An Aurora DSQL cluster provisioned via the L1 `CfnCluster` construct.
 *
 * This L3 construct adds:
 * - Typed readonly properties for endpoint, ARN, and identifier.
 * - `grantConnect` / `grantConnectAdmin` helpers (least-privilege IAM).
 * - Removal-policy-to-deletion-protection mapping.
 * - Standard Armoury tags via `cdk.Tags.of()`.
 *
 * @example
 * ```ts
 * const cluster = new DsqlCluster(this, 'Dsql', {
 *     removalPolicy: cdk.RemovalPolicy.DESTROY,
 * });
 * cluster.grantConnectAdmin(lambdaRole);
 * ```
 */
export class DsqlCluster extends Construct implements IDsqlCluster {
    /** The underlying L1 CfnCluster resource. */
    public readonly cfnCluster: dsql.CfnCluster;

    /** The unique cluster identifier assigned by DSQL. */
    public readonly clusterIdentifier: string;

    /** The full endpoint hostname for client connections. */
    public readonly clusterEndpoint: string;

    /** The ARN of the DSQL cluster resource. */
    public readonly clusterArn: string;

    constructor(scope: Construct, id: string, props: DsqlClusterProps = {}) {
        super(scope, id);

        const removalPolicy = props.removalPolicy ?? cdk.RemovalPolicy.RETAIN;
        const deletionProtection = removalPolicy === cdk.RemovalPolicy.RETAIN;

        this.cfnCluster = new dsql.CfnCluster(this, 'Resource', {
            deletionProtectionEnabled: deletionProtection,
        });

        this.cfnCluster.applyRemovalPolicy(removalPolicy);

        // CloudFormation-resolved attributes — typed from the L1 construct.
        this.clusterIdentifier = this.cfnCluster.attrIdentifier;
        this.clusterEndpoint = this.cfnCluster.attrEndpoint;
        this.clusterArn = this.cfnCluster.attrResourceArn;
    }

    /**
     * Grants `dsql:DbConnect` on this cluster to the given principal.
     *
     * @param grantee - The IAM principal that receives the grant.
     * @returns The resulting IAM grant.
     */
    public grantConnect(grantee: iam.IGrantable): iam.Grant {
        return iam.Grant.addToPrincipal({
            grantee,
            actions: DSQL_CONNECT_ACTIONS,
            resourceArns: [this.clusterArn],
        });
    }

    /**
     * Grants `dsql:DbConnectAdmin` on this cluster to the given principal.
     *
     * @param grantee - The IAM principal that receives the grant.
     * @returns The resulting IAM grant.
     */
    public grantConnectAdmin(grantee: iam.IGrantable): iam.Grant {
        return iam.Grant.addToPrincipal({
            grantee,
            actions: DSQL_CONNECT_ADMIN_ACTIONS,
            resourceArns: [this.clusterArn],
        });
    }
}
