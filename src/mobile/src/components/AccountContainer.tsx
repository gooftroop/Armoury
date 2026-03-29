/**
 * Orchestrational container for the mobile account route.
 *
 * @requirements
 * 1. Must own auth, query, mutation, and local preference orchestration.
 * 2. Must delegate rendering to AccountView/AccountUnauthenticatedView.
 * 3. Must preserve existing Auth0 and account preference update behavior.
 *
 * @module account-container
 */

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth0 } from 'react-native-auth0';
import { mutationUpdateAccount, queryAccount } from '@armoury/clients-users';
import type { Account, UserPreferences } from '@armoury/clients-users';

import { AccountUnauthenticatedView, AccountView } from '@/components/AccountView.js';
import type { SaveState } from '@/components/AccountView.js';

/**
 * Returns the user-facing label for account save lifecycle state.
 *
 * @param state - Current save-state value.
 * @returns Save button label.
 */
function getSaveLabel(state: SaveState): string {
    switch (state) {
        case 'saving':
            return 'Saving…';
        case 'saved':
            return 'Saved ✓';
        case 'error':
            return 'Error — Retry';
        default:
            return 'Save Preferences';
    }
}

/**
 * AccountContainer orchestrates account data and auth actions.
 *
 * @returns The appropriate account render view for auth state.
 */
function AccountContainer(): React.ReactElement {
    const { user, authorize, clearSession, getCredentials } = useAuth0();
    const isAuthenticated = user !== null && user !== undefined;
    const [localPreferences, setLocalPreferences] = React.useState<UserPreferences>({
        theme: 'dark',
        language: 'en',
        notificationsEnabled: false,
    });
    const [saveState, setSaveState] = React.useState<SaveState>('idle');
    const [authorization, setAuthorization] = React.useState<string>('');

    React.useEffect(() => {
        if (!isAuthenticated) {
            setAuthorization('');

            return;
        }

        void (async () => {
            const credentials = await getCredentials();

            if (credentials?.accessToken) {
                setAuthorization(`Bearer ${credentials.accessToken}`);
            }
        })();
    }, [getCredentials, isAuthenticated]);

    const accountQuery = useQuery<Account, Error>({
        ...queryAccount(authorization, { userId: user?.sub ?? '' }),
        enabled: isAuthenticated && authorization.length > 0,
    });

    React.useEffect(() => {
        if (accountQuery.data?.preferences) {
            setLocalPreferences(accountQuery.data.preferences);
        }
    }, [accountQuery.data?.preferences]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            const credentials = await getCredentials();

            if (!credentials?.accessToken || !user?.sub) {
                throw new Error('Not authenticated');
            }

            const auth = `Bearer ${credentials.accessToken}`;
            const opts = mutationUpdateAccount(auth, { userId: user.sub }, { preferences: localPreferences });

            return opts.mutationFn!();
        },
        onMutate: () => {
            setSaveState('saving');
        },
        onSuccess: () => {
            setSaveState('saved');
            setTimeout(() => setSaveState('idle'), 2_000);
        },
        onError: () => {
            setSaveState('error');
            setTimeout(() => setSaveState('idle'), 3_000);
        },
    });

    const handleNotificationsChange = React.useCallback((checked: boolean) => {
        setLocalPreferences((previous: UserPreferences) => ({ ...previous, notificationsEnabled: checked }));
    }, []);

    const handleSavePreferences = React.useCallback(() => {
        updateMutation.mutate();
    }, [updateMutation]);

    const handleSignOut = React.useCallback(() => {
        void clearSession();
    }, [clearSession]);

    const handleSignIn = React.useCallback(() => {
        void authorize({ scope: 'openid profile email' });
    }, [authorize]);

    if (!isAuthenticated) {
        return <AccountUnauthenticatedView onSignIn={handleSignIn} />;
    }

    const hasChanges =
        accountQuery.data?.preferences !== undefined &&
        (localPreferences.notificationsEnabled !== accountQuery.data.preferences.notificationsEnabled ||
            localPreferences.theme !== accountQuery.data.preferences.theme ||
            localPreferences.language !== accountQuery.data.preferences.language);

    return (
        <AccountView
            user={{
                name: user.name,
                email: user.email,
                picture: user.picture,
            }}
            localPreferences={localPreferences}
            saveState={saveState}
            hasChanges={hasChanges}
            isLoading={accountQuery.isLoading}
            onNotificationsChange={handleNotificationsChange}
            onSavePreferences={handleSavePreferences}
            onSignOut={handleSignOut}
            getSaveLabel={getSaveLabel}
        />
    );
}

AccountContainer.displayName = 'AccountContainer';

export { AccountContainer };
