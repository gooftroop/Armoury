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
 * - Inline policy on CI user for `ssm:GetParameter` on `/armoury/*` and `/serverless-framework/*` parameters.
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

        // CI deploy permissions consolidated into a single managed policy per environment.
        // Inline policies are limited to 2 048 bytes each (up to 10 per user), with a
        // combined maximum of 10 240 bytes across all inline policies on a single user.
        // Managed policies support up to 6 144 bytes each (up to 10 per user by default),
        // so a single managed policy gives us more room than multiple inline policies.
        // See: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html
        // Each environment gets a distinctly-named policy to avoid CloudFormation
        // ownership conflicts across stacks.
        const ciDeployPolicy = new iam.ManagedPolicy(this, 'CiDeployPolicy', {
            managedPolicyName: `armoury-ci-deploy-${environment}`,
            description: 'CI user permissions for Serverless Framework deployments, custom domains, and infrastructure',
            statements: [
                // SSM: read infrastructure parameters (DSQL endpoints, log-drain ARN, etc.)
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ssm:GetParameter', 'ssm:GetParameters'],
                    resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/armoury/*`],
                }),
                // SSM: read/write Serverless Framework deployment state
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ssm:GetParameter', 'ssm:PutParameter'],
                    resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/serverless-framework/*`],
                }),
                // CloudFormation: manage Serverless Framework stacks
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'cloudformation:CreateStack',
                        'cloudformation:UpdateStack',
                        'cloudformation:DeleteStack',
                        'cloudformation:DescribeStacks',
                        'cloudformation:DescribeStackResource',
                        'cloudformation:DescribeStackResources',
                        'cloudformation:DescribeStackEvents',
                        'cloudformation:GetTemplate',
                        'cloudformation:GetTemplateSummary',
                        'cloudformation:ListStackResources',
                        'cloudformation:CreateChangeSet',
                        'cloudformation:ExecuteChangeSet',
                        'cloudformation:DescribeChangeSet',
                        'cloudformation:DeleteChangeSet',
                    ],
                    resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/armoury-*/*`],
                }),
                // CloudFormation: ValidateTemplate is a non-resource-level action
                // that requires Resource: "*" — it cannot be scoped to a stack ARN.
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['cloudformation:ValidateTemplate'],
                    resources: ['*'],
                }),
                // S3: Serverless Framework deployment bucket
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        's3:CreateBucket',
                        's3:DeleteBucket',
                        's3:GetBucketLocation',
                        's3:GetBucketPolicy',
                        's3:GetBucketTagging',
                        's3:GetEncryptionConfiguration',
                        's3:GetLifecycleConfiguration',
                        's3:GetObject',
                        's3:ListBucket',
                        's3:PutBucketPolicy',
                        's3:PutBucketTagging',
                        's3:PutEncryptionConfiguration',
                        's3:PutLifecycleConfiguration',
                        's3:PutObject',
                        's3:DeleteObject',
                        's3:GetBucketVersioning',
                        's3:PutBucketVersioning',
                    ],
                    resources: [
                        'arn:aws:s3:::serverless-framework-deployments-*',
                        'arn:aws:s3:::serverless-framework-deployments-*/*',
                    ],
                }),
                // Lambda: create/update/delete functions
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'lambda:CreateFunction',
                        'lambda:DeleteFunction',
                        'lambda:GetFunction',
                        'lambda:GetFunctionConfiguration',
                        'lambda:UpdateFunctionCode',
                        'lambda:UpdateFunctionConfiguration',
                        'lambda:ListVersionsByFunction',
                        'lambda:PublishVersion',
                        'lambda:CreateAlias',
                        'lambda:DeleteAlias',
                        'lambda:UpdateAlias',
                        'lambda:GetAlias',
                        'lambda:AddPermission',
                        'lambda:RemovePermission',
                        'lambda:InvokeFunction',
                        'lambda:ListTags',
                        'lambda:TagResource',
                        'lambda:UntagResource',
                        'lambda:PutFunctionEventInvokeConfig',
                        'lambda:DeleteFunctionEventInvokeConfig',
                    ],
                    resources: [`arn:aws:lambda:${this.region}:${this.account}:function:armoury-*`],
                }),
                // IAM: pass role to Lambda
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['iam:PassRole'],
                    resources: [`arn:aws:iam::${this.account}:role/armoury-*`],
                }),
                // IAM: manage Lambda execution roles created by Serverless Framework
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'iam:CreateRole',
                        'iam:DeleteRole',
                        'iam:GetRole',
                        'iam:PutRolePolicy',
                        'iam:DeleteRolePolicy',
                        'iam:GetRolePolicy',
                        'iam:AttachRolePolicy',
                        'iam:DetachRolePolicy',
                        'iam:ListRolePolicies',
                        'iam:ListAttachedRolePolicies',
                        'iam:TagRole',
                        'iam:UntagRole',
                        'iam:UpdateAssumeRolePolicy',
                    ],
                    resources: [`arn:aws:iam::${this.account}:role/armoury-*`],
                }),
                // API Gateway: create/manage REST APIs (API Gateway v1)
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'apigateway:GET',
                        'apigateway:POST',
                        'apigateway:PUT',
                        'apigateway:PATCH',
                        'apigateway:DELETE',
                    ],
                    resources: [`arn:aws:apigateway:${this.region}::/restapis*`],
                }),
                // API Gateway: tag resources (required by Serverless Framework during deploy)
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['apigateway:PUT', 'apigateway:POST'],
                    resources: [`arn:aws:apigateway:${this.region}::/tags/*`],
                }),
                // CloudWatch Logs: manage log groups for Lambda, WebSocket APIs, and REST APIs
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'logs:CreateLogGroup',
                        'logs:DeleteLogGroup',
                        'logs:PutRetentionPolicy',
                        'logs:DeleteRetentionPolicy',
                        'logs:TagResource',
                        'logs:UntagResource',
                    ],
                    resources: [
                        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/armoury-*`,
                        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/websocket/armoury-*`,
                        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/api/armoury-*`,
                        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/api-gateway/armoury-*`,
                    ],
                }),
                // CloudWatch Logs: DescribeLogGroups is a non-resource-level action
                // that requires Resource: "*" — it cannot be scoped to a log group ARN.
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['logs:DescribeLogGroups'],
                    resources: ['*'],
                }),
                // Route 53: manage DNS records in the armoury-app.com hosted zone
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'route53:ChangeResourceRecordSets',
                        'route53:GetHostedZone',
                        'route53:ListResourceRecordSets',
                        'route53:GetChange',
                    ],
                    resources: ['arn:aws:route53:::hostedzone/Z09361641Z6OI455J4GGH', 'arn:aws:route53:::change/*'],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['route53:ListHostedZones'],
                    resources: ['*'],
                }),
                // ACM: read certificate details for domain validation
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['acm:ListCertificates', 'acm:DescribeCertificate'],
                    resources: ['*'],
                }),
                // API Gateway: custom domain + WebSocket API management (API Gateway v2)
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'apigateway:POST',
                        'apigateway:GET',
                        'apigateway:PUT',
                        'apigateway:DELETE',
                        'apigateway:PATCH',
                        'apigateway:TagResource',
                        'apigateway:UntagResource',
                    ],
                    resources: [
                        `arn:aws:apigateway:${this.region}::/domainnames`,
                        `arn:aws:apigateway:${this.region}::/domainnames/*`,
                        `arn:aws:apigateway:${this.region}::/apis`,
                        `arn:aws:apigateway:${this.region}::/apis/*`,
                    ],
                }),
                // API Gateway: routing rules for per-PR sandbox domain routing
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'apigateway:CreateRoutingRule',
                        'apigateway:DeleteRoutingRule',
                        'apigateway:ListRoutingRules',
                    ],
                    resources: [`arn:aws:apigateway:${this.region}:${this.account}:/domainnames/*/routingrules/*`],
                }),
                // STS: Serverless Framework resolves ${aws:accountId} via GetCallerIdentity
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['sts:GetCallerIdentity'],
                    resources: ['*'],
                }),
            ],
        });

        ciDeployPolicy.attachToUser(ciUser);

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
