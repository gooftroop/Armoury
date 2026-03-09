/**
 * Aurora DSQL deployment stack.
 *
 * Thin stack that wires the reusable {@link DsqlCluster} construct with an
 * IAM role for Lambda access and publishes CloudFormation outputs.  One stack
 * instance per environment (sandbox, production).
 */

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';

import { DsqlCluster } from './dsql-cluster.js';
import type { IDsqlCluster } from './dsql-cluster.js';

/**
 * @requirements
 * - REQ-DSQL-001: Provision one Aurora DSQL cluster per environment.
 * - REQ-DSQL-002: Production clusters must have deletion protection enabled (RemovalPolicy.RETAIN).
 * - REQ-DSQL-003: Sandbox clusters must allow deletion for teardown (RemovalPolicy.DESTROY).
 * - REQ-DSQL-004: Create an IAM role with dsql:DbConnectAdmin for Lambda via grant helper.
 * - REQ-DSQL-005: Export cluster endpoint, ARN, identifier, and IAM role ARN as stack outputs.
 * - REQ-DSQL-006: Create SSM Parameter Store entries for each service with the cluster endpoint.
 * - REQ-DSQL-007: Grant the CI IAM user read access to SSM parameters for deployment workflows.
 * - REQ-DSQL-008: Grant the CI IAM user dsql:DbConnectAdmin for running migrations during deploy.
 */

/** Configuration for a DSQL environment stack. */
export interface DsqlStackProps extends cdk.StackProps {
    /** Environment name used for resource naming and tagging. */
    readonly environment: 'sandbox' | 'production';
}

/**
 * Stack that provisions an Aurora DSQL cluster and companion IAM role.
 *
 * Delegates cluster creation to the reusable {@link DsqlCluster} construct and
 * uses its `grantConnectAdmin` helper for least-privilege IAM.
 *
 * Outputs:
 * - `ClusterIdentifier` — The DSQL cluster ID.
 * - `ClusterEndpoint` — The full DSQL endpoint hostname.
 * - `ClusterArn` — The ARN of the DSQL cluster.
 * - `LambdaDsqlRoleArn` — The ARN of the IAM role for Lambda DSQL access.
 * - SSM Parameters `/armoury/{env}/{service}/dsql-cluster-endpoint` for each service.
 * - Inline policy on CI user for `ssm:GetParameter` on `/armoury/*` parameters.
 */
export class DsqlStack extends cdk.Stack {
    /** The DSQL cluster construct instance. */
    public readonly cluster: IDsqlCluster;

    /** The IAM role that Lambda functions assume for DSQL access. */
    public readonly lambdaRole: iam.Role;

    constructor(scope: Construct, id: string, props: DsqlStackProps) {
        super(scope, id, props);

        const { environment } = props;

        // Map environment to CDK removal policy:
        // production → RETAIN (deletion protection on), sandbox → DESTROY (teardown-friendly)
        const removalPolicy = environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

        // -----------------------------------------------------------------
        // Aurora DSQL Cluster (reusable L3 construct)
        // -----------------------------------------------------------------

        this.cluster = new DsqlCluster(this, 'Cluster', { removalPolicy });

        // Name tag for AWS Console visibility.
        cdk.Tags.of(this.cluster).add('Name', `armoury-${environment}-dsql`);

        // Apply standard tags to all taggable resources in this stack.
        cdk.Tags.of(this).add('Project', 'armoury');
        cdk.Tags.of(this).add('Environment', environment);
        cdk.Tags.of(this).add('ManagedBy', 'cdk');

        // -----------------------------------------------------------------
        // IAM Role for Lambda → DSQL access
        // -----------------------------------------------------------------

        this.lambdaRole = new iam.Role(this, 'LambdaDsqlRole', {
            roleName: `armoury-${environment}-lambda-dsql`,
            description: `Allows Lambda functions to connect to the ${environment} Aurora DSQL cluster`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                // Basic Lambda execution (CloudWatch Logs)
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });

        this.cluster.grantConnectAdmin(this.lambdaRole);

        // -----------------------------------------------------------------
        // SSM Parameters — DSQL endpoint for each Lambda service
        // -----------------------------------------------------------------

        const services = ['authorizer', 'campaigns', 'users', 'friends', 'matches'] as const;

        for (const service of services) {
            new ssm.StringParameter(this, `DsqlEndpoint-${service}`, {
                parameterName: `/armoury/${environment}/${service}/dsql-cluster-endpoint`,
                description: `Aurora DSQL cluster endpoint for the ${environment} ${service} service`,
                stringValue: this.cluster.clusterEndpoint,
                tier: ssm.ParameterTier.STANDARD,
            });
        }

        // -----------------------------------------------------------------
        // CI IAM User — permissions for deployment workflows
        // -----------------------------------------------------------------

        const ciUser = iam.User.fromUserName(this, 'CiUser', 'armoury-ci');

        // Grant dsql:DbConnectAdmin so CI can run migrations via DsqlSigner.
        // Use an explicit inline policy with an environment-scoped name so that
        // sandbox and production stacks each own a distinct policy on the IAM user.
        // The CDK-generated grantConnectAdmin() helper produces the same logical ID
        // in both stacks, causing CloudFormation ownership conflicts.
        ciUser.attachInlinePolicy(
            new iam.Policy(this, `CiDsqlPolicy-${environment}`, {
                policyName: `armoury-ci-dsql-${environment}`,
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: ['dsql:DbConnectAdmin'],
                        resources: [this.cluster.clusterArn],
                    }),
                ],
            }),
        );

        // SSM read access for fetching DSQL endpoint parameters during deploy.
        // The resource pattern `/armoury/*` covers both sandbox and production,
        // so the policy only needs to be attached once. Guard with environment
        // check to avoid CloudFormation ownership conflicts across stacks.
        if (environment === 'sandbox') {
            ciUser.attachInlinePolicy(
                new iam.Policy(this, 'CiSsmReadPolicy', {
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: ['ssm:GetParameter'],
                            resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/armoury/*`],
                        }),
                    ],
                }),
            );
        }

        // -----------------------------------------------------------------
        // Stack Outputs
        // -----------------------------------------------------------------

        new cdk.CfnOutput(this, 'ClusterIdentifier', {
            value: this.cluster.clusterIdentifier,
            description: 'Aurora DSQL cluster identifier',
            exportName: `armoury-${environment}-dsql-cluster-id`,
        });

        new cdk.CfnOutput(this, 'ClusterEndpoint', {
            value: this.cluster.clusterEndpoint,
            description: 'Aurora DSQL cluster endpoint hostname',
            exportName: `armoury-${environment}-dsql-endpoint`,
        });

        new cdk.CfnOutput(this, 'ClusterArn', {
            value: this.cluster.clusterArn,
            description: 'Aurora DSQL cluster ARN',
            exportName: `armoury-${environment}-dsql-cluster-arn`,
        });

        new cdk.CfnOutput(this, 'LambdaDsqlRoleArn', {
            value: this.lambdaRole.roleArn,
            description: 'IAM role ARN for Lambda DSQL access',
            exportName: `armoury-${environment}-lambda-dsql-role-arn`,
        });
    }
}
