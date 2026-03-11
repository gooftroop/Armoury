/**
 * PGlite adapter and DDL helper exports.
 */
export { PGliteAdapter } from '@/adapter.js';
export type { PGliteAdapterConfig } from '@/adapter.js';
export { generateCreateTableSQL, generateAllTablesDDL, getAllTableNames, getTableName } from '@/ddl.js';
