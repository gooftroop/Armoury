#!/usr/bin/env node

/**
 * Generates a new workspace within an existing monorepo following Armoury patterns.
 *
 * Workspace types:
 *   - library:        Shared library with dual browser+node ESM bundles
 *   - serverless:     AWS Lambda service with Serverless Framework
 *   - nextjs:         Next.js web application
 *   - react-native:   Expo/React Native mobile application
 *   - nestjs-docker:  NestJS service with Docker Compose
 *
 * Usage:
 *   node scripts/create-workspace.js --name <pkg-name> --location <path> --type <type> [--scope <scope>]
 *
 * Example:
 *   node scripts/create-workspace.js --name models --location src/shared/models --type library --scope myapp
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

const VALID_TYPES = ['library', 'serverless', 'nextjs', 'react-native', 'nestjs-docker'];

const name = getArg('name');
const location = getArg('location');
const type = getArg('type');
const scope = getArg('scope') || detectScope();

if (!name || !location || !type) {
    console.error(
        'Usage: node scripts/create-workspace.js --name <pkg-name> --location <path> --type <type> [--scope <scope>]',
    );
    console.error(`Types: ${VALID_TYPES.join(' | ')}`);
    console.error(
        'Example: node scripts/create-workspace.js --name models --location src/shared/models --type library --scope myapp',
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

provider:
    name: aws
    runtime: nodejs22.x
    architecture: arm64
    stage: \${opt:stage, 'dev'}
    region: \${opt:region, 'us-east-1'}
    memorySize: 256
    timeout: 29
    environment:
        NODE_OPTIONS: '--enable-source-maps'

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
            - http:
                  path: /${name}
                  method: ANY
            - http:
                  path: /${name}/{proxy+}
                  method: ANY
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
// NestJS + Docker workspace
// ---------------------------------------------------------------------------

function generateNestJsDocker() {
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

    // Dockerfile
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

    // docker-compose.yml
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
}

// ---------------------------------------------------------------------------
// Serverless Compose integration
// ---------------------------------------------------------------------------

function updateServerlessCompose() {
    const composePath = resolve('serverless-compose.yml');

    if (!existsSync(composePath)) {
        // Create a new serverless-compose.yml
        const content = `services:
    ${name}:
        path: ${location}
`;
        writeFileSync(composePath, content, 'utf-8');
        console.log(`  created serverless-compose.yml (new)`);
        return;
    }

    // Append service to existing file
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
    case 'nestjs-docker':
        generateNestJsDocker();
        break;
}

// Update root workspace registration
updateRootWorkspaces();

console.log(`\n✓ Workspace ${pkgName} generated at ${location}`);
console.log('\nNext steps:');
console.log('  npm install');
console.log(`  npm run build --filter=${pkgName}`);
console.log('');
