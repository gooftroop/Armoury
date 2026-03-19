/**
 * Pure render views for the mobile account route.
 *
 * @requirements
 * 1. Must render authenticated and unauthenticated account states.
 * 2. Must keep all account UI markup and styles in render-only components.
 * 3. Must avoid auth/query/mutation orchestration hooks.
 *
 * @module account-view
 */

import * as React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Button, Card, H2, H3, Label, Paragraph, ScrollView, Separator, Switch, XStack, YStack } from 'tamagui';
import type { UserPreferences } from '@armoury/clients-users';

import { ProfileCard } from '@/components/ProfileCard.js';

/** Save-button feedback lifecycle states. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Minimal user shape required by account render views.
 */
export interface AccountUserViewModel {
    /** Display name shown in the profile card. */
    name?: string;
    /** Email shown in the profile card. */
    email?: string;
    /** Optional profile image URL for avatar rendering. */
    picture?: string;
}

/**
 * Props for the authenticated account view.
 */
export interface AccountViewProps {
    /** Authenticated user profile fields used by the UI. */
    user: AccountUserViewModel;
    /** Locally edited account preferences. */
    localPreferences: UserPreferences;
    /** Save button feedback state. */
    saveState: SaveState;
    /** Whether unsaved local changes are present. */
    hasChanges: boolean;
    /** Whether account preferences are loading. */
    isLoading: boolean;
    /** Callback for notifications toggle changes. */
    onNotificationsChange: (checked: boolean) => void;
    /** Callback for persisting preference changes. */
    onSavePreferences: () => void;
    /** Callback for signing the user out. */
    onSignOut: () => void;
    /** Label resolver for save button text. */
    getSaveLabel: (state: SaveState) => string;
}

/**
 * Props for the unauthenticated account view.
 */
export interface AccountUnauthenticatedViewProps {
    /** Callback that starts the sign-in flow. */
    onSignIn: () => void;
}

/**
 * Authenticated account render view.
 *
 * @param props - Render props for authenticated account state.
 * @returns Account UI for authenticated users.
 */
function AccountView({
    user,
    localPreferences,
    saveState,
    hasChanges,
    isLoading,
    onNotificationsChange,
    onSavePreferences,
    onSignOut,
    getSaveLabel,
}: AccountViewProps): React.ReactElement {
    return (
        <ScrollView style={styles.scrollView}>
            <Card padding="$4" borderWidth={1} borderColor="$borderColor" style={styles.cardMargin}>
                <H3 color="$primary" style={styles.sectionHeadingMargin}>
                    Profile
                </H3>
                <ProfileCard name={user.name ?? user.email ?? '?'} email={user.email ?? ''} picture={user.picture} />
            </Card>

            <Card padding="$4" borderWidth={1} borderColor="$borderColor" style={styles.cardMargin}>
                <H3 color="$primary" style={styles.prefHeadingMargin}>
                    Preferences
                </H3>

                {isLoading ? (
                    <YStack style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Paragraph color="$mutedForeground" size="$2" style={styles.loadingText}>
                            Loading preferences…
                        </Paragraph>
                    </YStack>
                ) : (
                    <YStack gap="$5">
                        <YStack gap="$1">
                            <Label color="$color">Theme</Label>
                            <Paragraph color="$mutedForeground" size="$3">
                                {localPreferences.theme === 'dark'
                                    ? 'Dark'
                                    : localPreferences.theme === 'light'
                                      ? 'Light'
                                      : 'Auto'}
                            </Paragraph>
                            <Paragraph color="$mutedForeground" size="$1" opacity={0.7}>
                                Dark only in V1 — more themes coming soon.
                            </Paragraph>
                        </YStack>

                        <Separator />

                        <YStack gap="$1">
                            <Label color="$color">Language</Label>
                            <Paragraph color="$mutedForeground" size="$3">
                                {localPreferences.language === 'en' ? 'English' : localPreferences.language}
                            </Paragraph>
                            <Paragraph color="$mutedForeground" size="$1" opacity={0.7}>
                                English only in V1 — localization coming soon.
                            </Paragraph>
                        </YStack>

                        <Separator />

                        <XStack style={styles.notificationRow}>
                            <YStack flex={1} gap="$1" style={styles.notificationLabel}>
                                <Label color="$color">Notifications</Label>
                                <Paragraph color="$mutedForeground" size="$1">
                                    Receive push notifications for campaign updates and friend requests.
                                </Paragraph>
                            </YStack>
                            <Switch
                                size="$3"
                                checked={localPreferences.notificationsEnabled}
                                onCheckedChange={onNotificationsChange}
                            >
                                <Switch.Thumb />
                            </Switch>
                        </XStack>

                        {hasChanges && (
                            <>
                                <Separator />
                                <XStack style={styles.saveRow}>
                                    <Button
                                        size="$3"
                                        theme="accent"
                                        onPress={onSavePreferences}
                                        disabled={saveState === 'saving'}
                                        opacity={saveState === 'saving' ? 0.6 : 1}
                                    >
                                        {getSaveLabel(saveState)}
                                    </Button>
                                </XStack>
                            </>
                        )}
                    </YStack>
                )}
            </Card>

            <Card padding="$4" borderWidth={1} borderColor="$destructive" style={styles.signOutCard}>
                <Button size="$4" background="$destructive" onPress={onSignOut} style={styles.signOutButton}>
                    Sign Out
                </Button>
            </Card>
        </ScrollView>
    );
}

/**
 * Unauthenticated account render view.
 *
 * @param props - Render props for unauthenticated account state.
 * @returns Sign-in prompt UI.
 */
function AccountUnauthenticatedView({ onSignIn }: AccountUnauthenticatedViewProps): React.ReactElement {
    return (
        <YStack flex={1} background="$background" style={styles.centeredColumn}>
            <H2 color="$primary" style={styles.headerMargin}>
                Account
            </H2>
            <Paragraph color="$mutedForeground" style={styles.unauthSubtitle}>
                Sign in to manage your account and preferences.
            </Paragraph>
            <Button size="$4" theme="accent" onPress={onSignIn}>
                Sign In
            </Button>
        </YStack>
    );
}

AccountView.displayName = 'AccountView';
AccountUnauthenticatedView.displayName = 'AccountUnauthenticatedView';

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#0a0c0e',
    },
    centeredColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    headerMargin: {
        marginBottom: 8,
    },
    unauthSubtitle: {
        textAlign: 'center',
        marginBottom: 24,
    },
    cardMargin: {
        marginBottom: 16,
        marginHorizontal: 24,
        marginTop: 8,
    },
    sectionHeadingMargin: {
        marginBottom: 12,
    },
    prefHeadingMargin: {
        marginBottom: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 8,
    },
    notificationRow: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notificationLabel: {
        marginRight: 16,
    },
    saveRow: {
        justifyContent: 'flex-end',
    },
    signOutCard: {
        marginBottom: 32,
        marginHorizontal: 24,
    },
    signOutButton: {
        color: '#ffffff',
        fontWeight: '700',
    },
});

export { AccountView, AccountUnauthenticatedView };
