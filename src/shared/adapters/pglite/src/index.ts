/**
 * PGlite adapter and DDL helper exports.
 */
export { PGliteAdapter } from '@adapters-pglite/adapter.js';
export type { PGliteAdapterConfig } from '@adapters-pglite/adapter.js';
export { generateCreateTableSQL, generateAllTablesDDL, getAllTableNames, getTableName } from '@adapters-pglite/ddl.js';
