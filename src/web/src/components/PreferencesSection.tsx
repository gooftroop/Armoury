'use client';

/**
 * Preferences card — theme, language, notifications, and save controls.
 *
 * Extracted from AccountSettingsView so the parent composes section cards
 * instead of inlining all markup.
 *
 * @requirements
 * 1. Must render theme and language selects (both disabled for now).
 * 2. Must render a notifications toggle switch.
 * 3. Must render a save button reflecting the current save lifecycle state.
 * 4. Must delegate all state changes via callback props.
 * 5. Must NOT own any state or perform data fetching.
 * 6. Must NOT use data-testid.
 *
 * @module preferences-section
 */

import * as React from 'react';

import type { useTranslations } from 'next-intl';
import type { UserPreferences } from '@armoury/clients-users';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Label,
    Switch,
    Separator,
    Button,
} from '@/components/ui/index.js';
import type { SaveState } from '@/components/AccountSettingsView.js';

/** Props for the PreferencesSection component. */
export interface PreferencesSectionProps {
    /** Locally edited preferences model. */
    localPreferences: UserPreferences;
    /** Current save operation state. */
    saveState: SaveState;
    /** Computed save button label for current save state. */
    saveButtonLabel: string;
    /** Account-scoped translation function. */
    t: ReturnType<typeof useTranslations>;
    /** Notifications toggle callback. */
    onNotificationsChange: (checked: boolean) => void;
    /** Save preferences callback. */
    onSavePreferences: () => void;
}

/**
 * PreferencesSection — renders the preferences card with theme, language,
 * notifications, and save controls.
 *
 * @param props - Component props.
 * @returns The rendered preferences card.
 */
function PreferencesSection({
    localPreferences,
    saveState,
    saveButtonLabel,
    t,
    onNotificationsChange,
    onSavePreferences,
}: PreferencesSectionProps): React.ReactElement {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('preferences.heading')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <Label>{t('preferences.theme')}</Label>
                        <Select value={localPreferences.theme} disabled>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="auto">Auto</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-secondary">{t('preferences.themeDisabledNote')}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>{t('preferences.language')}</Label>
                        <Select value={localPreferences.language} disabled>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-secondary">{t('preferences.languageDisabledNote')}</p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label>{t('preferences.notifications')}</Label>
                            <p className="text-xs text-secondary">{t('preferences.notificationsDescription')}</p>
                        </div>
                        <Switch
                            checked={localPreferences.notificationsEnabled}
                            onCheckedChange={onNotificationsChange}
                        />
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                        <Button
                            onClick={onSavePreferences}
                            disabled={saveState === 'saving'}
                            variant={saveState === 'saved' ? 'secondary' : 'primary'}
                        >
                            {saveButtonLabel}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

PreferencesSection.displayName = 'PreferencesSection';

export { PreferencesSection };
