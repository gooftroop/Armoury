'use client';

/**
 * @requirements
 * 1. Must wrap children in a QueryClientProvider.
 * 2. Must use the SSR-safe getQueryClient factory (not a module-level singleton).
 * 3. Must wrap children in a DataContextProvider for game system lifecycle management.
 * 4. Does NOT include NextIntlClientProvider.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient.js';
import { DataContextProvider } from '@/providers/DataContextProvider.js';

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
            <DataContextProvider>{children}</DataContextProvider>
        </QueryClientProvider>
    );
}
