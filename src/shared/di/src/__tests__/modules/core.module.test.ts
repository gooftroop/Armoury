import { describe, expect, it } from 'vitest';
import { createContainerWithModules } from '@/container.js';
import { coreModule } from '@/modules/core.module.js';
import { TOKENS } from '@/tokens.js';

describe('coreModule', () => {
    it('loads without errors', () => {
        const container = createContainerWithModules(coreModule);

        expect(container).toBeDefined();
    });

    it('provides adapter config binding', () => {
        const container = createContainerWithModules(coreModule);

        expect(container.isBound(TOKENS.AdapterConfig)).toBe(true);
        expect(container.get<Record<string, unknown>>(TOKENS.AdapterConfig)).toEqual({});
    });
});
