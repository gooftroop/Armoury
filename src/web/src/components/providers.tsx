'use client';

/**
 * @requirements
 * 1. Must wrap children in a QueryClientProvider.
 * 2. Must use the SSR-safe getQueryClient factory (not a module-level singleton).
 * 3. Must wrap children in a DataContextProvider for game system lifecycle management.
 * 4. Must wrap children in a SyncQueueProvider for sequential sync execution.
 * 5. Must wrap children in a SyncManifestProvider for session sync tracking.
 * 6. Must wrap children in a PresenceProvider for real-time friend presence.
 * 7. Does NOT include NextIntlClientProvider.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient.js';
import { DataContextProvider } from '@/providers/DataContextProvider.js';
import { SyncQueueProvider } from '@/providers/SyncQueueProvider.js';
import { SyncManifestProvider } from '@/providers/SyncManifestProvider.js';
import { PresenceProvider } from '@/providers/PresenceProvider.js';

/**
 * Properties for the Providers component.
 */
export interface ProvidersProps {
    children: React.ReactNode;
}

/**
 * Global application providers.
 * Wraps the application in TanStack Query for remote state management.
 *
 * @param props - Component properties.
 * @returns The wrapped React tree.
 */
export function Providers({ children }: ProvidersProps) {
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <DataContextProvider>
                <SyncQueueProvider>
                    <SyncManifestProvider>
                        <PresenceProvider>{children}</PresenceProvider>
                    </SyncManifestProvider>
                </SyncQueueProvider>
            </DataContextProvider>
        </QueryClientProvider>
    );
}
