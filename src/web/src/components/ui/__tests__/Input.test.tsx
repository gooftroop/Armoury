/**
 * Input component tests.
 *
 * @requirements
 * - REQ-INPUT-01: Renders input props and change handler.
 * - REQ-INPUT-02: Supports error and disabled states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Input } from '../input.js';

describe('Input', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with value and handles change', () => {
        const onChange = vi.fn();

        render(<Input aria-label="army-name" onChange={onChange} value="Alpha" />);

        const input = screen.getByLabelText('army-name');
        expect(input).toHaveAttribute('value', 'Alpha');
        fireEvent.change(input, { target: { value: 'Beta' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('applies error attribute and disabled state', () => {
        render(<Input aria-label="points" disabled={true} error={true} />);

        const input = screen.getByLabelText('points');
        expect(input).toHaveAttribute('data-error', 'true');
        expect(input).toBeDisabled();
    });
});
