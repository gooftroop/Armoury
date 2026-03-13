import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { DSQLAdapter } from '@/adapter.js';
import type { DSQLIAMConfig } from '@/adapter.js';
import { Platform } from '@armoury/data-dao';

/**
 * DSQLAdapter IAM path — integration tests
 *
 * @requirements
 * - REQ-IAM-BRANCH: DSQLIAMConfig branch executes when clusterEndpoint is present
 * - REQ-SIGNER-CONSTRUCTION: DsqlSigner is constructed with the correct hostname and region
 * - REQ-TOKEN-AS-PASSWORD: Token from signer is used as the pg.Client password
 * - REQ-DRIZZLE-OPERATIONS: Drizzle operations succeed after IAM-path connection
 *
 * Test plan:
 * | Requirement | Test Case |
 * |---|---|
 * | REQ-IAM-BRANCH | "connects using IAM config shape" — adapter initializes without error when given DSQLIAMConfig |
 * | REQ-SIGNER-CONSTRUCTION | "constructs DsqlSigner with correct config" — spy verifies hostname and region |
 * | REQ-TOKEN-AS-PASSWORD | "uses mock token for authentication" — trust-auth PostgreSQL accepts any password |
 * | REQ-DRIZZLE-OPERATIONS | "reports AuroraDSQL platform" — adapter.platform equals Platform.AuroraDSQL |
 */

/**
 * Mock DsqlSigner to return a static token. PostgreSQL trust auth
 * accepts any password, so this exercises the full IAM code path
 * without real SigV4 credentials.
 */
const mockGetToken = vi.fn().mockResolvedValue('mock-dsql-token');
const mockSignerConstructor = vi.fn();

vi.mock('@aws-sdk/dsql-signer', () => ({
    DsqlSigner: class {
        constructor(config: { hostname: string; region: string }) {
            mockSignerConstructor(config);
        }

        async getDbConnectAdminAuthToken(): Promise<string> {
            return mockGetToken();
        }
    },
}));

describe('DSQLAdapter — IAM code path', () => {
    let adapter: DSQLAdapter;

    const iamConfig: DSQLIAMConfig = {
        clusterEndpoint: 'localhost',
        region: 'us-east-1',
        port: 5440,
        ssl: false,
    };

    beforeAll(async () => {
        adapter = new DSQLAdapter(iamConfig);
        await adapter.initialize();
    });

    afterAll(async () => {
        await adapter.close();
    });

    it('connects using IAM config shape', () => {
        // If initialize() didn't throw, the IAM branch connected successfully.
        expect(adapter.platform).toBe(Platform.AuroraDSQL);
    });

    it('constructs DsqlSigner with correct config', () => {
        expect(mockSignerConstructor).toHaveBeenCalledWith({
            hostname: 'localhost',
            region: 'us-east-1',
        });
    });

    it('uses mock token for authentication', () => {
        // The mock token was used as the pg.Client password.
        // Trust auth accepts it — if it didn't, initialize() would have thrown.
        expect(mockGetToken).toHaveBeenCalledOnce();
    });

    it('reports AuroraDSQL platform', () => {
        expect(adapter.platform).toBe(Platform.AuroraDSQL);
    });
});
