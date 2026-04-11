import * as React from 'react';
import type { DimensionValue } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Paragraph } from 'tamagui';

export interface ProgressBarProps {
    phase: string;
    completed: number;
    total: number;
    failures: number;
}

function ProgressBar({ phase, completed, total, failures }: ProgressBarProps): React.ReactElement {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const fillWidth: DimensionValue = `${percentage}%`;

    return (
        <View
            style={styles.container}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: percentage }}
            accessibilityLabel="Sync progress"
        >
            <Paragraph color="#ffffffE6" fontWeight="600" size="$2" textTransform="uppercase" letterSpacing={1}>
                {phase}
            </Paragraph>

            <View style={styles.trackOuter}>
                <View style={[styles.trackFill, { width: fillWidth }]} />
            </View>

            <Paragraph color="#ffffff99" size="$1">
                {String(completed)}/{String(total)}
            </Paragraph>

            {failures > 0 && (
                <Paragraph color="$destructive" size="$1">
                    {String(failures)} failed
                </Paragraph>
            )}
        </View>
    );
}

ProgressBar.displayName = 'ProgressBar';

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 6,
    },
    trackOuter: {
        width: 128,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
    },
    trackFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
});

export { ProgressBar };
