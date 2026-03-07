/**
 * @requirements
 * 1. Must act as the placeholder screen for "The Forge" (armies tab).
 * 2. Must use Tamagui components for styling.
 */

import { H2, Paragraph, YStack } from 'tamagui';

/**
 * The Forge tab screen.
 *
 * @returns The rendered tab content.
 */
export default function TabScreen() {
    return (
        <YStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '$background' }}>
            <H2 color="$primary">The Forge</H2>
            <Paragraph color="$mutedForeground">Placeholder screen.</Paragraph>
        </YStack>
    );
}
