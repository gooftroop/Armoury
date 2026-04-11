import { ContainerModule } from 'inversify';
import { TOKENS } from '@/tokens.js';

/**
 * Core dependency injection module.
 *
 * @requirements
 * - REQ-DI-020: Core module contains only platform-agnostic bindings.
 * - REQ-DI-021: Core module can be loaded by every platform.
 */

const EMPTY_ADAPTER_CONFIG = Object.freeze({});

/**
 * Shared module containing platform-agnostic default bindings.
 */
export const coreModule = new ContainerModule((options) => {
    options.bind(TOKENS.AdapterConfig).toConstantValue(EMPTY_ADAPTER_CONFIG);
});
