#!/usr/bin/env node

/**
 * CDK app entry point for Armoury infrastructure.
 *
 * Instantiates one DsqlStack per environment (sandbox, production).
 * Environment-specific configuration is read from `cdk.json` context
 * under the key `armoury:environments`.
 */

import 'source-map-support/register.js';

import * as cdk from 'aws-cdk-lib';

import { DsqlStack } from '../lib/dsql-stack.js';

/**
 * @requirements
 * - REQ-APP-001: Create one DSQL stack per environment from cdk.json context.
 * - REQ-APP-002: Each stack must target the region specified in context.
 * - REQ-APP-003: Stack names follow the pattern Armoury-Dsql-<Environment>.
 */

/** Shape of a single environment entry in cdk.json context. */
interface EnvironmentConfig {
    readonly region: string;
}

const app = new cdk.App();

const environments = app.node.tryGetContext('armoury:environments') as Record<string, EnvironmentConfig> | undefined;

if (!environments) {
    throw new Error(
        'Missing "armoury:environments" context in cdk.json. ' + 'Expected { sandbox: { ... }, production: { ... } }.',
    );
}

for (const [envName, config] of Object.entries(environments)) {
    if (envName !== 'sandbox' && envName !== 'production') {
        throw new Error(`Unknown environment "${envName}". Expected "sandbox" or "production".`);
    }

    new DsqlStack(app, `Armoury-Dsql-${envName.charAt(0).toUpperCase()}${envName.slice(1)}`, {
        environment: envName,
        env: {
            region: config.region,
            // Account is resolved at deploy time from AWS credentials
        },
    });
}

app.synth();
