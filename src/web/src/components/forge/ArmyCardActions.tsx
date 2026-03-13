'use client';

/**
 * ArmyCardActions Component
 *
 * Renders action buttons for an army card: Deploy, Duplicate, and Delete.
 * Pure presentational component — delegates all behaviour to parent callbacks.
 *
 * @requirements
 * 1. Must export ArmyCardActions component and ArmyCardActionsProps type.
 * 2. Must render Deploy, Duplicate, and Delete buttons with Lucide icons.
 * 3. Must use next-intl useTranslations for all user-facing strings.
 * 4. Must delegate click handling to onDeploy, onDuplicate, onDelete callbacks.
 * 5. Must display displayName in React DevTools.
 * 6. Must not use default exports.
 */

import * as React from 'react';

import { useTranslations } from 'next-intl';
import { Swords, Copy, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/index.js';

/**
 * Props for the ArmyCardActions component.
 */
export interface ArmyCardActionsProps {
    /** Callback fired when the Deploy button is clicked. */
    onDeploy: () => void;

    /** Callback fired when the Duplicate button is clicked. */
    onDuplicate: () => void;

    /** Callback fired when the Delete button is clicked. */
    onDelete: () => void;
}

/**
 * ArmyCardActions — action button group for army cards.
 *
 * Renders Deploy (primary), Duplicate (ghost), and Delete (ghost/destructive)
 * buttons with appropriate icons and i18n labels.
 *
 * @param props - Component props including onDeploy, onDuplicate, and onDelete callbacks.
 * @returns The rendered action buttons.
 */
function ArmyCardActions({ onDeploy, onDuplicate, onDelete }: ArmyCardActionsProps): React.ReactElement {
    const t = useTranslations('forge.actions');

    return (
        <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={onDeploy}>
                <Swords className="mr-2 h-4 w-4" />
                {t('deploy')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                {t('duplicate')}
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('delete')}
            </Button>
        </div>
    );
}

ArmyCardActions.displayName = 'ArmyCardActions';

export { ArmyCardActions };
