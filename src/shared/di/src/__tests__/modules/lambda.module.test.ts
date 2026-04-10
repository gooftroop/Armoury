import { describe, expect, it, vi } from 'vitest';
import { createContainerWithModules } from '@/container.js';
import { createLambdaModule } from '@/modules/lambda.module.js';
import { TOKENS } from '@/tokens.js';

const { dsqlConstructorMock } = vi.hoisted(() => {
    return {
        dsqlConstructorMock: vi.fn(function dsqlConstructor(config: unknown) {
            return {
                config,
            };
        }),
    };
});

vi.mock('@armoury/adapters-dsql', () => {
    class MockDSQLAdapter {
        readonly config: unknown;

        constructor(config: unknown) {
            this.config = config;
            dsqlConstructorMock(config);
        }
    }

    return {
        DSQLAdapter: MockDSQLAdapter,
    };
});

describe('createLambdaModule', () => {
    it('returns a ContainerModule that can be loaded', () => {
        const module = createLambdaModule({ clusterEndpoint: 'endpoint', region: 'us-east-1' });
        const container = createContainerWithModules(module);

        expect(container).toBeDefined();
        expect(container.isBound(TOKENS.DatabaseAdapter)).toBe(true);
    });

    it('binds DatabaseAdapter in singleton scope', () => {
        const module = createLambdaModule({ clusterEndpoint: 'cluster', region: 'eu-west-1' });
        const container = createContainerWithModules(module);

        const first = container.get<{ config: unknown }>(TOKENS.DatabaseAdapter);
        const second = container.get<{ config: unknown }>(TOKENS.DatabaseAdapter);

        expect(first).toBe(second);
        expect(dsqlConstructorMock).toHaveBeenCalledTimes(1);
    });

    it('passes configuration values through to DSQLAdapter', () => {
        const config = { clusterEndpoint: 'dsql.example', region: 'us-west-2' };
        const module = createLambdaModule(config);
        const container = createContainerWithModules(module);

        const adapter = container.get<{ config: typeof config }>(TOKENS.DatabaseAdapter);

        expect(adapter.config).toEqual(config);
        expect(container.get(TOKENS.DSQLConfig)).toEqual(config);
    });
});
