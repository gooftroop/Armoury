/**
 * ArmyCard Component
 *
 * Renders a single army as a card with name, faction, battle size, unit/points
 * stats, last-modified date, and action buttons. Pure presentational — all
 * behaviour is delegated to parent callbacks.
 *
 * @requirements
 * 1. Must export ArmyCard component and ArmyCardProps type.
 * 2. Must display army name, battle size badge, unit count, points, and last-modified date.
 * 3. Must render ArmyCardActions in the card footer.
 * 4. Must hardcode English labels (no i18n infrastructure on mobile).
 * 5. Must accept onDeploy, onDuplicate, onDelete callbacks passed through to ArmyCardActions.
 * 6. Must display displayName in React DevTools.
 * 7. Must not use default exports.
 */

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Paragraph, H4, YStack } from 'tamagui';

import { ArmyCardActions } from '@/components/forge/ArmyCardActions.js';
import type { Army } from '@armoury/wh40k10e';

/**
 * Props for the ArmyCard component.
 */
export interface ArmyCardProps {
    /** The army data to display. */
    army: Army;

    /** Callback fired when the Deploy button is pressed. */
    onDeploy: () => void;

    /** Callback fired when the Duplicate button is pressed. */
    onDuplicate: () => void;

    /** Callback fired when the Delete button is pressed. */
    onDelete: () => void;
}

/**
 * Formats an ISO 8601 date string into a human-readable medium-format date.
 *
 * @param isoDate - ISO 8601 date string.
 * @returns A formatted date string (e.g. "Mar 12, 2026").
 */
function formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(isoDate));
}

/**
 * ArmyCard — displays a single army as a styled card.
 *
 * Renders the army name + battle size in the header, unit count and point
 * totals in the content area, and Deploy/Duplicate/Delete actions in the footer.
 *
 * @param props - Component props including army data and action callbacks.
 * @returns The rendered army card.
 */
function ArmyCard({ army, onDeploy, onDuplicate, onDelete }: ArmyCardProps): React.ReactElement {
    return (
        <Card borderWidth={1} borderColor="$borderColor" padding="$4">
            <YStack gap="$3">
                {/* Header: name + battle size badge */}
                <View style={styles.header}>
                    <H4 color="$color" numberOfLines={1} style={styles.title}>
                        {army.name}
                    </H4>

                    <View style={styles.badge}>
                        <Paragraph color="$mutedForeground" size="$1" fontWeight="600">
                            {army.battleSize}
                        </Paragraph>
                    </View>
                </View>

                {/* Content: stats */}
                <YStack gap="$1">
                    <Paragraph color="$mutedForeground" size="$2">
                        {army.units.length} {army.units.length === 1 ? 'unit' : 'units'}
                    </Paragraph>

                    <Paragraph color="$mutedForeground" size="$2">
                        {army.totalPoints} / {army.pointsLimit} pts
                    </Paragraph>

                    <Paragraph color="$mutedForeground" size="$1">
                        Last modified {formatDate(army.updatedAt)}
                    </Paragraph>
                </YStack>

                {/* Footer: action buttons */}
                <ArmyCardActions onDeploy={onDeploy} onDuplicate={onDuplicate} onDelete={onDelete} />
            </YStack>
        </Card>
    );
}

ArmyCard.displayName = 'ArmyCard';

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        marginRight: 8,
    },
    badge: {
        backgroundColor: 'rgba(128, 128, 128, 0.15)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
});

export { ArmyCard };
