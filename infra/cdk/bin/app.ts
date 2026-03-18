#!/usr/bin/env node

/**
 * CDK app entry point for Armoury infrastructure.
 *
 * Instantiates one DsqlStack per environment (sandbox, production)
 * and a WildcardDomainStack for sandbox only (PR sandbox deployments).
 * Environment-specific configuration is read from `cdk.json` context
 * under the key `armoury:environments`.
 */

import * as cdk from 'aws-cdk-lib';

import { DsqlStack } from '../lib/dsql-stack.js';
import { ProductionDomainStack } from '../lib/production-domain-stack.js';
import { WildcardDomainStack } from '../lib/wildcard-domain-stack.js';

/**
 * @requirements
 * - REQ-APP-001: Create one DSQL stack per environment from cdk.json context.
 * - REQ-APP-002: Each stack must target the region specified in context.
 * - REQ-APP-003: Stack names follow the pattern Armoury-Dsql-<Environment>.
 * - REQ-APP-004: Create a WildcardDomainStack for sandbox environment only.
 * - REQ-APP-005: Create a ProductionDomainStack for production environment only.
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

    // Wildcard domain stack is sandbox-only — provisions shared wildcard
    // custom domains for PR sandbox deployments (REST routing rules + WS API mappings).
    if (envName === 'sandbox') {
        new WildcardDomainStack(app, 'Armoury-WildcardDomain-Sandbox', {
            environment: 'sandbox',
            env: {
                region: config.region,
            },
        });
    }

    if (envName === 'production') {
        new ProductionDomainStack(app, 'Armoury-ProductionDomain', {
            environment: 'production',
            env: {
                region: config.region,
            },
        });
    }
}

app.synth();
