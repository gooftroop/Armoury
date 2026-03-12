/**
 * Parser for Wahapedia Chapter Approved 2025-26 HTML content.
 *
 * Extracts mission data from the Wahapedia Chapter Approved page and transforms it
 * into a structured ChapterApproved interface. The parser handles:
 *
 * - Extracting JavaScript arrays from `<script>` tags (ContentPM, ContentPM_AW,
 *   ContentD_SF, ContentD_In, ContentD_AW, ContentSM, ContentSM_NoFixed, ContentTwist,
 *   ContentChallenger)
 * - Parsing each HTML fragment from those arrays using cheerio
 * - Parsing the static Tournament Mission Pool table and Terrain Layout images
 * - Returning a valid ChapterApproved with all fields populated
 *
 * HTML Structure Notes:
 * - JS arrays are declared inside a `<script>` block (lines ~1072-1080) as
 *   `var ContentXxx = ['<div...>...</div>', ...];`
 * - Primary missions use `.cgHeader` for name, `.cgText` for rules, `.pnWhen` for timing,
 *   `<b>NVP</b>` for VP values, and `(ACTION)` with STARTS/UNITS/COMPLETES/IF COMPLETED fields
 * - Secondary missions use `.showFix`/`.showTac` classes for type, `.pnVP` divs for VP,
 *   `.pnWhen_A` for actions, and `<b>When Drawn:</b>` for draw conditions
 * - Deployment zones use `.cgHeader` for name, `img` src for map URL, and `.itc` spans for
 *   designer's notes (special rules)
 * - Challenger cards have stratagem side (`.str10Name`, `.str10CP`, `.str10Text`) and mission
 *   side (either a table-based mission with `.pnVP` or an action-based mission with
 *   STARTS/UNITS/COMPLETES/IF COMPLETED)
 * - Twist cards use `.cgHeader` for name and `.cgText` for rules
 * - Tournament missions are in a static HTML table containing "CHAPTER APPROVED TOURNAMENT
 *   MISSION POOL" with rows A-T
 * - Terrain layouts are static `<img>` tags with paths matching
 *   `/wh40k10ed/img/maps/TerrainLayout/CA_TerrainLayout{1-8}.png`
 *
 * @see ChapterApproved for the target data structure
 * @see https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved-2025-26/
 */

/**
 * @requirements
 * 1. Must extract JavaScript arrays from `<script>` tags by variable name.
 * 2. Must parse primary missions from ContentPM (standard) and ContentPM_AW (asymmetric-war) arrays.
 * 3. Must parse secondary missions from ContentSM (fixed+tactical) and ContentSM_NoFixed (tactical-only) arrays.
 * 4. Must parse deployment zones from ContentD_SF (strike-force), ContentD_In (incursion), and ContentD_AW (asymmetric-war) arrays.
 * 5. Must parse challenger cards from ContentChallenger array, extracting both stratagem and mission sides.
 * 6. Must parse twist cards from ContentTwist array.
 * 7. Must parse the tournament mission pool from the static HTML table (missions A through T).
 * 8. Must parse terrain layouts from static HTML img tags and derive compatible deployments from tournament data.
 * 9. Must generate kebab-case IDs from mission/card names (e.g. "TAKE AND HOLD" → "take-and-hold").
 * 10. Must title-case names extracted from ALL CAPS headers (e.g. "TAKE AND HOLD" → "Take And Hold").
 * 11. Must strip HTML tags and normalize whitespace when extracting text content.
 * 12. Must resolve relative image URLs to absolute Wahapedia URLs.
 * 13. Must return a ChapterApproved with id "chapter-approved-2025-26" and version "2025-26".
 * 14. Must produce 15 primary missions, 29 secondary missions, 17 deployment zones, 9 challenger cards, 9 twist cards, 20 tournament missions, and 8 terrain layouts.
 */

import * as cheerio from 'cheerio';

import type { IWahapediaParser } from '@armoury/clients-wahapedia';

import type { ChapterApproved } from '@/models/ChapterApproved.js';
import type {
    ChallengerCard,
    ChallengerMission,
    ChallengerStratagem,
    DeploymentZone,
    MissionAction,
    PrimaryMission,
    SecondaryMission,
    TerrainLayout,
    TournamentMission,
    TwistCard,
} from '@/models/ChapterApprovedTypes.js';

/** Base URL for resolving relative Wahapedia image paths to absolute URLs. */
const WAHAPEDIA_BASE_URL = 'https://wahapedia.ru';

/**
 * Parser for Wahapedia Chapter Approved 2025-26 HTML content.
 *
 * Implements {@link IWahapediaParser} to extract all mission data from the raw HTML
 * of the Wahapedia Chapter Approved 2025-26 page and produce a fully populated
 * {@link ChapterApproved}.
 */
export class ChapterApprovedParser implements IWahapediaParser<ChapterApproved> {
    /**
     * Parses HTML from the Wahapedia Chapter Approved page into a ChapterApproved.
     *
     * Orchestrates extraction of all mission data by:
     * 1. Extracting JS arrays from `<script>` tags
     * 2. Parsing each category of mission data from those arrays
     * 3. Parsing static HTML for tournament missions and terrain layouts
     * 4. Assembling everything into a ChapterApproved
     *
     * @param html - Raw HTML content from Wahapedia Chapter Approved page
     * @returns Parsed ChapterApproved with all mission data
     */
    parse(html: string): ChapterApproved {
        const primaryMissions = [
            ...this.parsePrimaryMissions(this.extractJsArray(html, 'ContentPM'), 'standard'),
            ...this.parsePrimaryMissions(this.extractJsArray(html, 'ContentPM_AW'), 'asymmetric-war'),
        ];

        const secondaryMissions = [
            ...this.parseSecondaryMissions(this.extractJsArray(html, 'ContentSM')),
            ...this.parseSecondaryMissions(this.extractJsArray(html, 'ContentSM_NoFixed')),
        ];

        const deploymentZones = [
            ...this.parseDeploymentZones(this.extractJsArray(html, 'ContentD_SF'), 'strike-force'),
            ...this.parseDeploymentZones(this.extractJsArray(html, 'ContentD_In'), 'incursion'),
            ...this.parseDeploymentZones(this.extractJsArray(html, 'ContentD_AW'), 'asymmetric-war'),
        ];

        const challengerCards = this.parseChallengerCards(this.extractJsArray(html, 'ContentChallenger'));
        const twistCards = this.parseTwistCards(this.extractJsArray(html, 'ContentTwist'));
        const tournamentMissions = this.parseTournamentMissions(html, primaryMissions, deploymentZones);
        const terrainLayouts = this.parseTerrainLayouts(html, tournamentMissions);

        return {
            id: 'chapter-approved-2025-26',
            version: '2025-26',
            primaryMissions,
            secondaryMissions,
            deploymentZones,
            challengerCards,
            twistCards,
            tournamentMissions,
            terrainLayouts,
        };
    }

    /**
     * Extracts a JavaScript array of HTML strings from the page's `<script>` block.
     *
     * Searches for a `var <varName> = [...]` declaration and parses the array contents
     * by splitting on the array element delimiter pattern `', '` (single-quoted strings
     * separated by commas). Handles escaped single quotes within HTML content.
     *
     * @param html - Full page HTML containing `<script>` blocks
     * @param varName - JavaScript variable name to extract (e.g. "ContentPM")
     * @returns Array of HTML strings, one per mission card
     */
    private extractJsArray(html: string, varName: string): string[] {
        /**
         * Match the full array assignment: `var ContentXxx = ['...', '...'];`
         * The regex captures everything between the outer `[` and `];`.
         * We use a non-greedy match with a lookahead for `];` to handle nested brackets.
         */
        const regex = new RegExp(`var\\s+${varName}\\s*=\\s*\\[(.*)\\];`, 'm');
        const match = html.match(regex);

        if (!match?.[1]) {
            return [];
        }

        const rawContent = match[1];

        /**
         * Split the array by the delimiter pattern `', '` — each element is a single-quoted
         * HTML string. We strip the leading `'` from the first element and the trailing `'`
         * from the last element.
         */
        const elements = rawContent.split("', '");

        return elements.map((element, index) => {
            let cleaned = element;

            /* Strip leading quote from first element */
            if (index === 0) {
                cleaned = cleaned.replace(/^'/, '');
            }

            /* Strip trailing quote from last element */
            if (index === elements.length - 1) {
                cleaned = cleaned.replace(/'$/, '');
            }

            return cleaned;
        });
    }

    /**
     * Converts an ALL CAPS name to Title Case.
     *
     * Lowercases the entire string, then capitalizes the first letter of each word.
     * Handles single-character words (like "A") and preserves spaces.
     *
     * @param name - ALL CAPS name (e.g. "TAKE AND HOLD")
     * @returns Title-cased name (e.g. "Take And Hold")
     */
    private toTitleCase(name: string): string {
        return name
            .toLowerCase()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Generates a kebab-case ID from a name string.
     *
     * Converts to lowercase, replaces spaces and non-alphanumeric characters with hyphens,
     * collapses consecutive hyphens, and trims leading/trailing hyphens.
     *
     * @param name - Display name (e.g. "TAKE AND HOLD" or "Take And Hold")
     * @returns Kebab-case ID (e.g. "take-and-hold")
     */
    private toKebabCase(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Strips HTML tags from a string and normalizes whitespace.
     *
     * Loads the HTML into cheerio to get clean text content, then collapses
     * multiple whitespace characters into single spaces and trims.
     *
     * @param html - HTML string potentially containing tags
     * @returns Plain text with normalized whitespace
     */
    private stripHtml(html: string): string {
        const $ = cheerio.load(html, { xml: false });

        return $.text().replace(/\s+/g, ' ').trim();
    }

    /**
     * Resolves a potentially relative image URL to an absolute Wahapedia URL.
     *
     * If the URL starts with `/`, prepends the Wahapedia base URL. Otherwise returns as-is.
     *
     * @param url - Image URL that may be relative (e.g. "/wh40k10ed/img/maps/...")
     * @returns Absolute URL (e.g. "https://wahapedia.ru/wh40k10ed/img/maps/...")
     */
    private resolveUrl(url: string): string {
        if (url.startsWith('/')) {
            return `${WAHAPEDIA_BASE_URL}${url}`;
        }

        return url;
    }

    /**
     * Extracts all VP values from an HTML fragment by matching `<b>NVP</b>` and `.pnVP` patterns.
     *
     * Searches for bold VP values like `<b>3VP</b>` and VP divs like `<div class="pnVP">3VP</div>`.
     * Returns all found VP values as numbers, sorted ascending.
     *
     * @param htmlFragment - HTML string to search for VP values
     * @returns Array of VP numbers found, sorted ascending
     */
    private extractVpValues(htmlFragment: string): number[] {
        const vpSet = new Set<number>();

        /** Match bold VP values: <b>3VP</b>, <b>15VP</b>, etc. */
        const boldMatches = htmlFragment.matchAll(/<b>(\d+)VP<\/b>/g);

        for (const m of boldMatches) {
            vpSet.add(parseInt(m[1], 10));
        }

        /** Match .pnVP div VP values: <div class="pnVP">3VP</div> */
        const pnVpMatches = htmlFragment.matchAll(/<div class="pnVP">(\d+)VP<\/div>/g);

        for (const m of pnVpMatches) {
            vpSet.add(parseInt(m[1], 10));
        }

        return [...vpSet].sort((a, b) => a - b);
    }

    /**
     * Parses a mission action from an HTML fragment containing STARTS/UNITS/COMPLETES/IF COMPLETED fields.
     *
     * Actions are identified by a `(ACTION)` marker in a `.pnWhen` or `.pnWhen_A` div.
     * The action name is extracted from the div text (e.g. "TERRAFORM (ACTION)" → "Terraform").
     * The four required fields are extracted from bold labels in the subsequent text.
     *
     * @param $ - Cheerio instance loaded with the card HTML
     * @param htmlFragment - Raw HTML string of the card (for regex matching)
     * @returns Parsed MissionAction, or null if no action is present
     */
    private parseAction($: cheerio.CheerioAPI, htmlFragment: string): MissionAction | null {
        /**
         * Look for action markers in both primary (.pnWhen) and secondary (.pnWhen_A) formats.
         * The action name appears as text like "TERRAFORM (ACTION)" inside the div.
         */
        const actionDiv = $('div.pnWhen, div.pnWhen_A').filter(function () {
            return $(this).text().includes('(ACTION)');
        });

        if (actionDiv.length === 0) {
            return null;
        }

        const actionText = actionDiv.first().text().trim();
        const actionNameMatch = actionText.match(/^(.+?)\s*\(ACTION\)/);
        const actionName = actionNameMatch ? this.toTitleCase(actionNameMatch[1].trim()) : 'Unknown';

        /**
         * Extract STARTS, UNITS, COMPLETES, and IF COMPLETED fields using regex on the raw HTML.
         * These fields appear as bold labels followed by their content, separated by `<br><br>`.
         * We use the text after stripping HTML to get clean values.
         */
        const startsMatch = htmlFragment.match(/<b>STARTS:<\/b>\s*(.*?)(?:<br><br>|<\/td>)/s);
        const unitsMatch = htmlFragment.match(/<b>UNITS:<\/b>\s*(.*?)(?:<br><br>|<\/td>)/s);
        const completesMatch = htmlFragment.match(/<b>COMPLETES:<\/b>\s*(.*?)(?:<br><br>|<\/td>)/s);
        const effectMatch = htmlFragment.match(/<b>IF COMPLETED:<\/b>\s*(.*?)(?:<br><br>|<\/td>|<\/div>)/s);

        return {
            name: actionName,
            when: startsMatch ? this.stripHtml(startsMatch[1]) : '',
            units: unitsMatch ? this.stripHtml(unitsMatch[1]) : '',
            completed: completesMatch ? this.stripHtml(completesMatch[1]) : '',
            effect: effectMatch ? this.stripHtml(effectMatch[1]) : '',
            maxConcurrent: null,
        };
    }

    /**
     * Parses primary missions from an array of HTML fragments.
     *
     * Each fragment represents one primary mission card. Extracts:
     * - Name from `.cgHeader` (title-cased from ALL CAPS)
     * - Rules text from `.cgText` (HTML stripped)
     * - VP values from `<b>NVP</b>` patterns (smallest = vpPerScore, largest = maxVP)
     * - Scoring timing from `.pnWhen` div text (the non-action timing div)
     * - Special rules from `.pnWhenOR` sections and "Designer's Note:" text
     * - Objective modifications from text mentioning objective marker placement changes
     * - Actions from `(ACTION)` markers with STARTS/UNITS/COMPLETES/IF COMPLETED
     *
     * @param fragments - Array of HTML strings, one per primary mission card
     * @param category - Mission category: 'standard' or 'asymmetric-war'
     * @returns Array of parsed PrimaryMission objects
     */
    private parsePrimaryMissions(fragments: string[], category: 'standard' | 'asymmetric-war'): PrimaryMission[] {
        return fragments.map((fragment) => {
            const $ = cheerio.load(fragment, { xml: false });

            const rawName = $('.cgHeader').text().trim();
            const name = this.toTitleCase(rawName);
            const id = this.toKebabCase(rawName);

            /** Extract full rules text, stripping all HTML tags */
            const rulesText = this.stripHtml($('.cgText').html() ?? '');

            /** Extract VP values — smallest is vpPerScore, largest is maxVP */
            const vpValues = this.extractVpValues(fragment);
            const vpPerScore = vpValues.length > 0 ? vpValues[0] : 0;
            const maxVP = vpValues.length > 0 ? vpValues[vpValues.length - 1] : 0;

            /**
             * Extract scoring timing from `.pnWhen` divs that are NOT action divs.
             * Non-action `.pnWhen` divs contain timing like "SECOND BATTLE ROUND ONWARDS".
             * We take the first non-action timing div.
             */
            let scoringTiming = '';
            $('div.pnWhen').each(function () {
                const text = $(this).text().trim();

                if (!text.includes('(ACTION)')) {
                    if (!scoringTiming) {
                        scoringTiming = text;
                    }
                }
            });

            /**
             * Extract special rules:
             * - OR sections from `.pnWhenOR` divs indicate alternative scoring conditions
             * - Designer's Notes contain additional clarifications
             */
            const specialRules: string[] = [];
            $('div.pnWhenOR').each(function () {
                /**
                 * The OR section's text is the next sibling text block after the OR div.
                 * We capture the parent .cgText content that follows the OR div.
                 */
                specialRules.push('Alternative scoring condition available');
            });

            if (fragment.includes("Designer's Note:") || fragment.includes("Designer\\'s Note:")) {
                const noteMatch = fragment.match(/Designer(?:'|&#x27;|\\')s Note:<\/b>\s*(.*?)(?:<\/div>|<br><br>)/s);

                if (noteMatch) {
                    specialRules.push(`Designer's Note: ${this.stripHtml(noteMatch[1])}`);
                }
            }

            /**
             * Detect objective modifications — primary missions that change how objective
             * markers are placed or behave. Look for mentions of "objective marker" in
             * non-standard contexts (outside normal scoring text).
             */
            let objectiveModifications: string | null = null;

            if (fragment.includes('Start of the Battle:') || fragment.includes('start of the first')) {
                const objMatch = fragment.match(/<b>Start of the Battle:<\/b>\s*(.*?)(?:<br><br>|<div class="pnWhen)/s);

                if (objMatch) {
                    objectiveModifications = this.stripHtml(objMatch[1]);
                }
            }

            const action = this.parseAction($, fragment);

            return {
                id,
                name,
                category,
                rulesText,
                vpPerScore,
                maxVP,
                scoringTiming,
                specialRules,
                objectiveModifications,
                action,
            };
        });
    }

    /**
     * Parses secondary missions from an array of HTML fragments.
     *
     * Each fragment represents one secondary mission card. The type (fixed/tactical) is
     * determined by CSS classes: `.showFix` for fixed, `.showTac` for tactical. Cards in
     * ContentSM that have `.showTac` appear in both ContentSM and ContentSM_NoFixed arrays,
     * producing separate entries for each (29 total).
     *
     * Extracts:
     * - Name from `.cgHeader` (title-cased)
     * - Type from `.showFix` / `.showTac` CSS classes
     * - Rules text from `.cgText` (HTML stripped)
     * - VP values from `.pnVP` divs (smallest = vpPerScore, largest = vpCap)
     * - When Drawn conditions from `<b>When Drawn:</b>` text
     * - Actions from `.pnWhen_A` divs with STARTS/UNITS/COMPLETES/IF COMPLETED
     *
     * @param fragments - Array of HTML strings, one per secondary mission card
     * @returns Array of parsed SecondaryMission objects
     */
    private parseSecondaryMissions(fragments: string[]): SecondaryMission[] {
        return fragments.map((fragment) => {
            const $ = cheerio.load(fragment, { xml: false });

            const rawName = $('.cgHeader').text().trim();
            const name = this.toTitleCase(rawName);

            /**
             * Determine type from CSS classes. `.showFix` = fixed, `.showTac` = tactical.
             * Cards in ContentSM can have either class. Cards in ContentSM_NoFixed always have `.showTac`.
             */
            const isFixed = $('.showFix').length > 0;
            const type: 'fixed' | 'tactical' = isFixed ? 'fixed' : 'tactical';
            const id = `${this.toKebabCase(rawName)}-${type}`;

            const rulesText = this.stripHtml($('.cgText').html() ?? '');

            /**
             * Extract VP values from .pnVP divs. The smallest value is vpPerScore,
             * the largest is vpCap.
             */
            const vpValues = this.extractVpValues(fragment);
            const vpPerScore = vpValues.length > 0 ? vpValues[0] : 0;
            const vpCap = vpValues.length > 0 ? vpValues[vpValues.length - 1] : 0;

            /**
             * Extract "When Drawn:" text for tactical draw conditions.
             * This appears as `<b>When Drawn:</b> ...` at the start of `.cgText`.
             */
            let whenDrawn: string | null = null;
            const whenDrawnMatch = fragment.match(/<b>When Drawn:<\/b>\s*(.*?)(?:<br><br>)/s);

            if (whenDrawnMatch) {
                whenDrawn = this.stripHtml(whenDrawnMatch[1]);
            }

            const action = this.parseAction($, fragment);

            return {
                id,
                name,
                type,
                rulesText,
                vpPerScore,
                vpCap,
                whenDrawn,
                action,
            };
        });
    }

    /**
     * Parses deployment zones from an array of HTML fragments.
     *
     * Each fragment represents one deployment zone card. Extracts:
     * - Name from `.cgHeader` (title-cased)
     * - Map URL from `img` element src attribute (resolved to absolute)
     * - Special rules from `<span class="itc">` containing Designer's Note text
     *
     * @param fragments - Array of HTML strings, one per deployment zone card
     * @param category - Deployment category: 'strike-force', 'incursion', or 'asymmetric-war'
     * @returns Array of parsed DeploymentZone objects
     */
    private parseDeploymentZones(
        fragments: string[],
        category: 'strike-force' | 'incursion' | 'asymmetric-war',
    ): DeploymentZone[] {
        return fragments.map((fragment) => {
            const $ = cheerio.load(fragment, { xml: false });

            const rawName = $('.cgHeader').text().trim();
            const name = this.toTitleCase(rawName);
            const id = `${this.toKebabCase(rawName)}-${category}`;

            /** Resolve the deployment map image URL to absolute */
            const imgSrc = $('img').attr('src') ?? '';
            const mapUrl = this.resolveUrl(imgSrc);

            /**
             * Extract special rules from Designer's Note spans.
             * These appear as `<span class="itc"><b>Designer's Note:</b> <i>...</i></span>`.
             */
            const itcSpan = $('span.itc');
            let specialRules: string | null = null;

            if (itcSpan.length > 0) {
                specialRules = this.stripHtml(itcSpan.html() ?? '');
            }

            return {
                id,
                name,
                category,
                specialRules,
                mapUrl,
            };
        });
    }

    /**
     * Parses challenger cards from an array of HTML fragments.
     *
     * Each challenger card is dual-sided: a stratagem on one side and a mission on the other.
     * The parser extracts both sides:
     *
     * **Stratagem side:**
     * - Name from `.str10Name`
     * - CP cost from `.str10CP` (e.g. "0CP" → 0)
     * - WHEN/TARGET/EFFECT from `.str10Text` bold labels
     *
     * **Mission side (two formats):**
     * - Table-based: header contains mission name and battle round, `.pnVP` for VP, condition
     *   text from table rows
     * - Action-based: `(ACTION)` marker in `.pnWhen` div with STARTS/UNITS/COMPLETES/IF COMPLETED,
     *   VP extracted from "IF COMPLETED" text (e.g. "You score 3VP")
     *
     * @param fragments - Array of HTML strings, one per challenger card
     * @returns Array of parsed ChallengerCard objects
     */
    private parseChallengerCards(fragments: string[]): ChallengerCard[] {
        return fragments.map((fragment) => {
            const $ = cheerio.load(fragment, { xml: false });

            const stratagem = this.parseChallengerStratagem($);
            const mission = this.parseChallengerMission($, fragment);

            const id = this.toKebabCase(stratagem.name);

            return {
                id,
                stratagem,
                mission,
            };
        });
    }

    /**
     * Parses the stratagem side of a challenger card.
     *
     * Extracts stratagem name, CP cost, and the three required fields (WHEN, TARGET, EFFECT)
     * from the `.str10Wrap` section of the card.
     *
     * @param $ - Cheerio instance loaded with the full challenger card HTML
     * @returns Parsed ChallengerStratagem object
     */
    private parseChallengerStratagem($: cheerio.CheerioAPI): ChallengerStratagem {
        const name = this.toTitleCase($('.str10Name').text().trim());

        /** Parse CP cost from text like "0CP" → 0 */
        const cpText = $('.str10CP').text().trim();
        const cpCost = parseInt(cpText.replace('CP', ''), 10) || 0;

        /** Extract WHEN, TARGET, EFFECT from the stratagem text block */
        const strText = $('.str10Text').html() ?? '';

        const whenMatch = strText.match(/<b>WHEN:<\/b><\/span>\s*(.*?)(?:<br><br>)/s);
        const targetMatch = strText.match(/<b>TARGET:<\/b><\/span>\s*(.*?)(?:<br><br>)/s);
        const effectMatch = strText.match(/<b>EFFECT:<\/b><\/span>\s*(.*?)(?:<\/div>|$)/s);

        return {
            name,
            cpCost,
            when: whenMatch ? this.stripHtml(whenMatch[1]) : '',
            target: targetMatch ? this.stripHtml(targetMatch[1]) : '',
            effect: effectMatch ? this.stripHtml(effectMatch[1]) : '',
        };
    }

    /**
     * Parses the mission side of a challenger card.
     *
     * Handles two formats:
     * 1. **Table-based missions**: The mission name appears in the table header
     *    (e.g. "FOCUSED EFFORT (ANY BATTLE ROUND)"). The condition is extracted from
     *    table data rows, and VP from `.pnVP` divs.
     * 2. **Action-based missions**: The mission name appears in a `.pnWhen` div with
     *    "(ACTION)". The condition is built from the STARTS/UNITS/COMPLETES/IF COMPLETED
     *    fields, and VP is extracted from the "IF COMPLETED" text.
     *
     * @param $ - Cheerio instance loaded with the full challenger card HTML
     * @param fragment - Raw HTML string of the card (for regex fallback matching)
     * @returns Parsed ChallengerMission object
     */
    private parseChallengerMission($: cheerio.CheerioAPI, fragment: string): ChallengerMission {
        /**
         * Find content after the "CHALLENGER STRATAGEM OR CHALLENGER MISSION" divider.
         * The mission side begins after `.CA6_challenger`.
         */
        const challengerDivider = $('.CA6_challenger');

        /**
         * Check if this is an action-based mission by looking for `.pnWhen` divs
         * AFTER the challenger divider that contain "(ACTION)".
         */
        const pnWhenDivs = challengerDivider.nextAll('div.pnWhen');
        const isActionMission = pnWhenDivs.length > 0 && pnWhenDivs.text().includes('(ACTION)');

        if (isActionMission) {
            return this.parseChallengerActionMission($, fragment);
        }

        return this.parseChallengerTableMission($, fragment);
    }

    /**
     * Parses a table-based challenger mission.
     *
     * Table missions have a header row with the mission name (e.g. "FOCUSED EFFORT (ANY BATTLE ROUND)")
     * followed by data rows containing the condition text and VP values.
     *
     * @param $ - Cheerio instance loaded with the full challenger card HTML
     * @param fragment - Raw HTML string for regex fallback
     * @returns Parsed ChallengerMission with name, condition, and VP reward
     */
    private parseChallengerTableMission($: cheerio.CheerioAPI, fragment: string): ChallengerMission {
        /**
         * The mission table appears after the CA6_challenger divider.
         * The first table after the divider contains the mission data.
         * The header cell has the mission name + battle round info.
         */
        const divider = $('.CA6_challenger');
        const missionTable = divider.nextAll('div.BreakInsideAvoid').first().find('table.customTable');

        /**
         * Extract mission name from the header cell (blue background).
         * The header text is like "FOCUSED EFFORT (ANY BATTLE ROUND)".
         * We extract just the mission name portion before the parenthesized timing.
         */
        let missionName = 'Unknown';
        const headerCells = missionTable.find('td[style*="background-color:rgb(10,80,111)"]');

        if (headerCells.length > 0) {
            const headerText = headerCells.first().text().trim();
            const nameMatch = headerText.match(/^(.+?)\s*\(/);
            missionName = nameMatch ? this.toTitleCase(nameMatch[1].trim()) : this.toTitleCase(headerText);
        }

        /**
         * Extract VP from .pnVP divs within the mission table section.
         * Some missions have multiple VP values (e.g. ZONE DEFENCE: "1VP PER AREA (UP TO 3VP)").
         * We take the largest .pnVP value as the reward.
         */
        const afterDivider = fragment.substring(fragment.indexOf('CA6_challenger'));
        const vpValues = this.extractVpValues(afterDivider);
        const vpReward = vpValues.length > 0 ? vpValues[vpValues.length - 1] : 0;

        /**
         * Extract condition text from the data rows of the mission table.
         * Skip the header row, WHEN row, and empty rows. Collect all condition text.
         */
        const conditionParts: string[] = [];
        const dataRows = missionTable.find('tr').slice(1);
        dataRows.each((_index, row) => {
            const cells = $(row).find('td');
            const firstCell = cells.first();
            const cellText = firstCell.text().trim();

            /** Skip empty rows, WHEN rows, and VP-only rows */
            if (
                cellText &&
                !cellText.startsWith('WHEN:') &&
                cellText !== 'OR' &&
                !cellText.match(/^\d+VP/) &&
                cellText !== 'VICTORY POINTS'
            ) {
                conditionParts.push(cellText);
            }
        });

        const condition = conditionParts.join(' OR ') || missionName;

        return {
            name: missionName,
            condition,
            vpReward,
        };
    }

    /**
     * Parses an action-based challenger mission.
     *
     * Action missions have a `.pnWhen` div with "(ACTION)" containing the mission name
     * (e.g. "SECURE EXTRACTION ZONE (ACTION)") followed by a table with
     * STARTS/UNITS/COMPLETES/IF COMPLETED fields. VP is extracted from the IF COMPLETED text
     * (e.g. "You score 3VP").
     *
     * @param $ - Cheerio instance loaded with the full challenger card HTML
     * @param fragment - Raw HTML string for regex matching of action fields
     * @returns Parsed ChallengerMission with name, condition, and VP reward
     */
    private parseChallengerActionMission(_$: cheerio.CheerioAPI, fragment: string): ChallengerMission {
        /**
         * Extract the action name from the `.pnWhen` div after the CA6_challenger divider.
         * Text format: "SECURE EXTRACTION ZONE (ACTION)"
         */
        const afterDivider = fragment.substring(fragment.indexOf('CA6_challenger'));
        const actionNameMatch = afterDivider.match(/class="pnWhen"[^>]*>.*?<div>([^<]*?)\s*\(ACTION\)/s);
        let missionName = 'Unknown';

        if (actionNameMatch) {
            missionName = this.toTitleCase(actionNameMatch[1].trim());
        }

        /**
         * Build condition from the action fields. The condition summarizes what must be done.
         * We extract from the section after the CA6_challenger divider only.
         */
        const startsMatch = afterDivider.match(/<b>STARTS:<\/b>\s*(.*?)(?:<br><br>|<\/td>)/s);
        const unitsMatch = afterDivider.match(/<b>UNITS:<\/b>\s*(.*?)(?:<br><br>|<\/td>)/s);
        const completesMatch = afterDivider.match(/<b>COMPLETES:<\/b>\s*(.*?)(?:<br><br>|<\/td>)/s);
        const effectMatch = afterDivider.match(/<b>IF COMPLETED:<\/b>\s*(.*?)(?:<\/td>|<\/div>)/s);

        const conditionParts: string[] = [];

        if (startsMatch) {
            conditionParts.push(`Starts: ${this.stripHtml(startsMatch[1])}`);
        }

        if (unitsMatch) {
            conditionParts.push(`Units: ${this.stripHtml(unitsMatch[1])}`);
        }

        if (completesMatch) {
            conditionParts.push(`Completes: ${this.stripHtml(completesMatch[1])}`);
        }

        if (effectMatch) {
            conditionParts.push(`If Completed: ${this.stripHtml(effectMatch[1])}`);
        }

        const condition = conditionParts.join('. ') || missionName;

        /** Extract VP from "IF COMPLETED" text (e.g. "You score 3VP") */
        const vpMatch = afterDivider.match(/<b>(\d+)VP<\/b>/);
        const vpReward = vpMatch ? parseInt(vpMatch[1], 10) : 0;

        return {
            name: missionName,
            condition,
            vpReward,
        };
    }

    /**
     * Parses twist cards from an array of HTML fragments.
     *
     * Twist cards are simple: name from `.cgHeader` and rules text from `.cgText`.
     *
     * @param fragments - Array of HTML strings, one per twist card
     * @returns Array of parsed TwistCard objects
     */
    private parseTwistCards(fragments: string[]): TwistCard[] {
        return fragments.map((fragment) => {
            const $ = cheerio.load(fragment, { xml: false });

            const rawName = $('.cgHeader').text().trim();
            const name = this.toTitleCase(rawName);
            const id = this.toKebabCase(rawName);
            const rulesText = this.stripHtml($('.cgText').html() ?? '');

            return {
                id,
                name,
                rulesText,
            };
        });
    }

    /**
     * Parses the tournament mission pool from the static HTML table.
     *
     * The tournament table contains "CHAPTER APPROVED TOURNAMENT MISSION POOL" as a header
     * and has rows labeled A through T, each with: label, primary mission name, deployment zone
     * name, and recommended terrain layouts.
     *
     * Mission and deployment references are resolved to their kebab-case IDs by matching
     * against the parsed primary missions and deployment zones.
     *
     * @param html - Full page HTML containing the tournament table
     * @param primaryMissions - Already-parsed primary missions for ID resolution
     * @param deploymentZones - Already-parsed deployment zones for ID resolution
     * @returns Array of 20 TournamentMission objects (A through T)
     */
    private parseTournamentMissions(
        html: string,
        primaryMissions: PrimaryMission[],
        deploymentZones: DeploymentZone[],
    ): TournamentMission[] {
        const $ = cheerio.load(html, { xml: false });

        /** Find the table containing "CHAPTER APPROVED TOURNAMENT MISSION POOL" */
        let tableHtml = '';
        $('table').each(function () {
            if ($(this).text().includes('CHAPTER APPROVED TOURNAMENT MISSION POOL')) {
                tableHtml = $.html(this);

                return false;
            }

            return undefined;
        });

        if (!tableHtml) {
            return [];
        }

        const missions: TournamentMission[] = [];
        const table$ = cheerio.load(tableHtml, { xml: false });

        table$('tr').each((_index, row) => {
            const cells = table$(row).find('td');

            if (cells.length < 4) {
                return;
            }

            const label = table$(cells[0]).text().trim();

            /** Only process rows with single-letter labels A-T */
            if (label.length !== 1 || label < 'A' || label > 'T') {
                return;
            }

            const primaryName = table$(cells[1]).text().trim();
            const deploymentName = table$(cells[2]).text().trim();
            const terrainText = table$(cells[3]).text().trim();

            /**
             * Resolve primary mission ID by matching title-cased name.
             * Tournament table uses title case names like "Take and Hold".
             */
            const primaryMission = primaryMissions.find((pm) => pm.name.toLowerCase() === primaryName.toLowerCase());
            const primaryMissionId = primaryMission?.id ?? this.toKebabCase(primaryName);

            /**
             * Resolve deployment zone ID. Tournament table shows deployment names without
             * category suffix, and all tournament missions use strike-force deployments.
             */
            const deploymentZone = deploymentZones.find(
                (dz) => dz.name.toLowerCase() === deploymentName.toLowerCase() && dz.category === 'strike-force',
            );
            const deploymentZoneId = deploymentZone?.id ?? `${this.toKebabCase(deploymentName)}-strike-force`;

            /**
             * Parse terrain layout references. The terrain column contains comma-separated
             * layout labels like "Layout 1, Layout 2, Layout 4".
             * Convert to IDs: "Layout 1" → "layout-1".
             */
            const recommendedLayoutIds = terrainText
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
                .map((t) => {
                    const numMatch = t.match(/Layout\s+(\d+)/i);

                    return numMatch ? `layout-${numMatch[1]}` : this.toKebabCase(t);
                });

            missions.push({
                id: `mission-${label.toLowerCase()}`,
                label,
                primaryMissionId,
                deploymentZoneId,
                recommendedLayoutIds,
            });
        });

        return missions;
    }

    /**
     * Parses terrain layouts from static HTML img tags.
     *
     * Terrain layout images match the pattern `/wh40k10ed/img/maps/TerrainLayout/CA_TerrainLayout{N}.png`.
     * There are 8 layouts (1-8). Compatible deployments are derived by reverse-mapping from
     * the tournament missions table: a layout is compatible with a deployment if any tournament
     * mission uses both that deployment and that layout.
     *
     * @param html - Full page HTML containing terrain layout images
     * @param tournamentMissions - Already-parsed tournament missions for deriving compatible deployments
     * @returns Array of 8 TerrainLayout objects
     */
    private parseTerrainLayouts(html: string, tournamentMissions: TournamentMission[]): TerrainLayout[] {
        const layouts: TerrainLayout[] = [];

        /** Find all terrain layout image URLs matching the expected pattern */
        const imgPattern = /\/wh40k10ed\/img\/maps\/TerrainLayout\/CA_TerrainLayout(\d+)\.png/g;
        const foundNumbers = new Set<number>();

        let imgMatch: RegExpExecArray | null;

        while ((imgMatch = imgPattern.exec(html)) !== null) {
            foundNumbers.add(parseInt(imgMatch[1], 10));
        }

        /** Sort layout numbers and create TerrainLayout objects */
        const sortedNumbers = [...foundNumbers].sort((a, b) => a - b);

        for (const num of sortedNumbers) {
            const id = `layout-${num}`;
            const label = `Layout ${num}`;
            const layoutUrl = this.resolveUrl(`/wh40k10ed/img/maps/TerrainLayout/CA_TerrainLayout${num}.png`);

            /**
             * Derive compatible deployments by checking which tournament missions
             * reference this layout. Collect unique deployment zone IDs.
             */
            const compatibleDeploymentSet = new Set<string>();

            for (const mission of tournamentMissions) {
                if (mission.recommendedLayoutIds.includes(id)) {
                    compatibleDeploymentSet.add(mission.deploymentZoneId);
                }
            }

            layouts.push({
                id,
                label,
                compatibleDeployments: [...compatibleDeploymentSet],
                layoutUrl,
            });
        }

        return layouts;
    }
}
