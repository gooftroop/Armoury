'use client';

/**
 * CreateArmyForm Component
 *
 * Pure presentational form for creating a new army. Owns no data fetching,
 * no DAO calls, no router calls — all values, options, validation errors,
 * and handlers are passed in via props by a parent container.
 *
 * @requirements
 * 1. Must export CreateArmyForm component, CreateArmyFormProps, CreateArmyFormValues, CreateArmyFormErrors, FactionOption, DetachmentOption.
 * 2. Must render Army Name (text), Faction (select), Detachment (select), Battle Size (select) controls.
 * 3. Must use next-intl useTranslations for all user-facing strings (armyCreation namespace).
 * 4. Must associate inline validation errors with fields via aria-describedby and aria-invalid.
 * 5. Must disable submit when isValid is false or saving is true.
 * 6. Must show a save error region (role=alert) when saveError is provided.
 * 7. Must derive battle size options from a fixed preset list (Incursion, StrikeForce, Onslaught).
 * 8. Must accept factionOptions and detachmentOptions as props (no hard-coded UI lists).
 * 9. Must call onChange / onSubmit / onCancel callbacks; never perform side effects itself.
 * 10. Must not use default exports.
 */

import { useId, useCallback, type FormEvent, type ReactElement } from 'react';

import { useTranslations } from 'next-intl';

import {
    Button,
    Input,
    Label,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@armoury/ui';
import type { BattleSize } from '@armoury/wh40k10e';

/** Preset battle sizes. Order matches the form select. */
const BATTLE_SIZE_OPTIONS: readonly BattleSize[] = ['Incursion', 'StrikeForce', 'Onslaught'] as const;

/** A faction option provided by the parent / plugin data. */
export interface FactionOption {
    /** Stable faction identifier. */
    id: string;
    /** User-visible faction label. */
    name: string;
}

/** A detachment option for the currently-selected faction. */
export interface DetachmentOption {
    /** Stable detachment identifier. */
    id: string;
    /** User-visible detachment label. */
    name: string;
}

/** Mutable form values held by the parent container. */
export interface CreateArmyFormValues {
    /** Army name as typed by the user (untrimmed). */
    name: string;
    /** Selected faction ID, or null if none selected. */
    factionId: string | null;
    /** Selected detachment ID, or null if none selected / not applicable. */
    detachmentId: string | null;
    /** Selected battle size, or null if none selected. */
    battleSize: BattleSize | null;
}

/** Per-field validation errors. Each value is a fully-formatted localized message. */
export interface CreateArmyFormErrors {
    name?: string;
    factionId?: string;
    detachmentId?: string;
    battleSize?: string;
}

/**
 * Props for the CreateArmyForm component.
 */
export interface CreateArmyFormProps {
    /** Current form values. */
    values: CreateArmyFormValues;
    /** Faction options to display. */
    factionOptions: readonly FactionOption[];
    /** Detachment options for the currently-selected faction. */
    detachmentOptions: readonly DetachmentOption[];
    /** Per-field validation errors to display inline. */
    errors?: CreateArmyFormErrors;
    /** Whether the form is currently valid (controls submit enabled state). */
    isValid: boolean;
    /** Whether a save is in progress (controls submit disabled + label). */
    saving?: boolean;
    /** Optional top-level save error message to surface in an alert region. */
    saveError?: string | null;
    /** Called whenever any form value changes. */
    onChange: (values: CreateArmyFormValues) => void;
    /** Called when the user submits a valid form. */
    onSubmit: () => void;
    /** Called when the user cancels. */
    onCancel: () => void;
}

/**
 * CreateArmyForm — pure presentational form for the Create Army flow.
 *
 * @param props - Component props.
 * @returns The rendered create army form.
 */
function CreateArmyForm({
    values,
    factionOptions,
    detachmentOptions,
    errors,
    isValid,
    saving = false,
    saveError = null,
    onChange,
    onSubmit,
    onCancel,
}: CreateArmyFormProps): ReactElement {
    const t = useTranslations('armyCreation');

    // Stable IDs so labels and error messages can be aria-associated.
    const nameId = useId();
    const nameErrorId = useId();
    const factionErrorId = useId();
    const detachmentErrorId = useId();
    const battleSizeErrorId = useId();
    const saveErrorId = useId();

    /** Updates a single form value while preserving the rest. */
    const update = useCallback(
        <K extends keyof CreateArmyFormValues>(key: K, value: CreateArmyFormValues[K]) => {
            onChange({ ...values, [key]: value });
        },
        [values, onChange],
    );

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!isValid || saving) return;
            onSubmit();
        },
        [isValid, saving, onSubmit],
    );

    const submitDisabled = !isValid || saving;
    const detachmentDisabled = detachmentOptions.length === 0;

    return (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
            {saveError ? (
                <div
                    id={saveErrorId}
                    role="alert"
                    className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
                >
                    {saveError}
                </div>
            ) : null}

            <div className="flex flex-col gap-2">
                <Label htmlFor={nameId}>{t('form.name')}</Label>
                <Input
                    id={nameId}
                    type="text"
                    value={values.name}
                    placeholder={t('form.namePlaceholder')}
                    onChange={(event) => update('name', event.target.value)}
                    aria-invalid={Boolean(errors?.name)}
                    aria-describedby={errors?.name ? nameErrorId : undefined}
                    error={Boolean(errors?.name)}
                    autoComplete="off"
                    required
                />
                {errors?.name ? (
                    <p id={nameErrorId} className="text-sm text-destructive">
                        {errors.name}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="create-army-faction">{t('form.faction')}</Label>
                <Select
                    value={values.factionId ?? undefined}
                    onValueChange={(value) => update('factionId', value)}
                >
                    <SelectTrigger
                        id="create-army-faction"
                        aria-invalid={Boolean(errors?.factionId)}
                        aria-describedby={errors?.factionId ? factionErrorId : undefined}
                    >
                        <SelectValue placeholder={t('form.factionPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {factionOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                                {option.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.factionId ? (
                    <p id={factionErrorId} className="text-sm text-destructive">
                        {errors.factionId}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="create-army-detachment">{t('form.detachment')}</Label>
                <Select
                    value={values.detachmentId ?? undefined}
                    onValueChange={(value) => update('detachmentId', value)}
                    disabled={detachmentDisabled}
                >
                    <SelectTrigger
                        id="create-army-detachment"
                        aria-invalid={Boolean(errors?.detachmentId)}
                        aria-describedby={errors?.detachmentId ? detachmentErrorId : undefined}
                    >
                        <SelectValue placeholder={t('form.detachmentPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {detachmentOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                                {option.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.detachmentId ? (
                    <p id={detachmentErrorId} className="text-sm text-destructive">
                        {errors.detachmentId}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="create-army-battle-size">{t('form.battleSize')}</Label>
                <Select
                    value={values.battleSize ?? undefined}
                    onValueChange={(value) => update('battleSize', value as BattleSize)}
                >
                    <SelectTrigger
                        id="create-army-battle-size"
                        aria-invalid={Boolean(errors?.battleSize)}
                        aria-describedby={errors?.battleSize ? battleSizeErrorId : undefined}
                    >
                        <SelectValue placeholder={t('form.battleSizePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {BATTLE_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={size}>
                                {t(`battleSizes.${size}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.battleSize ? (
                    <p id={battleSizeErrorId} className="text-sm text-destructive">
                        {errors.battleSize}
                    </p>
                ) : null}
            </div>

            <section aria-label={t('preview.label')} className="rounded-md border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium">{values.name || t('preview.namePlaceholder')}</p>
                <p className="text-sm text-muted-foreground">
                    {factionOptions.find((f) => f.id === values.factionId)?.name ?? t('preview.factionPlaceholder')}
                </p>
            </section>

            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
                    {t('actions.cancel')}
                </Button>
                <Button type="submit" disabled={submitDisabled}>
                    {saving ? t('actions.creating') : t('actions.create')}
                </Button>
            </div>
        </form>
    );
}

CreateArmyForm.displayName = 'CreateArmyForm';

export { CreateArmyForm, BATTLE_SIZE_OPTIONS };
