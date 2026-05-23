/**
 * CreateArmyForm component tests.
 *
 * Test plan:
 * - REQ-FORM-01: Renders all four form fields (name, faction, detachment, battle size).
 * - REQ-FORM-02: Calls onChange when the name input changes.
 * - REQ-FORM-03: Disables submit when isValid is false.
 * - REQ-FORM-04: Disables submit when saving is true.
 * - REQ-FORM-05: Renders a role=alert region when saveError is provided.
 * - REQ-FORM-06: Calls onSubmit when the form is submitted with isValid=true.
 * - REQ-FORM-07: Calls onCancel when the cancel button is clicked.
 * - REQ-FORM-08: Renders the army preview section with faction name and army name.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CreateArmyForm } from '../CreateArmyForm.web.js';
import type { CreateArmyFormValues, FactionOption, DetachmentOption } from '../CreateArmyForm.web.js';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('@armoury/ui', () => ({
    Button: ({
        children,
        disabled,
        type,
        onClick,
    }: {
        children: React.ReactNode;
        disabled?: boolean;
        type?: string;
        onClick?: () => void;
    }) => (
        <button type={(type as 'button' | 'submit' | 'reset') ?? 'button'} disabled={disabled} onClick={onClick}>
            {children}
        </button>
    ),
    Input: ({
        id,
        value,
        onChange,
        'aria-invalid': ariaInvalid,
    }: {
        id?: string;
        value?: string;
        onChange?: React.ChangeEventHandler<HTMLInputElement>;
        'aria-invalid'?: boolean;
    }) => <input id={id} value={value} onChange={onChange} aria-invalid={ariaInvalid} />,
    Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
        <label htmlFor={htmlFor}>{children}</label>
    ),
    Select: ({
        children,
        value,
        onValueChange,
        disabled,
    }: {
        children: React.ReactNode;
        value?: string;
        onValueChange?: (v: string) => void;
        disabled?: boolean;
    }) => (
        <div data-value={value} data-disabled={disabled}>
            {children}
        </div>
    ),
    SelectTrigger: ({ children, id }: { children: React.ReactNode; id?: string }) => (
        <div id={id}>{children}</div>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
        <div data-value={value}>{children}</div>
    ),
}));

const factionOptions: FactionOption[] = [
    { id: 'space-marines', name: 'Space Marines' },
    { id: 'necrons', name: 'Necrons' },
];

const detachmentOptions: DetachmentOption[] = [
    { id: 'gladius', name: 'Gladius Task Force' },
];

function makeValues(overrides: Partial<CreateArmyFormValues> = {}): CreateArmyFormValues {
    return {
        name: '',
        factionId: null,
        detachmentId: null,
        battleSize: null,
        ...overrides,
    };
}

describe('CreateArmyForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all four form field labels', () => {
        render(
            <CreateArmyForm
                values={makeValues()}
                factionOptions={factionOptions}
                detachmentOptions={[]}
                isValid={false}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByText('form.name')).toBeInTheDocument();
        expect(screen.getByText('form.faction')).toBeInTheDocument();
        expect(screen.getByText('form.detachment')).toBeInTheDocument();
        expect(screen.getByText('form.battleSize')).toBeInTheDocument();
    });

    it('calls onChange when the name input changes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <CreateArmyForm
                values={makeValues()}
                factionOptions={factionOptions}
                detachmentOptions={[]}
                isValid={false}
                onChange={onChange}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        await user.type(screen.getByRole('textbox'), 'A');

        expect(onChange).toHaveBeenCalled();
    });

    it('disables the submit button when isValid is false', () => {
        render(
            <CreateArmyForm
                values={makeValues()}
                factionOptions={factionOptions}
                detachmentOptions={[]}
                isValid={false}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'actions.create' })).toBeDisabled();
    });

    it('disables the submit button when saving is true', () => {
        render(
            <CreateArmyForm
                values={makeValues()}
                factionOptions={factionOptions}
                detachmentOptions={[]}
                isValid={true}
                saving={true}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'actions.creating' })).toBeDisabled();
    });

    it('renders a role=alert region when saveError is provided', () => {
        render(
            <CreateArmyForm
                values={makeValues()}
                factionOptions={factionOptions}
                detachmentOptions={[]}
                isValid={false}
                saveError="Something went wrong"
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });

    it('calls onSubmit when the form is submitted with isValid=true', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(
            <CreateArmyForm
                values={makeValues()}
                factionOptions={factionOptions}
                detachmentOptions={[]}
                isValid={true}
                onChange={vi.fn()}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'actions.create' }));

        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it('calls onCancel when the cancel button is clicked', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();

        render(
            <CreateArmyForm
                values={makeValues()}
                factionOptions={factionOptions}
                detachmentOptions={[]}
                isValid={false}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onCancel={onCancel}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'actions.cancel' }));

        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('renders the army preview with faction name when a faction is selected', () => {
        render(
            <CreateArmyForm
                values={makeValues({ name: 'Iron Fists', factionId: 'space-marines' })}
                factionOptions={factionOptions}
                detachmentOptions={detachmentOptions}
                isValid={false}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByRole('region', { name: 'preview.label' })).toBeInTheDocument();
        expect(screen.getByText('Iron Fists')).toBeInTheDocument();
        expect(screen.getByText('Space Marines')).toBeInTheDocument();
    });
});
