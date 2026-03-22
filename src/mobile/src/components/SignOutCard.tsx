/**
 * Destructive sign-out card for the mobile account screen.
 *
 * Renders a bordered card with a prominent sign-out button styled with the
 * destructive theme. This is a pure render component — the actual sign-out
 * logic must be provided via the `onSignOut` callback.
 *
 * @requirements
 * 1. Must render a visually distinct destructive-themed sign-out button.
 * 2. Must delegate sign-out logic entirely to the parent via callback.
 * 3. Must be a pure render component — no hooks, no side effects.
 *
 * @module SignOutCard
 */

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card } from 'tamagui';

/** Props for SignOutCard. */
export interface SignOutCardProps {
    /** Callback for signing the user out. */
    onSignOut: () => void;
}

/**
 * Pure render card containing the destructive sign-out action.
 *
 * @param props - Sign-out callback props.
 * @returns The sign-out card element.
 */
function SignOutCard({ onSignOut }: SignOutCardProps): React.ReactElement {
    return (
        <Card padding="$4" borderWidth={1} borderColor="$destructive" style={styles.signOutCard}>
            <Button size="$4" background="$destructive" onPress={onSignOut} style={styles.signOutButton}>
                Sign Out
            </Button>
        </Card>
    );
}

SignOutCard.displayName = 'SignOutCard';

const styles = StyleSheet.create({
    signOutCard: {
        marginBottom: 32,
        marginHorizontal: 24,
    },
    signOutButton: {
        color: '#ffffff',
        fontWeight: '700',
    },
});

export { SignOutCard };
