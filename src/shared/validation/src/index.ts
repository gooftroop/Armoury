/**
 * Game-agnostic validation exports for rules, constraints, and effects.
 */
export * from './types.ts';
export { validateArmyWithRules, type ValidationRuleFn } from './engine.ts';
export * from './constraints/index.ts';
export * from './effects/index.ts';
