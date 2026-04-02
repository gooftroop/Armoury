/**
 * Preferences editing card for the mobile account screen.
 *
 * Renders theme, language, and notification preferences inside a bordered
 * card with a conditional save button. This is a pure render component —
 * all data and callbacks must be passed via props.
 *
 * @requirements
 * 1. Must display current theme, language, and notification settings.
 * 2. Must show a loading indicator while preferences are being fetched.
 * 3. Must reveal a save button only when unsaved changes exist.
 * 4. Must disable the save button while a save is in progress.
 * 5. Must be a pure render component — no hooks, no side effects.
 *
 * @module PreferencesSection
 */

import * as React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Button, Card, H3, Label, Paragraph, Separator, Switch, XStack, YStack } from 'tamagui';
import type { UserPreferences } from '@armoury/clients-users';

import type { SaveState } from '@/components/AccountView.js';

/** Props for PreferencesSection. */
export interface PreferencesSectionProps {
    /** Current user preferences for display and editing. */
    localPreferences: UserPreferences;
    /** Save button feedback state. */
    saveState: SaveState;
    /** Whether unsaved local changes exist. */
    hasChanges: boolean;
    /** Whether preferences are still loading. */
    isLoading: boolean;
    /** Callback when notifications toggle changes. */
    onNotificationsChange: (checked: boolean) => void;
    /** Callback to save preference changes. */
    onSavePreferences: () => void;
    /** Label resolver for save button text. */
    getSaveLabel: (state: SaveState) => string;
}

/**
 * Pure render card showing user preferences with inline editing controls.
 *
 * @param props - Preference display and editing props.
 * @returns The preferences card element.
 */
function PreferencesSection({
    localPreferences,
    saveState,
    hasChanges,
    isLoading,
    onNotificationsChange,
    onSavePreferences,
    getSaveLabel,
}: PreferencesSectionProps): React.ReactElement {
    return (
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
    );
}

PreferencesSection.displayName = 'PreferencesSection';

const styles = StyleSheet.create({
    cardMargin: {
        marginBottom: 16,
        marginHorizontal: 24,
        marginTop: 8,
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
});

export { PreferencesSection };
