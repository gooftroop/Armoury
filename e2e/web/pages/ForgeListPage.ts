/**
 * ForgeListPage — Page Object Model for the Forge (army list) page.
 *
 * Wraps selectors and interactions so test files read like user stories.
 * Route: `/{locale}/wh40k10e/armies`
 *
 * @requirements
 * - REQ-POM-01: Encapsulate all Forge page selectors
 * - REQ-POM-02: Expose high-level user actions (filter, sort, deploy, delete)
 * - REQ-POM-03: Abstract away locale prefix in navigation
 */

import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Forge (army list) page.
 *
 * Provides typed accessors for army cards, filter controls, and action buttons.
 * All selectors use accessible roles and labels, falling back to data-testid
 * where semantic selectors are insufficient.
 */
export class ForgeListPage {
    readonly page: Page;

    // --- Navigation ---
    readonly heading: Locator;

    // --- Filter panel ---
    readonly factionFilter: Locator;
    readonly battleSizeFilter: Locator;
    readonly sortBySelect: Locator;

    // --- Army list ---
    readonly armyCards: Locator;
    readonly emptyState: Locator;
    readonly createArmyButton: Locator;

    // --- Delete confirmation dialog ---
    readonly deleteDialog: Locator;
    readonly deleteConfirmButton: Locator;
    readonly deleteCancelButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Heading
        this.heading = page.getByRole('heading', { name: /armies|forge/i });

        // Filter controls — identified by label or test ID
        this.factionFilter = page.getByTestId('filter-faction');
        this.battleSizeFilter = page.getByTestId('filter-battle-size');
        this.sortBySelect = page.getByTestId('sort-by');

        // Army grid
        this.armyCards = page.getByTestId('army-card');
        this.emptyState = page.getByTestId('empty-state');
        this.createArmyButton = page.getByRole('link', { name: /create|new army/i });

        // Delete dialog
        this.deleteDialog = page.getByRole('alertdialog');
        this.deleteConfirmButton = this.deleteDialog.getByRole('button', { name: /delete|confirm/i });
        this.deleteCancelButton = this.deleteDialog.getByRole('button', { name: /cancel/i });
    }

    /**
     * Navigate to the Forge page.
     *
     * @param locale - The locale prefix (defaults to 'en').
     */
    async goto(locale = 'en'): Promise<void> {
        await this.page.goto(`/${locale}/wh40k10e/armies`);
    }

    /**
     * Select a faction in the filter dropdown.
     *
     * @param factionId - The faction ID value to select.
     */
    async filterByFaction(factionId: string): Promise<void> {
        await this.factionFilter.click();
        await this.page.getByRole('option', { name: new RegExp(factionId, 'i') }).click();
    }

    /**
     * Select a battle size in the filter dropdown.
     *
     * @param size - The battle size label to select.
     */
    async filterByBattleSize(size: string): Promise<void> {
        await this.battleSizeFilter.click();
        await this.page.getByRole('option', { name: new RegExp(size, 'i') }).click();
    }

    /**
     * Change the sort order.
     *
     * @param order - The sort option label to select.
     */
    async sortBy(order: string): Promise<void> {
        await this.sortBySelect.click();
        await this.page.getByRole('option', { name: new RegExp(order, 'i') }).click();
    }

    /**
     * Click the deploy button on an army card by army name.
     *
     * @param armyName - The visible name of the army.
     */
    async deployArmy(armyName: string): Promise<void> {
        const card = this.page.getByTestId('army-card').filter({ hasText: armyName });
        await card.getByRole('button', { name: /deploy/i }).click();
    }

    /**
     * Initiate deletion of an army by name (opens confirmation dialog).
     *
     * @param armyName - The visible name of the army.
     */
    async requestDeleteArmy(armyName: string): Promise<void> {
        const card = this.page.getByTestId('army-card').filter({ hasText: armyName });
        await card.getByRole('button', { name: /delete/i }).click();
    }

    /**
     * Confirm the pending delete action in the dialog.
     */
    async confirmDelete(): Promise<void> {
        await this.deleteConfirmButton.click();
    }

    /**
     * Cancel the pending delete action in the dialog.
     */
    async cancelDelete(): Promise<void> {
        await this.deleteCancelButton.click();
    }

    /**
     * Get the count of visible army cards.
     *
     * @returns The number of army cards currently rendered.
     */
    async getArmyCount(): Promise<number> {
        return this.armyCards.count();
    }

    /**
     * Get army card names in display order.
     *
     * @returns Array of army name strings as shown on cards.
     */
    async getArmyNames(): Promise<string[]> {
        const cards = await this.armyCards.all();
        const names: string[] = [];

        for (const card of cards) {
            const nameEl = card.getByTestId('army-card-name');
            const text = await nameEl.textContent();

            if (text) {
                names.push(text.trim());
            }
        }

        return names;
    }
}
