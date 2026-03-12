/**
 * DDL generation utilities for Drizzle pgTable objects.
 * Introspects Drizzle table definitions via Symbol-keyed metadata
 * and produces CREATE TABLE IF NOT EXISTS SQL statements.
 *
 * Used by the PGliteAdapter for auto-table-creation and by e2e test helpers
 * to bootstrap PostgreSQL databases from the merged Drizzle schema.
 */

import { getMergedDSQLSchema } from '@armoury/data-dao';

interface DrizzleColumn {
    name: string;
    dataType: string;
    columnType: string;
    notNull: boolean;
    primary: boolean;
}

type SymbolTableEntry = Record<string, DrizzleColumn>;

type DrizzleTableIntrospection = Record<string | symbol, unknown>;

function mapDrizzleTypeToSQL(dataType: string, columnType: string): string {
    if (columnType === 'PgJsonb' || dataType === 'json') {
        return 'JSONB';
    }

    if (columnType === 'PgBoolean' || dataType === 'boolean') {
        return 'BOOLEAN';
    }

    if (columnType === 'PgTimestamp' || dataType === 'date') {
        return 'TIMESTAMP';
    }

    if (columnType === 'PgInteger' || dataType === 'number') {
        return 'INTEGER';
    }

    return 'TEXT';
}

/**
 * Introspects a Drizzle pgTable object and generates a CREATE TABLE IF NOT EXISTS SQL statement.
 * Drizzle tables store column metadata in a Symbol-keyed property (the symbol containing 'Columns').
 * @param table - A Drizzle pgTable object to introspect
 * @returns The CREATE TABLE SQL string, or null if introspection fails
 */
export function generateCreateTableSQL(table: DrizzleTableIntrospection): string | null {
    const tableSymbol = Object.getOwnPropertySymbols(table).find((s) => s.toString().includes('Columns'));

    if (!tableSymbol) {
        return null;
    }

    const columns = table[tableSymbol] as SymbolTableEntry;

    if (!columns || typeof columns !== 'object') {
        return null;
    }

    const nameSymbol = Object.getOwnPropertySymbols(table).find((s) => s.toString().includes('Name'));
    const tableName = nameSymbol ? String(table[nameSymbol]) : 'unknown';

    const columnDefs: string[] = [];
    const primaryKeys: string[] = [];

    for (const [_field, col] of Object.entries(columns)) {
        const colName = col.name;
        const sqlType = mapDrizzleTypeToSQL(col.dataType, col.columnType);
        let def = `"${colName}" ${sqlType}`;

        if (col.notNull) {
            def += ' NOT NULL';
        }

        if (col.primary) {
            primaryKeys.push(colName);
        }

        columnDefs.push(def);
    }

    if (primaryKeys.length === 1) {
        const pkCol = primaryKeys[0];
        const idx = columnDefs.findIndex((d) => d.startsWith(`"${pkCol}"`));

        if (idx !== -1) {
            columnDefs[idx] += ' PRIMARY KEY';
        }
    } else if (primaryKeys.length > 1) {
        columnDefs.push(`PRIMARY KEY (${primaryKeys.map((k) => `"${k}"`).join(', ')})`);
    }

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columnDefs.join(',\n  ')}\n);`;
}

/**
 * Extracts the PostgreSQL table name from a Drizzle pgTable object.
 * Reads the Symbol-keyed 'Name' property set by Drizzle's pgTable() factory.
 * @param table - A Drizzle pgTable object
 * @returns The table name, or null if it cannot be determined
 */
export function getTableName(table: Record<string | symbol, unknown>): string | null {
    const nameSymbol = Object.getOwnPropertySymbols(table).find((s) => s.toString().includes('Name'));

    return nameSymbol ? String(table[nameSymbol]) : null;
}

/**
 * Generates DDL for all tables in the merged DSQL schema registry.
 * Iterates over all registered Drizzle table definitions and produces
 * a concatenated SQL string of CREATE TABLE IF NOT EXISTS statements.
 * @returns A single SQL string containing all CREATE TABLE statements
 */
export function generateAllTablesDDL(): string {
    const mergedSchema = getMergedDSQLSchema();
    const ddlStatements: string[] = [];

    for (const [_name, table] of Object.entries(mergedSchema.tables)) {
        const ddl = generateCreateTableSQL(table as DrizzleTableIntrospection);

        if (ddl) {
            ddlStatements.push(ddl);
        }
    }

    return ddlStatements.join('\n');
}

/**
 * Returns all table names from the merged DSQL schema registry.
 * Useful for TRUNCATE CASCADE operations in test teardown.
 * @returns Array of PostgreSQL table names
 */
export function getAllTableNames(): string[] {
    const mergedSchema = getMergedDSQLSchema();
    const tableNames: string[] = [];

    for (const [_name, table] of Object.entries(mergedSchema.tables)) {
        const name = getTableName(table as Record<string | symbol, unknown>);

        if (name) {
            tableNames.push(name);
        }
    }

    return tableNames;
}
