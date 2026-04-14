/**
 * ArmyCardActions Component
 *
 * Renders action buttons for an army card: Deploy, Duplicate, and Delete.
 * Pure presentational component — delegates all behaviour to parent callbacks.
 *
 * @requirements
 * 1. Must export ArmyCardActions component and ArmyCardActionsProps type.
 * 2. Must render Deploy, Duplicate, and Delete buttons.
 * 3. Must hardcode English labels (no i18n infrastructure on mobile).
 * 4. Must delegate click handling to onDeploy, onDuplicate, onDelete callbacks.
 * 5. Must display displayName in React DevTools.
 * 6. Must not use default exports.
 */

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Paragraph } from 'tamagui';

/**
 * Props for the ArmyCardActions component.
 */
export interface ArmyCardActionsProps {
    /** Callback fired when the Deploy button is pressed. */
    onDeploy: () => void;

    /** Callback fired when the Duplicate button is pressed. */
    onDuplicate: () => void;

    /** Callback fired when the Delete button is pressed. */
    onDelete: () => void;
}

/**
 * ArmyCardActions — action button group for army cards.
 *
 * Renders Deploy (primary), Duplicate (outlined), and Delete (destructive)
 * buttons with hardcoded English labels.
 *
 * @param props - Component props including onDeploy, onDuplicate, and onDelete callbacks.
 * @returns The rendered action buttons.
 */
function ArmyCardActions({ onDeploy, onDuplicate, onDelete }: ArmyCardActionsProps): React.ReactElement {
    return (
        <View style={styles.container}>
            <Button size="$3" background="$primary" onPress={onDeploy}>
                <Paragraph color="white" fontWeight="600" size="$2">
                    Deploy
                </Paragraph>
            </Button>

            <Button size="$3" variant="outlined" onPress={onDuplicate}>
                <Paragraph color="$color" fontWeight="600" size="$2">
                    Duplicate
                </Paragraph>
            </Button>

            <Button size="$3" background="$destructive" onPress={onDelete}>
                <Paragraph color="white" fontWeight="600" size="$2">
                    Delete
                </Paragraph>
            </Button>
        </View>
    );
}

ArmyCardActions.displayName = 'ArmyCardActions';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
    },
});

export { ArmyCardActions };
