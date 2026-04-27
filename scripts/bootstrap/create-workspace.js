#!/usr/bin/env node

/**
 * Generates a new workspace within an existing monorepo.
 *
 * Workspace types:
 *   - library:        Shared library with dual browser+node ESM bundles
 *   - serverless:     AWS Lambda service with Serverless Framework
 *   - nextjs:         Next.js web application
 *   - react-native:   Expo/React Native mobile application
 *   - nestjs:         NestJS service (Docker optional)
 *   - nestjs-docker:  Alias for nestjs (backward compatibility)
 *
 * Usage:
 *   node scripts/bootstrap/create-workspace.js --name <pkg-name> --location <path> --type <type> [--scope <scope>]
 *
 * Example:
 *   node scripts/bootstrap/create-workspace.js --name models --location src/shared/models --type library --scope myapp
 *   → Creates @myapp/models at src/shared/models/
 *
 * All input via CLI args — no interactive prompts (agent-runnable).
 * Uses only Node built-ins (fs, path).
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1 || idx + 1 >= args.length) {
        return undefined;
    }

    return args[idx + 1];
}

const VALID_TYPES = ['library', 'serverless', 'nextjs', 'react-native', 'nestjs', 'nestjs-docker'];

const name = getArg('name');
const location = getArg('location');
const rawType = getArg('type');
const type = rawType === 'nestjs-docker' ? 'nestjs' : rawType;
const scope = getArg('scope') || detectScope();

if (!name || !location || !type) {
    console.error(
        'Usage: node scripts/bootstrap/create-workspace.js --name <pkg-name> --location <path> --type <type> [--scope <scope>]',
    );
    console.error(`Types: ${VALID_TYPES.join(' | ')}`);
    console.error(
        'Example: node scripts/bootstrap/create-workspace.js --name models --location src/shared/models --type library --scope myapp',
    );
    process.exit(1);
}

if (!VALID_TYPES.includes(type)) {
    console.error(`Invalid type: "${type}". Must be one of: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
}

if (!scope) {
    console.error('Could not detect scope from root package.json. Pass --scope <scope> explicitly.');
    process.exit(1);
}

/**
 * Detect the monorepo scope from the root package.json.
 * Looks for the first workspace package name and extracts the @scope prefix.
 */
function detectScope() {
    try {
        const rootPkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
        // Try to extract from root package name
        if (rootPkg.name) {
            return rootPkg.name.replace(/^@/, '');
        }
    } catch {
        return undefined;
    }

    return undefined;
}

const pkgName = `@${scope}/${name}`;
const wsRoot = resolve(location);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function w(relPath, content) {
    const abs = join(wsRoot, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf-8');
    console.log(`  created ${join(location, relPath)}`);
}

function json(relPath, obj) {
    w(relPath, JSON.stringify(obj, null, 4) + '\n');
}

// ---------------------------------------------------------------------------
// Shared files (all workspace types)
// ---------------------------------------------------------------------------

function writeEslintConfig() {
    w(
        'eslint.config.js',
        `import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createConfig from '@${scope}/eslint';

export default createConfig('./tsconfig.json', dirname(fileURLToPath(import.meta.url)));
`,
    );
}

function writePrettierConfig() {
    w(
        'prettier.config.js',
        `import config from '@${scope}/prettier' with { type: 'json' };

export default config;
`,
    );
}

function writePrettierIgnore() {
    w(
        '.prettierignore',
        `node_modules
dist
coverage
`,
    );
}

function writeVitestConfig() {
    w(
        'vitest.config.ts',
        `import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@${scope}/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['**/__tests__/**/*.test.ts'],
            passWithNoTests: true,
        },
    }),
);
`,
    );
}

function writeTsconfig() {
    json('tsconfig.json', {
        extends: `@${scope}/typescript/base.json`,
        compilerOptions: {
            noEmit: true,
            baseUrl: '.',
            paths: {
                '@/*': ['./src/*'],
            },
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist'],
    });
}

function writeTsconfigBuild() {
    json('tsconfig.build.json', {
        extends: `@${scope}/typescript/build.json`,
        compilerOptions: {
            rootDir: './src',
            outDir: 'dist',
            baseUrl: '.',
            paths: {
                '@/*': ['./src/*'],
            },
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist', 'src/**/__tests__/**', 'src/**/__mocks__/**', 'src/**/__fixtures__/**'],
    });
}

function writeIndexTs() {
    w(
        'src/index.ts',
        `/**
 * @${scope}/${name}
 *
 * @requirements
 * TODO: Define requirements for this module.
 */

export {};
`,
    );
}

function writeInfraBase() {
    json('infra/package.json', {
        name: `${scope}-${name}-infra`,
        private: true,
        type: 'module',
        scripts: {
            build: 'tsc -p tsconfig.json',
            synth: 'cdk synth',
            diff: 'cdk diff',
            deploy: 'cdk deploy',
        },
        devDependencies: {
            'aws-cdk': '^2.1000.0',
            'aws-cdk-lib': '^2.0.0',
            constructs: '^10.0.0',
            tsx: '^4.21.0',
            typescript: '^5.0.0',
            '@types/node': '^24.0.0',
        },
    });

    json('infra/tsconfig.json', {
        compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            lib: ['ES2022'],
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            outDir: 'dist',
        },
        include: ['bin/**/*.ts', 'lib/**/*.ts'],
    });

    w(
        'infra/cdk.json',
        `{
    "app": "tsx bin/app.ts"
}
`,
    );
}

function writeFargateInfra(serviceType) {
    writeInfraBase();

    w(
        'infra/bin/app.ts',
        `import { App } from 'aws-cdk-lib';
import { ${serviceType}FargateStack } from '../lib/${serviceType}-fargate-stack.js';

const app = new App();

const stage = app.node.tryGetContext('stage') ?? process.env.STAGE ?? 'sandbox';

new ${serviceType}FargateStack(app, '${scope}-${name}-fargate', {
    stage,
});
`,
    );

    w(
        `infra/lib/${serviceType}-fargate-stack.ts`,
        `import {
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack,
    StackProps,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecsPatterns,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface ${serviceType}FargateStackProps extends StackProps {
    stage: string;
}

export class ${serviceType}FargateStack extends Stack {
    public constructor(scope: Construct, id: string, props: ${serviceType}FargateStackProps) {
        super(scope, id, props);

        const isProduction = props.stage === 'production';

        const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
            isDefault: true,
        });

        const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

        const executionRole = new iam.Role(this, 'ExecutionRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')],
        });

        const taskRole = new iam.Role(this, 'TaskRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });

        taskRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['ssm:GetParameter', 'ssm:GetParameters'],
                resources: ['*'],
            }),
        );

        const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
            removalPolicy: isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            autoDeleteObjects: !isProduction,
            enforceSSL: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });

        assetsBucket.grantReadWrite(taskRole);

        const repository = ecr.Repository.fromRepositoryName(this, 'Repository', '${scope}/${name}');

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
            cpu: 512,
            memoryLimitMiB: 1024,
            executionRole,
            taskRole,
        });

        taskDefinition.addContainer('AppContainer', {
            image: ecs.ContainerImage.fromEcrRepository(repository),
            portMappings: [{ containerPort: 3000 }],
            logging: ecs.LogDrivers.awsLogs({ streamPrefix: '${name}' }),
            environment: {
                STAGE: props.stage,
                ASSETS_BUCKET_NAME: assetsBucket.bucketName,
            },
        });

        const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
            cluster,
            taskDefinition,
            publicLoadBalancer: true,
            desiredCount: isProduction ? 2 : 1,
            healthCheckGracePeriod: Duration.seconds(60),
        });

        new CfnOutput(this, 'LoadBalancerDns', {
            value: service.loadBalancer.loadBalancerDnsName,
        });

        new CfnOutput(this, 'AssetsBucketName', {
            value: assetsBucket.bucketName,
        });
    }
}
`,
    );
}

function writeServerlessInfra() {
    writeInfraBase();

    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const stackClassName = `${cap(scope)}${cap(name)}ServerlessStack`;

    w(
        'infra/bin/app.ts',
        `import { App } from 'aws-cdk-lib';
import { ${stackClassName} } from '../lib/serverless-stack.js';

const app = new App();

const stage = app.node.tryGetContext('stage') ?? process.env.STAGE ?? 'sandbox';

new ${stackClassName}(app, '${scope}-${name}-serverless', {
    stage,
});
`,
    );

    w(
        'infra/lib/serverless-stack.ts',
        `import {
    CfnOutput,
    RemovalPolicy,
    Stack,
    StackProps,
    aws_iam as iam,
    aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface ServerlessStackProps extends StackProps {
    stage: string;
}

export class ${stackClassName} extends Stack {
    public constructor(scope: Construct, id: string, props: ServerlessStackProps) {
        super(scope, id, props);

        const isProduction = props.stage === 'production';

        const runtimeRole = new iam.Role(this, 'RuntimeRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
        });

        runtimeRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['ssm:GetParameter', 'ssm:GetParameters'],
                resources: ['*'],
            }),
        );

        const dataBucket = new s3.Bucket(this, 'DataBucket', {
            removalPolicy: isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            autoDeleteObjects: !isProduction,
            enforceSSL: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });

        dataBucket.grantReadWrite(runtimeRole);

        new CfnOutput(this, 'RuntimeRoleArn', { value: runtimeRole.roleArn });
        new CfnOutput(this, 'DataBucketName', { value: dataBucket.bucketName });
    }
}
`,
    );

    w(
        'infra/README.md',
        `# Serverless infrastructure overlay

This folder contains CDK infrastructure for @${scope}/${name}.

- Runtime IAM role baseline (CloudWatch logs + SSM access)
- Stage-aware S3 lifecycle behavior:
    - production: RETAIN
    - non-production: DESTROY

## API Gateway pattern requirements

Follow service patterns for HTTP API and optional websocket APIs:

1. Use \`httpApi\` routes with JWT authorizer settings in \`serverless.yml\`.
2. If websocket is required, add websocket routes and pass \`authorizerArn\` through \`serverless-compose.yml\` params.
3. Keep environment-scoped parameter paths under \`/${scope}/\${param:environment}/...\`.
4. Add IAM permissions for websocket management only when websocket routes are enabled.

## Websocket extension checklist

- Add websocket function handler and \`websocket\` event routes.
- Add execute-api ManageConnections IAM statement.
- Add websocket auth middleware/validation pattern consistent with existing services.
`,
    );
}

// ---------------------------------------------------------------------------
// Library workspace
// ---------------------------------------------------------------------------

function generateLibrary() {
    json('package.json', {
        name: pkgName,
        version: '0.0.0',
        private: true,
        type: 'module',
        main: './dist/node/index.js',
        types: './dist/index.d.ts',
        exports: {
            '.': {
                types: './dist/index.d.ts',
                browser: './dist/browser/index.js',
                default: './dist/node/index.js',
            },
        },
        scripts: {
            build: `node --import=tsx --input-type=module -e "import '@${scope}/esbuild/library'"`,
            'generate:types': `tsc -p tsconfig.build.json && node --input-type=module -e "await import('@${scope}/typescript/fix-declaration-paths')"`,
            test: 'vitest run',
            lint: 'eslint .',
            typecheck: 'tsc --noEmit',
            format: 'prettier --write .',
            'format:check': 'prettier --check .',
        },
        devDependencies: {
            [`@${scope}/eslint`]: '*',
            [`@${scope}/prettier`]: '*',
            [`@${scope}/typescript`]: '*',
            [`@${scope}/vitest`]: '*',
            [`@${scope}/esbuild`]: '*',
            eslint: '^10.0.3',
            prettier: '^3.0.0',
            vitest: '^4.0.0',
        },
        'lint-staged': {
            '*.{ts,tsx,js,jsx,mjs,cjs}': 'eslint --fix',
            '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
        },
    });

    writeTsconfig();
    writeTsconfigBuild();
    writeEslintConfig();
    writePrettierConfig();
    writeVitestConfig();
    writeIndexTs();
}

// ---------------------------------------------------------------------------
// Serverless workspace
// ---------------------------------------------------------------------------

function generateServerless() {
    json('package.json', {
        name: pkgName,
        version: '0.0.0',
        private: true,
        type: 'module',
        main: 'dist/handler.js',
        exports: {
            '.': './dist/handler.js',
        },
        scripts: {
            build: `node --import=tsx --input-type=module -e "import '@${scope}/esbuild/service'"`,
            'generate:types': `tsc -p tsconfig.build.json && node --input-type=module -e "await import('@${scope}/typescript/fix-declaration-paths')"`,
            dev: 'serverless offline',
            test: 'vitest run',
            'test:integration': 'vitest run --config vitest.integration.config.ts',
            lint: 'eslint .',
            typecheck: 'tsc --noEmit',
            format: 'prettier --write .',
            'format:check': 'prettier --check .',
        },
        dependencies: {},
        devDependencies: {
            [`@${scope}/eslint`]: '*',
            [`@${scope}/prettier`]: '*',
            [`@${scope}/typescript`]: '*',
            [`@${scope}/vitest`]: '*',
            [`@${scope}/esbuild`]: '*',
            '@eslint/js': '^10.0.0',
            '@types/aws-lambda': '^8.10.0',
            eslint: '^10.0.3',
            prettier: '^3.0.0',
            'serverless-offline': '^14.5.0',
            typescript: '^5.0.0',
            'typescript-eslint': '^8.56.0',
            vitest: '^4.0.0',
        },
        'lint-staged': {
            '*.{ts,tsx,js,jsx,mjs,cjs}': 'eslint --fix',
            '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
        },
    });

    // tsconfig (serverless includes e2e)
    json('tsconfig.json', {
        extends: `@${scope}/typescript/base.json`,
        compilerOptions: {
            baseUrl: '.',
            paths: {
                '@/*': ['./src/*'],
            },
        },
        include: ['src/**/*.ts', 'e2e/**/*.ts'],
    });

    writeTsconfigBuild();
    writeEslintConfig();
    writePrettierConfig();
    writePrettierIgnore();
    writeVitestConfig();

    // serverless.yml
    w(
        'serverless.yml',
        `service: ${scope}-${name}

params:
    production:
        environment: production
    default:
        environment: sandbox

provider:
    name: aws
    runtime: nodejs22.x
    architecture: arm64
    stage: \${opt:stage, 'dev'}
    region: \${opt:region, 'us-east-1'}
    memorySize: 256
    timeout: 29
    environment:
        SERVICE_ENVIRONMENT: \${param:environment}
        PARAMETER_PREFIX: /${scope}/\${param:environment}/${name}
        NODE_OPTIONS: '--enable-source-maps'
    iam:
        role:
            statements:
                - Effect: Allow
                  Action:
                      - logs:CreateLogGroup
                      - logs:CreateLogStream
                      - logs:PutLogEvents
                  Resource: '*'
                - Effect: Allow
                  Action:
                      - ssm:GetParameter
                      - ssm:GetParameters
                  Resource: arn:aws:ssm:\${self:provider.region}:\${aws:accountId}:parameter/${scope}/\${param:environment}/*
    httpApi:
        authorizers:
            jwt:
                type: jwt
                identitySource: $request.header.Authorization
                issuerUrl: https://\${env:AUTH0_DOMAIN}/
                audience:
                    - \${env:AUTH0_AUDIENCE}
        cors:
            allowedOrigins:
                - \${env:ALLOWED_ORIGIN, '*'}
            allowedHeaders:
                - Content-Type
                - Authorization
            allowedMethods:
                - GET
                - POST
                - PUT
                - PATCH
                - DELETE
                - OPTIONS

build:
    esbuild:
        bundle: true
        minify: true
        sourcemap: true
        target: es2022
        platform: node
        format: esm
        mainFields:
            - module
            - main

plugins:
    - serverless-offline

custom:
    serverless-offline:
        httpPort: 3000
        lambdaPort: 3002
        noPrependStageInUrl: true

functions:
    ${name}:
        handler: src/handler.handler
        events:
            - httpApi:
                  path: /${name}
                  method: ANY
                  authorizer:
                      name: jwt
            - httpApi:
                  path: /${name}/{proxy+}
                  method: ANY
                  authorizer:
                      name: jwt

# Extension guidance:
# - Keep REST routes under httpApi event config with explicit auth strategy (a generic JWT authorizer is pre-wired by default).
# - If websocket routes are needed, add a websocket handler/function and websocket events ($connect/$disconnect/$default + custom routes).
# - When websocket is enabled, wire authorizerArn via serverless-compose.yml params and add execute-api:ManageConnections IAM permissions.
# - Ensure AUTH0_DOMAIN and AUTH0_AUDIENCE are provided via environment/parameter management for deployed stages.
`,
    );

    // handler.ts
    w(
        'src/handler.ts',
        `/**
 * Lambda handler entry point for ${pkgName}.
 *
 * @requirements
 * TODO: Define requirements for this service.
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Hello from ${name}' }),
    };
}
`,
    );

    // Also update serverless-compose.yml if it exists at repo root
    updateServerlessCompose();
    writeServerlessInfra();
}

// ---------------------------------------------------------------------------
// Next.js workspace
// ---------------------------------------------------------------------------

function generateNextJs() {
    json('package.json', {
        name: pkgName,
        version: '0.0.0',
        private: true,
        type: 'module',
        scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
            typecheck: 'tsc --noEmit',
            format: 'prettier --write .',
            'format:check': 'prettier --check .',
        },
        dependencies: {
            next: '^15.0.0',
            react: '^19.0.0',
            'react-dom': '^19.0.0',
        },
        devDependencies: {
            [`@${scope}/eslint`]: '*',
            [`@${scope}/prettier`]: '*',
            [`@${scope}/typescript`]: '*',
            '@types/react': '^19.0.0',
            '@types/react-dom': '^19.0.0',
            eslint: '^10.0.3',
            prettier: '^3.0.0',
            typescript: '^5.0.0',
        },
        'lint-staged': {
            '*.{ts,tsx,js,jsx,mjs,cjs}': 'eslint --fix',
            '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
        },
    });

    // Next.js uses Bundler resolution
    json('tsconfig.json', {
        extends: `@${scope}/typescript/base.json`,
        compilerOptions: {
            module: 'ESNext',
            moduleResolution: 'Bundler',
            jsx: 'preserve',
            noEmit: true,
            baseUrl: '.',
            paths: {
                '@/*': ['./src/*'],
                '@web/*': ['./src/*'],
            },
        },
        include: ['src/**/*.ts', 'src/**/*.tsx', 'next-env.d.ts'],
        exclude: ['node_modules', '.next'],
    });

    writeEslintConfig();
    writePrettierConfig();
    writePrettierIgnore();

    // next.config.js
    w(
        'next.config.js',
        `/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [],
};

export default nextConfig;
`,
    );

    // App router layout
    w(
        'src/app/layout.tsx',
        `import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '${scope.charAt(0).toUpperCase() + scope.slice(1)}',
    description: '',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
`,
    );

    // App router page
    w(
        'src/app/page.tsx',
        `export default function HomePage() {
    return (
        <main>
            <h1>${scope.charAt(0).toUpperCase() + scope.slice(1)}</h1>
        </main>
    );
}
`,
    );

    // Barrel export
    w(
        'src/index.ts',
        `/**
 * @${scope}/${name}
 *
 * @requirements
 * TODO: Define requirements for this module.
 */

export {};
`,
    );

    writeFargateInfra('nextjs');
}

// ---------------------------------------------------------------------------
// React Native (Expo) workspace
// ---------------------------------------------------------------------------

function generateReactNative() {
    json('package.json', {
        name: pkgName,
        version: '0.0.0',
        private: true,
        type: 'module',
        main: 'expo-router/entry',
        scripts: {
            dev: 'expo start',
            build: 'expo export',
            lint: 'eslint .',
            typecheck: 'tsc --noEmit',
            format: 'prettier --write .',
            'format:check': 'prettier --check .',
        },
        dependencies: {
            expo: '^53.0.0',
            'expo-router': '^5.0.0',
            react: '^19.0.0',
            'react-native': '^0.79.0',
        },
        devDependencies: {
            [`@${scope}/eslint`]: '*',
            [`@${scope}/prettier`]: '*',
            [`@${scope}/typescript`]: '*',
            '@types/react': '^19.0.0',
            eslint: '^10.0.3',
            prettier: '^3.0.0',
            typescript: '^5.0.0',
        },
        'lint-staged': {
            '*.{ts,tsx,js,jsx,mjs,cjs}': 'eslint --fix',
            '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
        },
    });

    // React Native uses Bundler resolution
    json('tsconfig.json', {
        extends: `@${scope}/typescript/base.json`,
        compilerOptions: {
            module: 'ESNext',
            moduleResolution: 'Bundler',
            jsx: 'react-native',
            noEmit: true,
            baseUrl: '.',
            paths: {
                '@/*': ['./src/*'],
                '@mobile/*': ['./src/*'],
            },
        },
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['node_modules'],
    });

    writeEslintConfig();
    writePrettierConfig();

    // App entry
    w(
        'src/app/index.tsx',
        `import { Text, View } from 'react-native';

export default function HomeScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>${scope.charAt(0).toUpperCase() + scope.slice(1)}</Text>
        </View>
    );
}
`,
    );

    // Barrel export
    w(
        'src/index.ts',
        `/**
 * @${scope}/${name}
 *
 * @requirements
 * TODO: Define requirements for this module.
 */

export {};
`,
    );
}

// ---------------------------------------------------------------------------
// NestJS workspace (Docker optional)
// ---------------------------------------------------------------------------

function generateNestJs() {
    json('package.json', {
        name: pkgName,
        version: '0.0.0',
        private: true,
        type: 'module',
        scripts: {
            build: 'nest build',
            dev: 'nest start --watch',
            start: 'node dist/main.js',
            test: 'vitest run',
            lint: 'eslint .',
            typecheck: 'tsc --noEmit',
            format: 'prettier --write .',
            'format:check': 'prettier --check .',
            'docker:up': 'docker compose up -d',
            'docker:down': 'docker compose down',
        },
        dependencies: {
            '@nestjs/common': '^11.0.0',
            '@nestjs/core': '^11.0.0',
            '@nestjs/platform-express': '^11.0.0',
            'reflect-metadata': '^0.2.0',
        },
        devDependencies: {
            [`@${scope}/eslint`]: '*',
            [`@${scope}/prettier`]: '*',
            [`@${scope}/typescript`]: '*',
            [`@${scope}/vitest`]: '*',
            '@nestjs/cli': '^11.0.0',
            eslint: '^10.0.3',
            prettier: '^3.0.0',
            typescript: '^5.0.0',
            vitest: '^4.0.0',
        },
        'lint-staged': {
            '*.{ts,tsx,js,jsx,mjs,cjs}': 'eslint --fix',
            '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
        },
    });

    writeTsconfig();
    writeTsconfigBuild();
    writeEslintConfig();
    writePrettierConfig();
    writePrettierIgnore();
    writeVitestConfig();

    // Dockerfile (optional local/prod container workflow)
    w(
        'Dockerfile',
        `FROM node:${nodeVersion}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:${nodeVersion}-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
EXPOSE 3000
CMD ["node", "dist/main.js"]
`,
    );

    // docker-compose.yml (optional local workflow)
    w(
        'docker-compose.yml',
        `services:
    ${name}:
        build: .
        ports:
            - "3000:3000"
        environment:
            NODE_ENV: development
`,
    );

    // NestJS entry
    w(
        'src/main.ts',
        `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
}

bootstrap();
`,
    );

    // App module
    w(
        'src/app.module.ts',
        `import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [],
})
export class AppModule {}
`,
    );

    // Barrel export
    w(
        'src/index.ts',
        `/**
 * @${scope}/${name}
 *
 * @requirements
 * TODO: Define requirements for this module.
 */

export {};
`,
    );

    writeFargateInfra('nestjs');
}

// ---------------------------------------------------------------------------
// Serverless Compose integration
// ---------------------------------------------------------------------------

function updateServerlessCompose() {
    const composePath = resolve('serverless-compose.yml');

    if (!existsSync(composePath)) {
        const content = `services:
    ${name}:
        path: ${location}
        # If this service depends on a sibling authorizer service, add:
        #     params:
        #         authorizerArn: \${authorizer.AuthorizerArn}
`;
        writeFileSync(composePath, content, 'utf-8');
        console.log(`  created serverless-compose.yml (new)`);
        return;
    }

    const existing = readFileSync(composePath, 'utf-8');

    if (existing.includes(`    ${name}:`)) {
        console.log(`  serverless-compose.yml already has "${name}" — skipped`);
        return;
    }

    const entry = `\n    ${name}:\n        path: ${location}\n`;
    writeFileSync(composePath, existing + entry, 'utf-8');
    console.log(`  updated serverless-compose.yml — added "${name}"`);
}

// ---------------------------------------------------------------------------
// Root package.json workspace update
// ---------------------------------------------------------------------------

function updateRootWorkspaces() {
    const rootPkgPath = resolve('package.json');
    if (!existsSync(rootPkgPath)) {
        console.log('  root package.json not found — skipped workspace registration');
        return;
    }

    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    const workspaces = rootPkg.workspaces || [];

    // Check if already covered by a glob pattern
    const isGlobCovered = workspaces.some((ws) => {
        if (!ws.includes('*')) {
            return ws === location;
        }

        // Simple glob matching: "src/shared/*" matches "src/shared/models"
        const pattern = ws.replace(/\*/g, '[^/]+');
        return new RegExp(`^${pattern}$`).test(location);
    });

    if (isGlobCovered) {
        console.log(`  workspace "${location}" already covered by existing glob pattern`);
        return;
    }

    // Check if exact path is listed
    if (workspaces.includes(location)) {
        console.log(`  workspace "${location}" already registered`);
        return;
    }

    workspaces.push(location);
    rootPkg.workspaces = workspaces;
    writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 4) + '\n', 'utf-8');
    console.log(`  registered "${location}" in root package.json workspaces`);
}

// ---------------------------------------------------------------------------
// Node version detection (for Dockerfile)
// ---------------------------------------------------------------------------

const nodeVersion = (() => {
    try {
        const nvmrc = readFileSync(resolve('.nvmrc'), 'utf-8').trim();
        return nvmrc;
    } catch {
        return '24';
    }
})();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`\nGenerating ${type} workspace: ${pkgName} at ${location}\n`);
mkdirSync(wsRoot, { recursive: true });

switch (type) {
    case 'library':
        generateLibrary();
        break;
    case 'serverless':
        generateServerless();
        break;
    case 'nextjs':
        generateNextJs();
        break;
    case 'react-native':
        generateReactNative();
        break;
    case 'nestjs':
        generateNestJs();
        break;
}

// Update root workspace registration
updateRootWorkspaces();

console.log(`\n✓ Workspace ${pkgName} generated at ${location}`);
console.log('\nNext steps:');
console.log('  npm install');
console.log(`  npm run build --filter=${pkgName}`);
console.log('');
