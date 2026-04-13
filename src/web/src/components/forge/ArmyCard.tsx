'use client';

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
 * 3. Must render ArmyCardActions in the CardFooter.
 * 4. Must use next-intl useTranslations for all user-facing strings.
 * 5. Must accept onDeploy, onDuplicate, onDelete callbacks passed through to ArmyCardActions.
 * 6. Must display displayName in React DevTools.
 * 7. Must not use default exports.
 */

import type { ReactElement } from 'react';

import { useTranslations } from 'next-intl';

import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge } from '@/components/ui/index.js';
import { ArmyCardActions } from '@/components/forge/ArmyCardActions.js';
import type { Army } from '@armoury/wh40k10e';

/**
 * Props for the ArmyCard component.
 */
export interface ArmyCardProps {
    /** The army data to display. */
    army: Army;

    /** Callback fired when the Deploy button is clicked. */
    onDeploy: () => void;

    /** Callback fired when the Duplicate button is clicked. */
    onDuplicate: () => void;

    /** Callback fired when the Delete button is clicked. */
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
function ArmyCard({ army, onDeploy, onDuplicate, onDelete }: ArmyCardProps): ReactElement {
    const t = useTranslations('forge.card');

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{army.name}</CardTitle>
                <Badge variant="secondary">{army.battleSize}</Badge>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>{t('units', { count: army.units.length })}</span>
                    <span>{t('points', { current: army.totalPoints, limit: army.pointsLimit })}</span>
                    <span className="text-xs">{t('lastModified', { date: formatDate(army.updatedAt) })}</span>
                </div>
            </CardContent>
            <CardFooter>
                <ArmyCardActions onDeploy={onDeploy} onDuplicate={onDuplicate} onDelete={onDelete} />
            </CardFooter>
        </Card>
    );
}

ArmyCard.displayName = 'ArmyCard';

export { ArmyCard };
