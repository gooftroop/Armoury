/**
 * EmptyState Component
 *
 * A reusable empty state placeholder displayed when a list or collection has no items.
 * Renders an optional icon, title, description, and call-to-action button.
 *
 * @requirements
 * 1. Must export EmptyState component and EmptyStateProps type.
 * 2. Must accept optional icon, title, description, and action props.
 * 3. Must use Tamagui design tokens for theming.
 * 4. Must not own any state or perform data fetching.
 * 5. Must display displayName in React DevTools.
 * 6. Must not use default exports.
 */

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Paragraph, H3 } from 'tamagui';

/**
 * Props for the EmptyState component.
 */
export interface EmptyStateProps {
    /** Optional icon element rendered above the title. */
    icon?: React.ReactNode;

    /** Title text displayed prominently in the empty state. */
    title: string;

    /** Optional description text displayed below the title. */
    description?: string;

    /** Optional action element (typically a Button) rendered below the description. */
    action?: React.ReactNode;
}

/**
 * EmptyState — a placeholder for empty lists or collections.
 *
 * Renders a centered card layout with optional icon, title, description, and action.
 * Designed to guide users toward creating their first item.
 *
 * @param props - Component props including icon, title, description, and action.
 * @returns The rendered EmptyState component.
 */
function EmptyState({ icon, title, description, action }: EmptyStateProps): React.ReactElement {
    return (
        <Card borderWidth={1} borderColor="$borderColor" backgroundColor="$muted" padding="$6" style={styles.card}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}

            <H3 color="$color" style={styles.title}>
                {title}
            </H3>

            {description && (
                <Paragraph color="$mutedForeground" size="$3" style={styles.description}>
                    {description}
                </Paragraph>
            )}

            {action && <View style={styles.actionContainer}>{action}</View>}
        </Card>
    );
}

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
    },
    iconContainer: {
        marginBottom: 16,
        opacity: 0.6,
    },
    title: {
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 300,
    },
    actionContainer: {
        marginTop: 20,
    },
});

export { EmptyState };
