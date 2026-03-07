/**
 * Type declarations for CSS modules.
 * Allows importing .css files in TypeScript.
 */

declare module '*.css' {
    // CSS modules can be imported, but we treat them as empty modules
    // since Next.js handles CSS import side effects automatically
}
