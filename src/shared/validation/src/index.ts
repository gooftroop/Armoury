/**
 * Game-agnostic validation exports for rules, constraints, and effects.
 */
export * from '@validation/types.js';
export { validateArmyWithRules, type ValidationRuleFn } from '@validation/engine.js';
export * from '@validation/constraints/index.js';
export * from '@validation/effects/index.js';
