'use client';

/**
 * Account settings container component.
 *
 * Orchestrates account query/mutations and local form state.
 * Delegates rendering to AccountSettingsView.
 *
 * @requirements
 * 1. Must fetch account with queryAccount.
 * 2. Must manage update and delete mutations.
 * 3. Must sync local preferences from query data.
 * 4. Must return AccountSettingsLoading while loading.
 * 5. Must render AccountSettingsView when ready.
 *
 * @module account-settings-container
 */

import * as React from 'react';

import { useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@tanstack/react-query';

import { queryAccount, mutationUpdateAccount, mutationDeleteAccount } from '@armoury/clients-users';
import type { UserPreferences, Account } from '@armoury/clients-users';

import { AccountSettingsView, AccountSettingsLoading } from '@/components/AccountSettingsView.js';
import type { SaveState } from '@/components/AccountSettingsView.js';

/**
 * Props for the AccountSettings container component.
 */
export interface AccountSettingsProps {
    /** User identity and profile for the authenticated user. */
    user: {
        /** Internal user identifier (UUID) from the Auth0 custom claim. */
        userId: string;
        /** User display name. */
        name: string;
        /** User email address. */
        email: string;
        /** URL to the user's profile picture. */
        picture: string;
    };
    /** Bearer access token for API authorization. */
    accessToken: string;
}

/**
 * Derives the save button label from the current save state.
 *
 * @param saveState - Save operation lifecycle state.
 * @param t - Account translations.
 * @returns Translated save button label.
 */
function getSaveButtonLabel(saveState: SaveState, t: ReturnType<typeof useTranslations>): string {
    switch (saveState) {
        case 'saving':
            return t('preferences.saving');
        case 'saved':
            return t('preferences.saved');
        case 'error':
            return t('preferences.error');
        default:
            return t('preferences.save');
    }
}

/**
 * Extracts enabled system IDs from account data.
 *
 * @param account - Account query result.
 * @returns Enabled system keys.
 */
function extractSystemKeys(account: Account | undefined): string[] {
    if (!account?.systems) {
        return [];
    }

    return Object.keys(account.systems);
}

/**
 * Orchestrates account settings data/state and delegates rendering.
 *
 * @param props - Account settings props.
 * @returns Loading skeleton or account settings view.
 */
function AccountSettingsContainer({ user, accessToken }: AccountSettingsProps): React.ReactElement {
    const t = useTranslations('account');
    const tProfile = useTranslations('profile');

    const authorization = `Bearer ${accessToken}`;
    const params = { userId: user.userId };

    const accountQuery = useQuery<Account, Error>(queryAccount(authorization, params));

    const [localPreferences, setLocalPreferences] = React.useState<UserPreferences>({
        theme: 'dark',
        language: 'en',
        notificationsEnabled: false,
    });
    const [saveState, setSaveState] = React.useState<SaveState>('idle');

    React.useEffect(() => {
        if (accountQuery.data?.preferences) {
            setLocalPreferences(accountQuery.data.preferences);
        }
    }, [accountQuery.data?.preferences]);

    const updateMutation = useMutation({
        mutationFn: (preferences: UserPreferences) => {
            const opts = mutationUpdateAccount(authorization, params, { preferences });

            return opts.mutationFn!();
        },
        onMutate: () => {
            setSaveState('saving');
        },
        onSuccess: () => {
            setSaveState('saved');
            setTimeout(() => setSaveState('idle'), 2000);
        },
        onError: () => {
            setSaveState('error');
            setTimeout(() => setSaveState('idle'), 3000);
        },
    });

    const deleteMutation = useMutation(mutationDeleteAccount(authorization, params));

    const handleSavePreferences = React.useCallback(() => {
        updateMutation.mutate(localPreferences);
    }, [updateMutation, localPreferences]);

    const handleNotificationsChange = React.useCallback((checked: boolean) => {
        setLocalPreferences((prev: UserPreferences) => ({ ...prev, notificationsEnabled: checked }));
    }, []);

    const handleDeleteAccount = React.useCallback(() => {
        deleteMutation.mutate();
    }, [deleteMutation]);

    const saveButtonLabel = React.useMemo(() => getSaveButtonLabel(saveState, t), [saveState, t]);
    const systemKeys = React.useMemo(() => extractSystemKeys(accountQuery.data), [accountQuery.data]);

    if (accountQuery.isLoading) {
        return <AccountSettingsLoading />;
    }

    return (
        <AccountSettingsView
            user={user}
            localPreferences={localPreferences}
            saveState={saveState}
            saveButtonLabel={saveButtonLabel}
            systemKeys={systemKeys}
            t={t}
            tProfile={tProfile}
            onNotificationsChange={handleNotificationsChange}
            onSavePreferences={handleSavePreferences}
            onDeleteAccount={handleDeleteAccount}
        />
    );
}

AccountSettingsContainer.displayName = 'AccountSettingsContainer';

export { AccountSettingsContainer };
export { AccountSettingsContainer as AccountSettings };
