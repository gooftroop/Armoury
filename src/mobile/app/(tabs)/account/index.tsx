/**
 * Account tab screen for the mobile app.
 *
 * Displays the authenticated user's profile summary (avatar, name, email),
 * account preferences (theme, language, notifications), and a sign-out action.
 * Unauthenticated users see a prompt to sign in via Auth0. Account data is
 * fetched and mutated via the `@armoury/clients-users` React Query client library.
 *
 * @requirements
 * 1. Must show user profile (avatar, name, email) from the Auth0 session when authenticated.
 * 2. Must render preferences controls for theme, language, and notifications.
 * 3. Must disable theme and language selectors in V1 with explanatory notes.
 * 4. Must allow toggling notifications and saving preferences via mutationUpdateAccount.
 * 5. Must provide a Sign Out button that calls clearSession().
 * 6. Must show a sign-in prompt when the user is not authenticated.
 * 7. Must use Tamagui components for all styling and layout.
 * 8. Must fetch account data via useQuery with queryAccount from the users client.
 *
 * @module account-screen
 */

import * as React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Avatar,
    Button,
    Card,
    H2,
    H3,
    Label,
    Paragraph,
    ScrollView,
    Separator,
    Switch,
    XStack,
    YStack,
} from 'tamagui';

import {
    queryAccount,
    mutationUpdateAccount,
} from '@armoury/clients-users';
import type { Account, UserPreferences } from '@armoury/clients-users';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Possible states for the save button feedback cycle. */
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Extracts up to two uppercase initials from a display name.
 * Used as the avatar fallback text when no profile picture is available.
 *
 * @param name - The user's display name.
 * @returns Up to two uppercase initials (e.g. "JD" for "Jane Doe").
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
 * Returns the human-readable label for the current save state.
 *
 * @param state - Current save lifecycle state.
 * @returns A user-facing label string.
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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Screen                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Account tab screen.
 *
 * When authenticated, renders the user's profile summary, preference controls,
 * and a sign-out button. When unauthenticated, shows a sign-in prompt with an
 * Auth0 login button.
 *
 * @returns The rendered account screen.
 */
export default function AccountScreen(): React.ReactElement {
    const { user, authorize, clearSession, getCredentials } = useAuth0();
    const isAuthenticated = user !== null && user !== undefined;

    /* ── Local preferences state ─────────────────────────────────────── */
    const [localPreferences, setLocalPreferences] = React.useState<UserPreferences>({
        theme: 'dark',
        language: 'en',
        notificationsEnabled: false,
    });
    const [saveState, setSaveState] = React.useState<SaveState>('idle');

    /* ── Authorization helper ────────────────────────────────────────── */
    const [authorization, setAuthorization] = React.useState<string>('');

    /** Refresh the bearer token whenever the user changes. */
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
    }, [isAuthenticated, getCredentials]);

    /* ── Account query ───────────────────────────────────────────────── */
    const accountQuery = useQuery<Account, Error>({
        ...queryAccount(authorization, { userId: user?.sub ?? '' }),
        enabled: isAuthenticated && authorization.length > 0,
    });

    /** Sync local preferences when account data loads or changes. */
    React.useEffect(() => {
        if (accountQuery.data?.preferences) {
            setLocalPreferences(accountQuery.data.preferences);
        }
    }, [accountQuery.data?.preferences]);

    /* ── Update mutation ─────────────────────────────────────────────── */
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

    /* ── Handlers ────────────────────────────────────────────────────── */

    /** Toggles the notifications preference locally. */
    const handleNotificationsChange = React.useCallback((checked: boolean) => {
        setLocalPreferences((prev: UserPreferences) => ({ ...prev, notificationsEnabled: checked }));
    }, []);

    /** Persists the current local preferences to the API. */
    const handleSavePreferences = React.useCallback(() => {
        updateMutation.mutate();
    }, [updateMutation]);

    /** Signs the user out by clearing the Auth0 session. */
    const handleSignOut = React.useCallback(() => {
        void clearSession();
    }, [clearSession]);

    /** Signs the user in via Auth0. */
    const handleSignIn = React.useCallback(() => {
        void authorize({ scope: 'openid profile email' });
    }, [authorize]);

    /* ── Unauthenticated state ───────────────────────────────────────── */
    if (!isAuthenticated) {
        return (
            <YStack
                flex={1}
                background="$background"
                style={styles.centeredColumn}
            >
                <H2 color="$primary" style={styles.headerMargin}>
                    Account
                </H2>
                <Paragraph color="$mutedForeground" style={styles.unauthSubtitle}>
                    Sign in to manage your account and preferences.
                </Paragraph>
                <Button size="$4" theme="accent" onPress={handleSignIn}>
                    Sign In
                </Button>
            </YStack>
        );
    }

    /* ── Whether local prefs differ from server (enables save button) ── */
    const hasChanges =
        accountQuery.data?.preferences !== undefined &&
        (localPreferences.notificationsEnabled !== accountQuery.data.preferences.notificationsEnabled ||
            localPreferences.theme !== accountQuery.data.preferences.theme ||
            localPreferences.language !== accountQuery.data.preferences.language);

    /* ── Authenticated state ─────────────────────────────────────────── */
    return (
        <ScrollView style={styles.scrollView}>
            {/* ── Profile Section ──────────────────────────────────── */}
            <Card padding="$4" borderWidth={1} borderColor="$borderColor" style={styles.cardMargin}>
                <H3 color="$primary" style={styles.sectionHeadingMargin}>
                    Profile
                </H3>
                <XStack style={styles.profileRow}>
                    <Avatar circular size="$6">
                        {user.picture ? (
                            <Avatar.Image
                                accessibilityLabel={user.name ?? 'User avatar'}
                                src={user.picture}
                            />
                        ) : null}
                        <Avatar.Fallback background="$primary">
                            <Paragraph color="$background" fontWeight="700" fontSize={18}>
                                {getInitials(user.name ?? user.email ?? '?')}
                            </Paragraph>
                        </Avatar.Fallback>
                    </Avatar>
                    <YStack flex={1} gap="$2">
                        <Paragraph color="$primary" fontWeight="600" size="$5">
                            {user.name ?? 'Unknown'}
                        </Paragraph>
                        <Paragraph color="$mutedForeground" size="$2">
                            {user.email ?? ''}
                        </Paragraph>
                    </YStack>
                </XStack>
            </Card>

            {/* ── Preferences Section ──────────────────────────────── */}
            <Card padding="$4" borderWidth={1} borderColor="$borderColor" style={styles.cardMargin}>
                <H3 color="$primary" style={styles.prefHeadingMargin}>
                    Preferences
                </H3>

                {accountQuery.isLoading ? (
                    <YStack style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Paragraph color="$mutedForeground" size="$2" style={styles.loadingText}>
                            Loading preferences…
                        </Paragraph>
                    </YStack>
                ) : (
                    <YStack gap="$5">
                        {/* Theme — disabled in V1 */}
                        <YStack gap="$1">
                            <Label color="$color">Theme</Label>
                            <Paragraph color="$mutedForeground" size="$3">
                                {localPreferences.theme === 'dark' ? 'Dark' : localPreferences.theme === 'light' ? 'Light' : 'Auto'}
                            </Paragraph>
                            <Paragraph color="$mutedForeground" size="$1" opacity={0.7}>
                                Dark only in V1 — more themes coming soon.
                            </Paragraph>
                        </YStack>

                        <Separator />

                        {/* Language — disabled in V1 */}
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

                        {/* Notifications — functional toggle */}
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
                                onCheckedChange={handleNotificationsChange}
                            >
                                <Switch.Thumb />
                            </Switch>
                        </XStack>

                        {/* Save button — shown when changes are detected */}
                        {hasChanges && (
                            <>
                                <Separator />
                                <XStack style={styles.saveRow}>
                                    <Button
                                        size="$3"
                                        theme="accent"
                                        onPress={handleSavePreferences}
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

            {/* ── Sign Out Section ─────────────────────────────────── */}
            <Card
                padding="$4"
                borderWidth={1}
                borderColor="$destructive"
                style={styles.signOutCard}
            >
                <Button
                    size="$4"
                    background="$destructive"
                    onPress={handleSignOut}
                    style={styles.signOutButton}
                >
                    Sign Out
                </Button>
            </Card>
        </ScrollView>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Styles                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Styles for the account screen layout.
 * Matches the dark-theme approach used by the landing screen.
 */
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
    profileRow: {
        alignItems: 'center',
        gap: 16,
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
