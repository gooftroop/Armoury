/**
 * Game-agnostic validation exports for rules, constraints, and effects.
 */
export * from '@/types.js';
export { validateArmyWithRules, type ValidationRuleFn } from '@/engine.js';
export * from '@/constraints/index.js';
export * from '@/effects/index.js';
