'use client';

/**
 * CreateArmyContainer Component
 *
 * Container (orchestrator) for the Create Army flow. Owns form state,
 * validation, save mutation, and navigation. Renders the pure
 * CreateArmyForm component.
 *
 * @requirements
 * 1. Must export CreateArmyContainer component and CreateArmyContainerProps type.
 * 2. Must source faction options from the wh40k10e plugin (FACTION_MAP), not hard-coded UI.
 * 3. Must construct the Army via buildNewArmy and persist via dataContext.armies.save.
 * 4. Must invalidate forge army queries on success.
 * 5. Must navigate to /[locale]/wh40k10e/armies/[armyId] on success.
 * 6. Must navigate back to /[locale]/wh40k10e/armies on cancel.
 * 7. Must preserve form values, re-enable submit, and surface a localized
 *    role=alert error message on save failure.
 * 8. Must auto-enable the current game system when DataContext is idle, mirroring
 *    ForgeContainer to prevent permanent loading after back-navigation.
 * 9. Must not use default exports.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useDataContext } from '@/data/useDataContext.js';
import { resolveGameSystem, useGameSystem } from '@armoury/feature-game-system';
import {
    CreateArmyForm,
    buildNewArmy,
    type CreateArmyFormErrors,
    type CreateArmyFormValues,
    type DetachmentOption,
    type FactionOption,
} from '@armoury/feature-forge';
import type { Army } from '@armoury/wh40k10e';
import { FACTION_MAP, getAllFactionIds } from '@armoury/wh40k10e';

/** Minimum trimmed army name length. */
const MIN_NAME_LENGTH = 3;

/** Maximum army name length. */
const MAX_NAME_LENGTH = 60;

/**
 * Props for the CreateArmyContainer component.
 */
export interface CreateArmyContainerProps {
    /** Internal user identifier of the authenticated owner. */
    userId: string;
    /** Active locale, used to construct locale-prefixed router URLs. */
    locale: string;
}

/** Builds the empty initial form values. */
function getInitialValues(): CreateArmyFormValues {
    return {
        name: '',
        factionId: null,
        detachmentId: null,
        battleSize: null,
    };
}

/** Builds the sorted faction option list from the plugin's FACTION_MAP. */
function buildFactionOptions(): FactionOption[] {
    return getAllFactionIds()
        .map((id) => {
            const config = FACTION_MAP[id];

            return { id, name: config.name } satisfies FactionOption;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Computes per-field validation errors and overall validity.
 *
 * @param values - Current form values.
 * @param detachmentOptions - Detachment options for the selected faction (if any).
 * @param t - Translation function for the armyCreation namespace.
 * @returns Errors map and an isValid flag.
 */
function validate(
    values: CreateArmyFormValues,
    detachmentOptions: readonly DetachmentOption[],
    t: ReturnType<typeof useTranslations>,
): { errors: CreateArmyFormErrors; isValid: boolean } {
    const errors: CreateArmyFormErrors = {};
    const trimmedName = values.name.trim();

    if (trimmedName.length < MIN_NAME_LENGTH) {
        errors.name = t('validation.nameRequired');
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
        errors.name = t('validation.nameMaxLength', { max: MAX_NAME_LENGTH });
    }

    if (!values.factionId) {
        errors.factionId = t('validation.factionRequired');
    }

    if (detachmentOptions.length > 0 && !values.detachmentId) {
        errors.detachmentId = t('validation.detachmentRequired');
    }

    if (!values.battleSize) {
        errors.battleSize = t('validation.battleSizeRequired');
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
}

/**
 * CreateArmyContainer — orchestrator for the Create Army page.
 *
 * Holds form state, derives faction/detachment options from plugin data,
 * validates input, saves via the DataContext, invalidates forge queries,
 * and routes to the new army's editor on success.
 *
 * @param props - Component props.
 * @returns The rendered Create Army form wrapped in container logic.
 */
function CreateArmyContainer({ userId, locale }: CreateArmyContainerProps): ReactElement {
    const t = useTranslations('armyCreation');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { dataContext, status: dcStatus, enableSystem } = useDataContext();
    const gameSystemId = useGameSystem();

    // Auto-enable the game system when DataContext is idle, mirroring
    // ForgeContainer so back-navigation does not strand the user in a
    // permanent loading state.
    useEffect(() => {
        if (dcStatus !== 'idle') {
            return;
        }

        let cancelled = false;

        void resolveGameSystem(gameSystemId).then((system) => {
            if (!cancelled && system) {
                void enableSystem(system);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [dcStatus, enableSystem, gameSystemId]);

    const [values, setValues] = useState<CreateArmyFormValues>(getInitialValues);
    const [saveError, setSaveError] = useState<string | null>(null);

    const factionOptions = useMemo(() => buildFactionOptions(), []);

    // Detachment options require runtime FactionData (loaded from BattleScribe files).
    // Until the DataContext exposes per-faction detachment queries, this remains empty.
    // The form treats an empty list as "detachment not required" per the validation contract.
    const detachmentOptions = useMemo<readonly DetachmentOption[]>(() => [], []);

    // Reset detachmentId whenever the faction changes so stale selections
    // from a previous faction are never submitted.
    useEffect(() => {
        setValues((v: CreateArmyFormValues) => ({ ...v, detachmentId: null }));
    }, [values.factionId]);

    const { errors, isValid } = useMemo(
        () => validate(values, detachmentOptions, t),
        [values, detachmentOptions, t],
    );

    const handleChange = useCallback((next: CreateArmyFormValues) => {
        setValues(next);
        setSaveError(null);
    }, []);

    const saveMutation = useMutation({
        mutationFn: async (army: Army): Promise<Army> => {
            if (!dataContext) {
                throw new Error('DataContext not ready');
            }

            await dataContext.armies.save(army);

            return army;
        },
        onSuccess: async (army) => {
            await queryClient.invalidateQueries({ queryKey: ['armies'] });
            router.push(`/${locale}/wh40k10e/armies/${army.id}`);
        },
        onError: () => {
            setSaveError(t('error'));
        },
    });

    const handleSubmit = useCallback(() => {
        if (!isValid || saveMutation.isPending) {
            return;
        }

        // Validation guarantees these fields are populated.
        if (!values.factionId || !values.battleSize) {
            return;
        }

        setSaveError(null);

        const army = buildNewArmy({
            name: values.name,
            factionId: values.factionId,
            detachmentId: values.detachmentId,
            battleSize: values.battleSize,
            ownerId: userId,
        });

        saveMutation.mutate(army);
    }, [isValid, saveMutation, userId, values]);

    const handleCancel = useCallback(() => {
        router.push(`/${locale}/wh40k10e/armies`);
    }, [locale, router]);

    return (
        <CreateArmyForm
            values={values}
            factionOptions={factionOptions}
            battleSizeOptions={BATTLE_SIZE_OPTIONS}
            detachmentOptions={detachmentOptions}
            errors={errors}
            isValid={isValid}
            saving={saveMutation.isPending}
            saveError={saveError}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        />
    );
}

CreateArmyContainer.displayName = 'CreateArmyContainer';

export { CreateArmyContainer };
