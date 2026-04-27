#!/usr/bin/env node

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(__dirname, 'create-workspace.js');
const SCOPE = 'smoketest';

function setupFakeMonorepo() {
    const root = mkdtempSync(join(tmpdir(), 'bootstrap-smoke-'));
    writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ name: SCOPE, private: true, workspaces: [] }, null, 2),
    );
    return root;
}

function runBootstrap(cwd, args) {
    execFileSync('node', [SCRIPT, ...args, '--scope', SCOPE], { cwd, stdio: 'pipe' });
}

test('serverless workspace generates generic JWT authorizer (no auth0Jwt, no hardcoded scope leak)', () => {
    const root = setupFakeMonorepo();
    try {
        const location = 'src/services/payments';
        runBootstrap(root, ['--name', 'payments', '--location', location, '--type', 'serverless']);

        const serverlessYml = readFileSync(join(root, location, 'serverless.yml'), 'utf-8');
        assert.ok(!serverlessYml.includes('auth0Jwt'), 'serverless.yml must not reference auth0Jwt');
        assert.match(serverlessYml, /authorizers:\s*\n\s*jwt:/, 'serverless.yml must define a generic `jwt` authorizer');
        assert.ok(
            !/PARAMETER_PREFIX:.*\/armoury\//.test(serverlessYml),
            'serverless.yml PARAMETER_PREFIX must not hardcode armoury',
        );
        assert.ok(
            serverlessYml.includes(`PARAMETER_PREFIX: /${SCOPE}/`),
            'serverless.yml PARAMETER_PREFIX must use the scope',
        );
        assert.ok(
            !/parameter\/armoury\//.test(serverlessYml),
            'SSM ARN resource must not hardcode armoury',
        );
        assert.ok(
            serverlessYml.includes(`:parameter/${SCOPE}/`),
            'SSM ARN resource must use the scope',
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('serverless workspace serverless-compose.yml has no unconditional authorizerArn param', () => {
    const root = setupFakeMonorepo();
    try {
        runBootstrap(root, ['--name', 'orders', '--location', 'src/services/orders', '--type', 'serverless']);
        const compose = readFileSync(join(root, 'serverless-compose.yml'), 'utf-8');
        assert.ok(
            !/^\s*authorizerArn:/m.test(compose),
            'serverless-compose.yml must not hardcode authorizerArn as an active param',
        );
        assert.match(compose, /^\s*orders:/m);
        assert.match(compose, /path:\s*src\/services\/orders/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('serverless infra README uses literal backticks (no \\` escapes leaking through)', () => {
    const root = setupFakeMonorepo();
    try {
        runBootstrap(root, ['--name', 'inv', '--location', 'src/services/inv', '--type', 'serverless']);
        const readme = readFileSync(join(root, 'src/services/inv/infra/README.md'), 'utf-8');
        assert.ok(!readme.includes('\\`'), 'infra/README.md must not contain literal backslash-backtick sequences');
        assert.ok(readme.includes('`httpApi`'), 'infra/README.md must contain literal backtick-wrapped code spans');
        assert.ok(!readme.includes('/armoury/'), 'infra/README.md must not hardcode armoury in parameter paths');
        assert.ok(readme.includes(`/${SCOPE}/`), 'infra/README.md must reference the scope in parameter paths');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('serverless infra app.ts and stack.ts share a single derived stack class name', () => {
    const root = setupFakeMonorepo();
    try {
        runBootstrap(root, ['--name', 'billing', '--location', 'src/services/billing', '--type', 'serverless']);
        const appTs = readFileSync(join(root, 'src/services/billing/infra/bin/app.ts'), 'utf-8');
        const stackTs = readFileSync(join(root, 'src/services/billing/infra/lib/serverless-stack.ts'), 'utf-8');
        const expected = `${SCOPE.charAt(0).toUpperCase() + SCOPE.slice(1)}BillingServerlessStack`;
        assert.ok(appTs.includes(expected), `app.ts must reference ${expected}`);
        assert.ok(stackTs.includes(`export class ${expected}`), `stack.ts must export ${expected}`);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('nestjs workspace package.json scripts are uniformly indented', () => {
    const root = setupFakeMonorepo();
    try {
        runBootstrap(root, ['--name', 'api', '--location', 'src/services/api', '--type', 'nestjs']);
        const raw = readFileSync(join(root, 'src/services/api/package.json'), 'utf-8');
        const lines = raw.split('\n');
        const scriptLines = [];
        let inScripts = false;
        let braceDepth = 0;
        for (const line of lines) {
            if (!inScripts && /"scripts"\s*:\s*\{/.test(line)) {
                inScripts = true;
                braceDepth = 1;
                continue;
            }
            if (inScripts) {
                braceDepth += (line.match(/\{/g) || []).length;
                braceDepth -= (line.match(/\}/g) || []).length;
                if (braceDepth <= 0) break;
                if (line.trim().length > 0) scriptLines.push(line);
            }
        }
        assert.ok(scriptLines.length > 0, 'expected at least one script entry');
        const indents = new Set(scriptLines.map((l) => l.match(/^\s*/)[0].length));
        assert.equal(indents.size, 1, `script entries must share the same indent; got ${[...indents].join(',')}`);
        assert.ok(raw.includes('"docker:up"'), 'docker:up script should still be present');
        assert.ok(raw.includes('"docker:down"'), 'docker:down script should still be present');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
