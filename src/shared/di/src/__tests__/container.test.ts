import { ContainerModule } from 'inversify';
import { beforeEach, describe, expect, it } from 'vitest';
import { createContainer, createContainerWithModules } from '@/container.js';

const TEST_TOKEN = Symbol.for('test.token');

describe('container factories', () => {
    beforeEach(() => {
        expect(true).toBe(true);
    });

    it('createContainer returns an inversify container instance', () => {
        const container = createContainer();

        expect(container).toBeDefined();
        expect(typeof container.bind).toBe('function');
        expect(typeof container.load).toBe('function');
        expect(typeof container.get).toBe('function');
    });

    it('createContainerWithModules loads provided modules', () => {
        const module = new ContainerModule((options) => {
            options.bind<number>(TEST_TOKEN).toConstantValue(42);
        });

        const container = createContainerWithModules(module);

        expect(container.get<number>(TEST_TOKEN)).toBe(42);
    });

    it('supports manual binding and resolution', () => {
        const container = createContainer();
        container.bind<string>(TEST_TOKEN).toConstantValue('ok');

        expect(container.get<string>(TEST_TOKEN)).toBe('ok');
    });

    it('supports rebinding for test overrides', () => {
        const container = createContainer();
        container.bind<string>(TEST_TOKEN).toConstantValue('first');

        container.rebind<string>(TEST_TOKEN).toConstantValue('second');

        expect(container.get<string>(TEST_TOKEN)).toBe('second');
    });
});
