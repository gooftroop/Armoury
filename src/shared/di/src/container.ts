import { Container, ContainerModule } from 'inversify';

/**
 * Container factory helpers for @armoury/di.
 *
 * @requirements
 * - REQ-DI-110: Container creation is centralized and deterministic.
 * - REQ-DI-111: Module composition is supported via a convenience helper.
 */

/**
 * Creates a new empty inversify container.
 *
 * @returns A new container instance.
 */
export function createContainer(): Container {
    return new Container();
}

/**
 * Creates a container and loads all provided modules.
 *
 * @param modules - Container modules to load into the new container.
 * @returns A container instance with all modules loaded.
 */
export function createContainerWithModules(...modules: ContainerModule[]): Container {
    const container = createContainer();
    container.load(...modules);

    return container;
}
