/**
 * Shared log-drain Lambda stack.
 *
 * Deploys a single Lambda function that receives CloudWatch Logs subscription
 * filter events and forwards them to Sentry OTLP. One stack instance per
 * environment (sandbox, production). Each Serverless service self-registers a
 * subscription filter pointing to the Lambda ARN exported by this stack.
 */

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';

/**
 * @requirements
 * - REQ-LOGDRAIN-001: Deploy a shared Lambda that decodes CloudWatch Logs and forwards to Sentry OTLP.
 * - REQ-LOGDRAIN-002: Grant CloudWatch Logs service principal permission to invoke the Lambda.
 * - REQ-LOGDRAIN-003: Export Lambda ARN via SSM parameter and CloudFormation output for service consumption.
 * - REQ-LOGDRAIN-004: Use arm64 architecture and Node.js 22 runtime for cost and performance.
 * - REQ-LOGDRAIN-005: Sandbox stacks allow teardown (DESTROY), production stacks retain (RETAIN).
 * - REQ-LOGDRAIN-006: Grant CI IAM user logs:PutSubscriptionFilter and logs:DeleteSubscriptionFilter
 *   so Serverless Framework can manage subscription filters during deploy/remove.
 */

/** Configuration for a LogDrain environment stack. */
export interface LogDrainStackProps extends cdk.StackProps {
    /** Environment name used for resource naming and tagging. */
    readonly environment: 'sandbox' | 'production';
}

/**
 * Stack that provisions a shared log-drain Lambda.
 *
 * Outputs:
 * - `LogDrainArn` — Lambda function ARN (CloudFormation export).
 * - SSM Parameter `/armoury/{env}/log-drain/lambda-arn` — same ARN for SSM consumers.
 */
export class LogDrainStack extends cdk.Stack {
    /** The log-drain Lambda function. */
    public readonly logDrainFunction: lambda.IFunction;

    constructor(scope: Construct, id: string, props: LogDrainStackProps) {
        super(scope, id, props);

        const { environment } = props;

        // -----------------------------------------------------------------
        // Lambda Function — CloudWatch Logs → Sentry OTLP forwarder
        // -----------------------------------------------------------------

        this.logDrainFunction = new lambdaNodejs.NodejsFunction(this, 'Handler', {
            functionName: `armoury-${environment}-log-drain`,
            description: `Forwards CloudWatch Logs to Sentry OTLP (${environment})`,
            entry: new URL('./log-drain-handler.ts', import.meta.url).pathname,
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_22_X,
            architecture: lambda.Architecture.ARM_64,
            memorySize: 128,
            timeout: cdk.Duration.seconds(30),
            environment: {
                SENTRY_OTLP_LOGS_URL:
                    'https://o863367.ingest.us.sentry.io/api/4511095646715904/integration/otlp/v1/logs',
                SENTRY_PUBLIC_KEY: '81bece2daf9ed16ee60757f21b1ec910',
                AWS_REGION_NAME: cdk.Stack.of(this).region,
            },
            bundling: {
                minify: true,
                sourceMap: true,
                target: 'es2022',
                format: lambdaNodejs.OutputFormat.ESM,
                mainFields: ['module', 'main'],
                // aws-lambda types are dev-only; node:zlib and node:util are built-in
                externalModules: [],
            },
        });

        // Allow CloudWatch Logs service to invoke this function.
        // Each service creates a subscription filter that targets this ARN;
        // this permission is required for cross-account-style invocations from
        // the Logs service principal.
        this.logDrainFunction.addPermission('CloudWatchLogsInvoke', {
            principal: new iam.ServicePrincipal('logs.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
        });

        // -----------------------------------------------------------------
        // SSM Parameter — Lambda ARN for Serverless services to reference
        // -----------------------------------------------------------------

        new ssm.StringParameter(this, 'LogDrainArnParam', {
            parameterName: `/armoury/${environment}/log-drain/lambda-arn`,
            description: `ARN of the shared log-drain Lambda for ${environment}`,
            stringValue: this.logDrainFunction.functionArn,
            tier: ssm.ParameterTier.STANDARD,
        });

        // -----------------------------------------------------------------
        // CI IAM User — subscription filter management permissions
        // -----------------------------------------------------------------

        const ciUser = iam.User.fromUserName(this, 'CiUser', 'armoury-ci');

        ciUser.attachInlinePolicy(
            new iam.Policy(this, `CiLogDrainPolicy-${environment}`, {
                policyName: `armoury-ci-log-drain-${environment}`,
                statements: [
                    // Allow CI to create/delete subscription filters on armoury Lambda log groups
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: ['logs:PutSubscriptionFilter', 'logs:DeleteSubscriptionFilter'],
                        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/armoury-*:*`],
                    }),
                ],
            }),
        );

        // -----------------------------------------------------------------
        // Tags
        // -----------------------------------------------------------------

        cdk.Tags.of(this).add('Project', 'armoury');
        cdk.Tags.of(this).add('Environment', environment);
        cdk.Tags.of(this).add('ManagedBy', 'cdk');

        // -----------------------------------------------------------------
        // Stack Outputs
        // -----------------------------------------------------------------

        new cdk.CfnOutput(this, 'LogDrainArn', {
            value: this.logDrainFunction.functionArn,
            description: 'ARN of the shared log-drain Lambda',
            exportName: `armoury-${environment}-log-drain-arn`,
        });
    }
}
