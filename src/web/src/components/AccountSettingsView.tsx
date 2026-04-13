'use client';

/**
 * Account settings view components.
 *
 * Pure render components for account settings content and loading skeleton.
 *
 * @requirements
 * 1. Must render profile, preferences, systems, and danger zone sections.
 * 2. Must render AccountSettingsLoading skeleton matching page layout.
 * 3. Must not perform data fetching.
 * 4. Must accept all state via props.
 *
 * @module account-settings-view
 */

import type { ReactElement } from 'react';

import type { useTranslations } from 'next-intl';
import type { UserPreferences } from '@armoury/clients-users';

import { Card, CardHeader, CardContent, Skeleton } from '@/components/ui/index.js';
import { ProfileSection } from '@/components/ProfileSection.js';
import { PreferencesSection } from '@/components/PreferencesSection.js';
import { SystemsSection } from '@/components/SystemsSection.js';
import { DangerZoneSection } from '@/components/DangerZoneSection.js';

/** Save button lifecycle state. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Props for the AccountSettingsView component.
 */
export interface AccountSettingsViewProps {
    /** User profile shown in the profile summary card. */
    user: {
        /** Internal user identifier (UUID). */
        userId: string;
        /** User display name. */
        name: string;
        /** User email address. */
        email: string;
        /** URL to the user's profile picture. */
        picture: string;
    };
    /** Locally edited preferences model. */
    localPreferences: UserPreferences;
    /** Current save operation state. */
    saveState: SaveState;
    /** Computed save button label for current save state. */
    saveButtonLabel: string;
    /** Enabled game system IDs for display. */
    systemKeys: string[];
    /** Account translation function. */
    t: ReturnType<typeof useTranslations>;
    /** Profile translation function. */
    tProfile: ReturnType<typeof useTranslations>;
    /** Notifications switch callback. */
    onNotificationsChange: (checked: boolean) => void;
    /** Save preferences callback. */
    onSavePreferences: () => void;
    /** Confirmed account deletion callback. */
    onDeleteAccount: () => void;
}

/**
 * Pure render account settings view with four section cards.
 *
 * @param props - Account settings view props.
 * @returns The rendered account settings page body.
 */
function AccountSettingsView({
    user,
    localPreferences,
    saveState,
    saveButtonLabel,
    systemKeys,
    t,
    tProfile,
    onNotificationsChange,
    onSavePreferences,
    onDeleteAccount,
}: AccountSettingsViewProps): ReactElement {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>

            <ProfileSection user={user} title={tProfile('title')} />

            <PreferencesSection
                localPreferences={localPreferences}
                saveState={saveState}
                saveButtonLabel={saveButtonLabel}
                t={t}
                onNotificationsChange={onNotificationsChange}
                onSavePreferences={onSavePreferences}
            />

            <SystemsSection systemKeys={systemKeys} t={t} />

            <DangerZoneSection t={t} onDeleteAccount={onDeleteAccount} />
        </div>
    );
}

AccountSettingsView.displayName = 'AccountSettingsView';

/**
 * Loading skeleton matching account settings card layout.
 *
 * @returns Skeleton page placeholders.
 */
function AccountSettingsLoading(): ReactElement {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <Skeleton className="h-9 w-64" />

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-6 w-48" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-36" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-64" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-40" />
                </CardContent>
            </Card>
        </div>
    );
}

AccountSettingsLoading.displayName = 'AccountSettingsLoading';

export { AccountSettingsView, AccountSettingsLoading };
