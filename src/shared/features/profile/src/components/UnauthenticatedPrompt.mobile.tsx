/**
 * Pure render prompt card encouraging unauthenticated users to sign in.
 *
 * Renders a visually appealing Tamagui Card with prominent sign-in and
 * secondary create-account actions. Adapted from the web ProfileTile's
 * visual intent for the Tamagui design system.
 *
 * @requirements
 * 1. Must render a modern card with clear sign-in and create-account CTAs.
 * 2. Must use Tamagui Card, Button with accent theme, and proper spacing.
 * 3. Must be a pure render component — no hooks, no side effects.
 * 4. Sign-in button must be prominent (size $4, accent theme).
 * 5. Create-account button must be secondary/chromeless.
 *
 * @module unauthenticated-prompt
 */

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, Paragraph, YStack } from 'tamagui';

/** Props for UnauthenticatedPrompt. */
export interface UnauthenticatedPromptProps {
    /** Auth callback for sign-in action. */
    onSignIn: () => void;
    /** Auth callback for create-account action. */
    onCreateAccount: () => void;
}

/**
 * Pure render card prompting sign-in or account creation.
 *
 * @param props - Unauthenticated prompt props.
 * @returns The unauthenticated prompt card element.
 */
function UnauthenticatedPrompt({ onSignIn, onCreateAccount }: UnauthenticatedPromptProps): React.ReactElement {
    return (
        <Card borderWidth={1} size="$4" borderColor="$borderColor" backgroundColor="$card" style={styles.card}>
            <Card.Header>
                <Paragraph color="$color" fontWeight="700" size="$5">
                    Welcome to Armoury
                </Paragraph>
                <Paragraph color="$mutedForeground" size="$3">
                    Sign in to manage your armies, track campaigns, and sync across devices.
                </Paragraph>
            </Card.Header>

            <YStack gap="$3" style={styles.actions}>
                <Button size="$4" theme="accent" accessibilityLabel="Sign in to your account" onPress={onSignIn}>
                    <Paragraph fontWeight="700">Sign In</Paragraph>
                </Button>

                <Button size="$3" chromeless accessibilityLabel="Create a new account" onPress={onCreateAccount}>
                    <Paragraph color="$mutedForeground" size="$3">
                        New here? Create an account
                    </Paragraph>
                </Button>
            </YStack>
        </Card>
    );
}

UnauthenticatedPrompt.displayName = 'UnauthenticatedPrompt';

const styles = StyleSheet.create({
    card: {
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
        padding: 16,
    },
    actions: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
});

export { UnauthenticatedPrompt };
