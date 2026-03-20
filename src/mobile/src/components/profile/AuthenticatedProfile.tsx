/**
 * Pure render component displaying the authenticated user's profile summary.
 *
 * Shows user avatar, display name, and a settings navigation affordance.
 * Contains no hooks, state, or side effects.
 *
 * @requirements
 * 1. Must render user avatar using Tamagui Avatar with fallback initials.
 * 2. Must render user display name or a sensible fallback.
 * 3. Must render a settings navigation affordance via onSettings callback.
 * 4. Must be a pure render component — no hooks, no side effects.
 *
 * @module authenticated-profile
 */

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, Paragraph, XStack, Button } from 'tamagui';

import { getInitials } from '@/lib/getInitials.js';
/** Props for AuthenticatedProfile. */
export interface AuthenticatedProfileProps {
    /** User display name from Auth0. */
    userName?: string;
    /** User avatar URL from Auth0. */
    userPicture?: string;
    /** Navigation callback to account settings screen. */
    onSettings?: () => void;
}

/**
 * Pure render profile card for authenticated users.
 *
 * @param props - Authenticated profile props.
 * @returns The authenticated profile element.
 */
function AuthenticatedProfile({ userName, userPicture, onSettings }: AuthenticatedProfileProps): React.ReactElement {
    const displayName = userName ?? 'Commander';

    return (
        <XStack gap="$3" style={styles.container}>
            <Avatar circular size="$4">
                {userPicture ? <Avatar.Image accessibilityLabel={`${displayName} avatar`} src={userPicture} /> : null}
                <Avatar.Fallback background="$primaryMuted" style={styles.fallback}>
                    <Paragraph color="$primary" fontWeight="700" size="$3">
                        {getInitials(displayName)}
                    </Paragraph>
                </Avatar.Fallback>
            </Avatar>

            <Paragraph color="$color" fontWeight="600" size="$4" flex={1} numberOfLines={1}>
                Welcome, {displayName}
            </Paragraph>

            {onSettings ? (
                <Button size="$3" chromeless circular accessibilityLabel="Account settings" onPress={onSettings}>
                    <Paragraph size="$5">
                        {/* Gear icon via Unicode — avoids adding icon dependency */}
                        {'\u2699'}
                    </Paragraph>
                </Button>
            ) : null}
        </XStack>
    );
}

AuthenticatedProfile.displayName = 'AuthenticatedProfile';

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
    },
    fallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export { AuthenticatedProfile };
