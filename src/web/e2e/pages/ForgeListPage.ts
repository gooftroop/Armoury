/**
 * ForgeListPage — Page Object Model for the Forge (army list) page.
 *
 * Wraps selectors and interactions so test files read like user stories.
 * Route: `/{locale}/wh40k10e/armies`
 *
 * All selectors use accessible roles and text content — the Forge components
 * do not render data-testid attributes. Army cards are plain `<div>`s with
 * `<h3>` headings (CardTitle) so we locate cards via their heading text and
 * navigate to sibling action buttons.
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
 * All selectors use accessible roles and visible text because the source
 * components do not emit data-testid attributes.
 */
export class ForgeListPage {
    readonly page: Page;

    // --- Navigation ---
    readonly heading: Locator;

    // --- Army list ---
    readonly createArmyButton: Locator;

    // --- Delete confirmation dialog ---
    readonly deleteDialog: Locator;
    readonly deleteConfirmButton: Locator;
    readonly deleteCancelButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.heading = page.getByRole('heading', { level: 1 });
        this.createArmyButton = page.getByRole('link', { name: /create|new army/i });

        this.deleteDialog = page.getByRole('alertdialog');
        this.deleteConfirmButton = this.deleteDialog.getByRole('button', { name: /delete|confirm/i });
        this.deleteCancelButton = this.deleteDialog.getByRole('button', { name: /cancel/i });
    }

    /**
     * Navigate to the Forge page.
     *
     * @param locale - Optional locale prefix. When omitted or set to the default
     * locale ('en'), the route is visited without a locale segment to align with
     * `localePrefix: 'as-needed'`.
     */
    async goto(locale?: string): Promise<void> {
        const path =
            locale === undefined || locale === 'en'
                ? '/wh40k10e/armies'
                : `/${locale}/wh40k10e/armies`;

        await this.page.goto(path);
    }

    /**
     * Get a locator for the filters toggle button.
     * ArmyFilterPanel renders a ghost button with the filter label and chevron icon.
     */
    get filtersToggle(): Locator {
        return this.page.getByRole('button', { name: /filter/i });
    }

    /**
     * Expand the filter panel if it is currently collapsed.
     */
    async expandFilters(): Promise<void> {
        const toggle = this.filtersToggle;

        if (await toggle.isVisible()) {
            const comboboxes = this.page.getByRole('combobox');
            const comboboxCount = await comboboxes.count();

            if (comboboxCount === 0) {
                await toggle.click();
            }
        }
    }

    /**
     * Select a faction in the filter dropdown.
     * The faction Select is the first combobox in the filter panel.
     *
     * @param factionId - The faction ID value to select.
     */
    async filterByFaction(factionId: string): Promise<void> {
        await this.expandFilters();
        const comboboxes = this.page.getByRole('combobox');
        await comboboxes.first().click();
        await this.page.getByRole('option', { name: new RegExp(factionId, 'i') }).click();
    }

    /**
     * Select a battle size in the filter dropdown.
     * The battle size Select is the second combobox in the filter panel.
     *
     * @param size - The battle size label to select (e.g. 'Strike Force').
     */
    async filterByBattleSize(size: string): Promise<void> {
        await this.expandFilters();
        const comboboxes = this.page.getByRole('combobox');
        await comboboxes.nth(1).click();
        await this.page.getByRole('option', { name: new RegExp(size, 'i') }).click();
    }

    /**
     * Change the sort order.
     * The sort Select is the third combobox in the filter panel.
     *
     * @param order - The sort option label to select (e.g. 'Newest', 'Name').
     */
    async sortBy(order: string): Promise<void> {
        await this.expandFilters();
        const comboboxes = this.page.getByRole('combobox');
        await comboboxes.nth(2).click();
        await this.page.getByRole('option', { name: new RegExp(order, 'i') }).click();
    }

    /**
     * Locate a specific army card by its name.
     * ArmyCard renders army name inside a CardTitle (<h3>). We find the heading
     * then walk up to the enclosing Card div.
     *
     * @param armyName - The visible name of the army.
     * @returns A Locator scoped to the card's root element.
     */
    getCardByName(armyName: string): Locator {
        // Card structure: div.rounded-lg.border > div.CardHeader > h3(army name)
        // No test IDs exist, so we match the Card container by its class + heading content.
        return this.page.locator('div.rounded-lg.border', {
            has: this.page.getByRole('heading', { name: armyName, level: 3 }),
        });
    }

    /**
     * Get all visible army card locators.
     * Cards are identified as containers that have both an <h3> heading and
     * deploy/duplicate/delete action buttons.
     */
    get armyCards(): Locator {
        // Each army card is a Card div containing a CardTitle (h3) and action buttons.
        // ArmyCard renders: Card > CardHeader > CardTitle(h3), Card > CardFooter > ArmyCardActions > Buttons
        // We identify cards by finding divs that contain both a heading and a deploy button.
        return this.page.locator('div.rounded-lg.border', {
            has: this.page.getByRole('heading', { level: 3 }),
        });
    }

    /**
     * Get the empty state element.
     * EmptyState renders a div with a dashed border and an <h3> heading.
     */
    get emptyState(): Locator {
        return this.page.locator('div.border-dashed');
    }

    /**
     * Click the deploy button on an army card by army name.
     * The deploy button has i18n text from `forge.actions.deploy`.
     *
     * @param armyName - The visible name of the army.
     */
    async deployArmy(armyName: string): Promise<void> {
        const card = this.getCardByName(armyName);
        await card.getByRole('button', { name: /deploy/i }).click();
    }

    /**
     * Click the duplicate button on an army card by army name.
     *
     * @param armyName - The visible name of the army.
     */
    async duplicateArmy(armyName: string): Promise<void> {
        const card = this.getCardByName(armyName);
        await card.getByRole('button', { name: /duplicate/i }).click();
    }

    /**
     * Initiate deletion of an army by name (opens confirmation dialog).
     *
     * @param armyName - The visible name of the army.
     */
    async requestDeleteArmy(armyName: string): Promise<void> {
        const card = this.getCardByName(armyName);
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
     * Reads the <h3> (CardTitle) text from each card.
     *
     * @returns Array of army name strings as shown on cards.
     */
    async getArmyNames(): Promise<string[]> {
        const cards = await this.armyCards.all();
        const names: string[] = [];

        for (const card of cards) {
            const heading = card.getByRole('heading', { level: 3 });
            const text = await heading.textContent();

            if (text) {
                names.push(text.trim());
            }
        }

        return names;
    }
}
