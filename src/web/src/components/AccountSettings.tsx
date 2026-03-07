'use client';

/**
 * Account Settings client component.
 *
 * Renders the full account settings experience: profile summary, preferences form,
 * game systems overview, and danger zone (account deletion). Fetches and mutates
 * account data via the `@armoury/clients-users` React Query client library.
 *
 * @requirements
 * 1. Must fetch account data via useQuery with queryAccount from @armoury/clients-users.
 * 2. Must display user profile summary (avatar, name, email) from the Auth0 session.
 * 3. Must render a preferences form with theme, language, and notification controls.
 * 4. Must disable theme and language selectors in V1 with explanatory notes.
 * 5. Must allow toggling notifications and saving preferences via mutationUpdateAccount.
 * 6. Must show enabled game systems from the account, or an empty state when none exist.
 * 7. Must provide a danger zone with AlertDialog confirmation for account deletion.
 * 8. Must use next-intl useTranslations for all user-facing strings.
 * 9. Must show loading skeletons while account data is being fetched.
 *
 * @module AccountSettings
 */

import * as React from 'react';

import { useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@tanstack/react-query';

import { queryAccount, mutationUpdateAccount, mutationDeleteAccount } from '@armoury/clients-users';
import type { UserPreferences, Account } from '@armoury/clients-users';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Avatar,
    AvatarImage,
    AvatarFallback,
    Switch,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Label,
    Button,
    Badge,
    Separator,
    Skeleton,
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from '@web/src/components/ui/index.js';

/** Props for the AccountSettings client component. */
export interface AccountSettingsProps {
    /** Auth0 user profile containing sub, name, email, and picture. */
    user: {
        /** Auth0 subject identifier. */
        sub: string;
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

/** Possible states for the save button. */
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Extracts user initials from a display name for avatar fallback.
 *
 * @param name - The user's display name.
 * @returns Up to two uppercase initials.
 */
function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/**
 * Account Settings client component.
 *
 * Provides the full account management UI: profile summary, preferences form,
 * game systems list, and account deletion with confirmation dialog.
 *
 * @param props - Component props containing Auth0 user data and access token.
 * @returns The rendered account settings interface.
 */
export function AccountSettings({ user, accessToken }: AccountSettingsProps): React.ReactElement {
    const t = useTranslations('account');
    const tProfile = useTranslations('profile');

    const authorization = `Bearer ${accessToken}`;
    const params = { userId: user.sub };

    // --- Account data query ---
    const accountQuery = useQuery<Account, Error>(queryAccount(authorization, params));

    // --- Local preferences state ---
    const [localPreferences, setLocalPreferences] = React.useState<UserPreferences>({
        theme: 'dark',
        language: 'en',
        notificationsEnabled: false,
    });
    const [saveState, setSaveState] = React.useState<SaveState>('idle');

    /** Sync local preferences when account data loads. */
    React.useEffect(() => {
        if (accountQuery.data?.preferences) {
            setLocalPreferences(accountQuery.data.preferences);
        }
    }, [accountQuery.data?.preferences]);

    // --- Update mutation ---
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

    // --- Delete mutation ---
    const deleteMutation = useMutation(mutationDeleteAccount(authorization, params));

    /** Handles saving preferences. */
    const handleSavePreferences = React.useCallback(() => {
        updateMutation.mutate(localPreferences);
    }, [updateMutation, localPreferences]);

    /** Handles toggling the notifications switch. */
    const handleNotificationsChange = React.useCallback((checked: boolean) => {
        setLocalPreferences((prev: UserPreferences) => ({ ...prev, notificationsEnabled: checked }));
    }, []);

    /** Handles confirming account deletion. */
    const handleDeleteAccount = React.useCallback(() => {
        deleteMutation.mutate();
    }, [deleteMutation]);

    /** Derives the save button label from the current save state. */
    const saveButtonLabel = React.useMemo((): string => {
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
    }, [saveState, t]);

    /** Extract system keys from account data (future-proof for when Account gains a systems field). */
    const systemKeys: string[] = React.useMemo(() => {
        const account = accountQuery.data as (Account & { systems?: Record<string, unknown> }) | undefined;

        if (!account?.systems) {
            return [];
        }

        return Object.keys(account.systems);
    }, [accountQuery.data]);

    // --- Loading state ---
    if (accountQuery.isLoading) {
        return <AccountSettingsLoading />;
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {/* Page heading */}
            <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>

            {/* Profile Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>{tProfile('title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.picture} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                            <p className="text-lg font-semibold text-primary">{user.name}</p>
                            <p className="text-sm text-secondary">{user.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preferences Form */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('preferences.heading')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        {/* Theme — disabled in V1 */}
                        <div className="flex flex-col gap-2">
                            <Label>{t('preferences.theme')}</Label>
                            <Select value={localPreferences.theme} disabled>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="auto">Auto</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-secondary">{t('preferences.themeDisabledNote')}</p>
                        </div>

                        {/* Language — disabled in V1 */}
                        <div className="flex flex-col gap-2">
                            <Label>{t('preferences.language')}</Label>
                            <Select value={localPreferences.language} disabled>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-secondary">{t('preferences.languageDisabledNote')}</p>
                        </div>

                        <Separator />

                        {/* Notifications — functional */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <Label>{t('preferences.notifications')}</Label>
                                <p className="text-xs text-secondary">{t('preferences.notificationsDescription')}</p>
                            </div>
                            <Switch
                                checked={localPreferences.notificationsEnabled}
                                onCheckedChange={handleNotificationsChange}
                            />
                        </div>

                        <Separator />

                        {/* Save button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSavePreferences}
                                disabled={saveState === 'saving'}
                                variant={saveState === 'saved' ? 'secondary' : 'primary'}
                            >
                                {saveButtonLabel}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Game Systems */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('systems.heading')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {systemKeys.length === 0 ? (
                        <p className="text-sm text-secondary">{t('systems.none')}</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {systemKeys.map((systemId) => (
                                <Badge key={systemId} variant="secondary">
                                    {systemId}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-900/50">
                <CardHeader>
                    <CardTitle className="text-red-400">{t('danger.heading')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">{t('danger.deleteAccount')}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('danger.deleteConfirmTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('danger.deleteConfirmDescription')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('danger.deleteCancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                >
                                    {t('danger.deleteConfirm')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}

AccountSettings.displayName = 'AccountSettings';

/**
 * Loading skeleton for the account settings page.
 * Shown while account data is being fetched.
 *
 * @returns Skeleton placeholder elements matching the account settings layout.
 */
function AccountSettingsLoading(): React.ReactElement {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <Skeleton className="h-9 w-64" />

            {/* Profile skeleton */}
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

            {/* Preferences skeleton */}
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

            {/* Systems skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-36" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-64" />
                </CardContent>
            </Card>

            {/* Danger zone skeleton */}
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
