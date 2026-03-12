/** Record of a broadcast sent during testing. */
export interface BroadcastRecord {
    connectionId: string;
    data: unknown;
}

/**
 * Creates a mock broadcaster that records all send/sendToMany calls.
 * Compatible with both matches (returns boolean) and friends (returns void) broadcaster signatures.
 */
export function createMockBroadcaster(): {
    broadcaster: {
        send: (connectionId: string, data: unknown) => Promise<boolean>;
        sendToMany: (connectionIds: string[], data: unknown) => Promise<string[]>;
    };
    broadcasts: BroadcastRecord[];
    reset: () => void;
} {
    const broadcasts: BroadcastRecord[] = [];

    return {
        broadcaster: {
            send: async (connectionId: string, data: unknown): Promise<boolean> => {
                broadcasts.push({ connectionId, data });

                return false;
            },
            sendToMany: async (connectionIds: string[], data: unknown): Promise<string[]> => {
                for (const id of connectionIds) {
                    broadcasts.push({ connectionId: id, data });
                }

                return [];
            },
        },
        broadcasts,
        reset: () => {
            broadcasts.length = 0;
        },
    };
}
