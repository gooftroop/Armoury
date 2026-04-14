/**
 * ArmyCardActions component tests.
 *
 * @requirements
 * - REQ-FORGE-ACTIONS-01: Renders Deploy, Duplicate, and Delete buttons.
 * - REQ-FORGE-ACTIONS-02: Deploy button fires onDeploy callback on press.
 * - REQ-FORGE-ACTIONS-03: Duplicate button fires onDuplicate callback on press.
 * - REQ-FORGE-ACTIONS-04: Delete button fires onDelete callback on press.
 *
 * Test plan:
 * - renders three buttons → REQ-FORGE-ACTIONS-01
 * - Deploy fires onDeploy → REQ-FORGE-ACTIONS-02
 * - Duplicate fires onDuplicate → REQ-FORGE-ACTIONS-03
 * - Delete fires onDelete → REQ-FORGE-ACTIONS-04
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ArmyCardActions } from '../ArmyCardActions.js';

describe('ArmyCardActions', () => {
    it('renders Deploy, Duplicate, and Delete buttons', () => {
        render(<ArmyCardActions onDeploy={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />);

        expect(screen.getByText('Deploy')).toBeTruthy();
        expect(screen.getByText('Duplicate')).toBeTruthy();
        expect(screen.getByText('Delete')).toBeTruthy();
    });

    it('fires onDeploy when Deploy button is pressed', () => {
        const onDeploy = vi.fn();
        render(<ArmyCardActions onDeploy={onDeploy} onDuplicate={vi.fn()} onDelete={vi.fn()} />);

        fireEvent.click(screen.getByText('Deploy'));
        expect(onDeploy).toHaveBeenCalledOnce();
    });

    it('fires onDuplicate when Duplicate button is pressed', () => {
        const onDuplicate = vi.fn();
        render(<ArmyCardActions onDeploy={vi.fn()} onDuplicate={onDuplicate} onDelete={vi.fn()} />);

        fireEvent.click(screen.getByText('Duplicate'));
        expect(onDuplicate).toHaveBeenCalledOnce();
    });

    it('fires onDelete when Delete button is pressed', () => {
        const onDelete = vi.fn();
        render(<ArmyCardActions onDeploy={vi.fn()} onDuplicate={vi.fn()} onDelete={onDelete} />);

        fireEvent.click(screen.getByText('Delete'));
        expect(onDelete).toHaveBeenCalledOnce();
    });
});
