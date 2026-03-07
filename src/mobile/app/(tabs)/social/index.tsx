/**
 * @requirements
 * 1. Must act as the placeholder screen for "Allies" (social tab).
 * 2. Must use Tamagui components for styling.
 */

import { H2, Paragraph, YStack } from 'tamagui';

/**
 * Allies tab screen.
 *
 * @returns The rendered tab content.
 */
export default function TabScreen() {
    return (
        <YStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '$background' }}>
            <H2 color="$primary">Allies</H2>
            <Paragraph color="$mutedForeground">Placeholder screen.</Paragraph>
        </YStack>
    );
}
