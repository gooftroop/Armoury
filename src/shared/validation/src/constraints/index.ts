/**
 * Constraint parsing and types re-exports for validation rules.
 *
 * NOTE: We use explicit named re-exports instead of `export *` from external
 * packages. esbuild compiles `export *` into a runtime `__reExport` helper,
 * which webpack (used by Next.js) cannot statically analyze — causing
 * "does not provide an export named 'X'" errors at build time.
 */
export { parseConstraint, parseConstraints } from '@/constraints/parser.js';
export type { ParsedConstraint, ConstraintType, ConstraintField, ConstraintScope } from '@/constraints/types.js';
