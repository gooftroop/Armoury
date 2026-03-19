/**
 * Profile identity card for the mobile account screen.
 *
 * Renders the user avatar (image or initials fallback), display name, and
 * email inside a horizontal row. This is a pure render component — all
 * data must be passed via props.
 *
 * @requirements
 * 1. Must be a pure render component — no hooks, no side effects.
 * 2. Must render an accessible avatar with fallback initials.
 * 3. Must follow the orchestrational/render split pattern.
 *
 * @module ProfileCard
 */

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, Paragraph, XStack, YStack } from 'tamagui';

import { getInitials } from '@/lib/getInitials.js';

/** Props for ProfileCard. */
export interface ProfileCardProps {
    /** User display name. */
    name: string;
    /** User email address. */
    email: string;
    /** Optional profile image URL. */
    picture?: string;
}

/**
 * Pure render card showing the user's profile identity.
 *
 * @param props - User identity display props.
 * @returns The profile card element.
 */
function ProfileCard({ name, email, picture }: ProfileCardProps): React.ReactElement {
    return (
        <XStack style={styles.profileRow} accessibilityRole="summary" accessibilityLabel={`Profile: ${name}`}>
            <Avatar circular size="$6">
                {picture ? <Avatar.Image accessibilityLabel={name} src={picture} /> : null}
                <Avatar.Fallback background="$primary">
                    <Paragraph color="$background" fontWeight="700" fontSize={18}>
                        {getInitials(name || email || '?')}
                    </Paragraph>
                </Avatar.Fallback>
            </Avatar>
            <YStack flex={1} gap="$2">
                <Paragraph color="$primary" fontWeight="600" size="$5">
                    {name || 'Unknown'}
                </Paragraph>
                <Paragraph color="$mutedForeground" size="$2">
                    {email}
                </Paragraph>
            </YStack>
        </XStack>
    );
}

ProfileCard.displayName = 'ProfileCard';

const styles = StyleSheet.create({
    profileRow: {
        alignItems: 'center',
        gap: 16,
    },
});

export { ProfileCard };
