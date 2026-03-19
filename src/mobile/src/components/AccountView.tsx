/**
 * Pure render views for the mobile account route.
 *
 * @requirements
 * 1. Must render authenticated and unauthenticated account states.
 * 2. Must compose sub-components for preferences and sign-out sections.
 * 3. Must keep all account UI markup and styles in render-only components.
 * 4. Must avoid auth/query/mutation orchestration hooks.
 * 5. Must use theme tokens for background — no hardcoded colors.
 *
 * @module account-view
 */

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, H2, H3, Paragraph, ScrollView, YStack, useTheme } from 'tamagui';
import type { UserPreferences } from '@armoury/clients-users';

import { ProfileCard } from '@/components/ProfileCard.js';
import { PreferencesSection } from '@/components/PreferencesSection.js';
import { SignOutCard } from '@/components/SignOutCard.js';

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
    /* Resolve theme background for the native ScrollView — avoids hardcoded color strings. */
    const theme = useTheme();

    return (
        <ScrollView style={[styles.scrollView, { backgroundColor: theme.background?.val }]}>
            <Card padding="$4" borderWidth={1} borderColor="$borderColor" style={styles.cardMargin}>
                <H3 color="$primary" style={styles.sectionHeadingMargin}>
                    Profile
                </H3>
                <ProfileCard name={user.name ?? user.email ?? '?'} email={user.email ?? ''} picture={user.picture} />
            </Card>

            <PreferencesSection
                localPreferences={localPreferences}
                saveState={saveState}
                hasChanges={hasChanges}
                isLoading={isLoading}
                onNotificationsChange={onNotificationsChange}
                onSavePreferences={onSavePreferences}
                getSaveLabel={getSaveLabel}
            />

            <SignOutCard onSignOut={onSignOut} />
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
});

export { AccountView, AccountUnauthenticatedView };
