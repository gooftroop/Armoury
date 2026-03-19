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

import * as React from 'react';

import type { useTranslations } from 'next-intl';
import type { UserPreferences } from '@armoury/clients-users';

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
} from '@/components/ui/index.js';
import { getInitials } from '@/lib/getInitials.js';

/** Save button lifecycle state. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Props for the AccountSettingsView component.
 */
export interface AccountSettingsViewProps {
    /** User profile shown in the profile summary card. */
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
}: AccountSettingsViewProps): React.ReactElement {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>

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

            <Card>
                <CardHeader>
                    <CardTitle>{t('preferences.heading')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
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

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <Label>{t('preferences.notifications')}</Label>
                                <p className="text-xs text-secondary">{t('preferences.notificationsDescription')}</p>
                            </div>
                            <Switch
                                checked={localPreferences.notificationsEnabled}
                                onCheckedChange={onNotificationsChange}
                            />
                        </div>

                        <Separator />

                        <div className="flex justify-end">
                            <Button
                                onClick={onSavePreferences}
                                disabled={saveState === 'saving'}
                                variant={saveState === 'saved' ? 'secondary' : 'primary'}
                            >
                                {saveButtonLabel}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                    onClick={onDeleteAccount}
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

AccountSettingsView.displayName = 'AccountSettingsView';

/**
 * Loading skeleton matching account settings card layout.
 *
 * @returns Skeleton page placeholders.
 */
function AccountSettingsLoading(): React.ReactElement {
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
