/** Record of a broadcast sent during testing. */
export interface BroadcastRecord {
    connectionId: string;
    data: unknown;
}
/**
 * Creates a mock broadcaster that records all send/sendToMany calls.
 * Compatible with both matches (returns boolean) and friends (returns void) broadcaster signatures.
 */
export declare function createMockBroadcaster(): {
    broadcaster: {
        send: (connectionId: string, data: unknown) => Promise<boolean>;
        sendToMany: (connectionIds: string[], data: unknown) => Promise<string[]>;
    };
    broadcasts: BroadcastRecord[];
    reset: () => void;
};
//# sourceMappingURL=mockBroadcaster.d.ts.map
