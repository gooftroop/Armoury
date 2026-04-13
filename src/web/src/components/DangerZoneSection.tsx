'use client';

/**
 * Danger zone card — destructive account actions with confirmation dialog.
 *
 * Extracted from AccountSettingsView so each settings section is its own
 * composable render component.
 *
 * @requirements
 * 1. Must render a Card with red-tinted border and heading.
 * 2. Must render a "Delete Account" button inside an AlertDialog.
 * 3. Must show confirmation title, description, cancel, and confirm actions.
 * 4. Must delegate the confirmed deletion via onDeleteAccount callback.
 * 5. Must NOT own any state or perform data fetching.
 * 6. Must NOT use data-testid.
 *
 * @module danger-zone-section
 */

import type { ReactElement } from 'react';

import type { useTranslations } from 'next-intl';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
    Button,
} from '@/components/ui/index.js';

/** Props for the DangerZoneSection component. */
export interface DangerZoneSectionProps {
    /** Account-scoped translation function. */
    t: ReturnType<typeof useTranslations>;
    /** Confirmed account deletion callback. */
    onDeleteAccount: () => void;
}

/**
 * DangerZoneSection — renders the danger zone card with account deletion dialog.
 *
 * @param props - Component props.
 * @returns The rendered danger zone card.
 */
function DangerZoneSection({ t, onDeleteAccount }: DangerZoneSectionProps): ReactElement {
    return (
        <Card className="border-red-900/50">
            <CardHeader>
                <CardTitle className="text-red-400">{t('danger.heading')}</CardTitle>
            </CardHeader>
            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">{t('danger.deleteAccount')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('danger.deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('danger.deleteConfirmDescription')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('danger.deleteCancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onDeleteAccount}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {t('danger.deleteConfirm')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

DangerZoneSection.displayName = 'DangerZoneSection';

export { DangerZoneSection };
