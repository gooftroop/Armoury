'use client';

/**
 * Systems card — displays the user's enabled game system badges.
 *
 * Extracted from AccountSettingsView to keep section cards composable.
 *
 * @requirements
 * 1. Must render a Card with the systems heading.
 * 2. Must display a Badge for each enabled system ID.
 * 3. Must show a "no systems" message when the list is empty.
 * 4. Must NOT own any state or perform data fetching.
 * 5. Must NOT use data-testid.
 *
 * @module systems-section
 */

import * as React from 'react';

import type { useTranslations } from 'next-intl';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui/index.js';

/** Props for the SystemsSection component. */
export interface SystemsSectionProps {
    /** Enabled game system IDs for display. */
    systemKeys: string[];
    /** Account-scoped translation function. */
    t: ReturnType<typeof useTranslations>;
}

/**
 * SystemsSection — renders the systems card with badges for each enabled system.
 *
 * @param props - Component props.
 * @returns The rendered systems card.
 */
function SystemsSection({ systemKeys, t }: SystemsSectionProps): React.ReactElement {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('systems.heading')}</CardTitle>
            </CardHeader>
            <CardContent>
                {systemKeys.length === 0 ? (
                    <p className="text-sm text-secondary">{t('systems.none')}</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {systemKeys.map((systemId) => (
                            <Badge key={systemId} variant="secondary">
                                {systemId}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

SystemsSection.displayName = 'SystemsSection';

export { SystemsSection };
