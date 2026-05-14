'use client';

/**
 * @requirements
 * 1. Must wrap children in a QueryClientProvider.
 * 2. Must use the SSR-safe getQueryClient factory (not a module-level singleton).
 * 3. Must wrap children in a DataContextManagerProvider for game system lifecycle management.
 * 4. Must wrap children in a SyncManifestProvider for session sync tracking.
 * 5. Must wrap children in a PresenceProvider for real-time friend presence.
 * 6. Does NOT include NextIntlClientProvider.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@armoury/query';
import { DataContextManagerProvider } from '@/data/managerContext.js';
import { SyncManifestProvider } from '@/providers/SyncManifestProvider.js';
import { PresenceProvider } from '@armoury/feature-profile';

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
            <DataContextManagerProvider>
                <SyncManifestProvider>
                    <PresenceProvider>{children}</PresenceProvider>
                </SyncManifestProvider>
            </DataContextManagerProvider>
        </QueryClientProvider>
    );
}
