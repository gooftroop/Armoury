/**
 * Test Plan for ChapterApprovedParser.ts
 *
 * Source: src/systems/wh40k10e/src/data/ChapterApprovedParser.ts
 *
 * Requirement 1: Extract JavaScript arrays from `<script>` tags by variable name
 *   - Test: extracts a single-element JS array from a script tag
 *   - Test: extracts a multi-element JS array from a script tag
 *   - Test: returns empty array when variable name is not found
 *   - Test: returns empty array for empty HTML
 *
 * Requirement 2: Parse primary missions from ContentPM (standard) and ContentPM_AW (asymmetric-war)
 *   - Test: parses standard primary mission without action
 *   - Test: parses standard primary mission with action (STARTS/UNITS/COMPLETES/IF COMPLETED)
 *   - Test: parses asymmetric-war primary mission
 *   - Test: parses primary mission with OR section (alternative scoring)
 *   - Test: extracts VP values (vpPerScore = smallest, maxVP = largest)
 *   - Test: extracts scoring timing from non-action .pnWhen div
 *
 * Requirement 3: Parse secondary missions from ContentSM (fixed+tactical) and ContentSM_NoFixed (tactical-only)
 *   - Test: parses fixed secondary mission (showFix class)
 *   - Test: parses tactical secondary mission (showTac class)
 *   - Test: parses tactical secondary mission with action
 *   - Test: extracts When Drawn condition
 *   - Test: appends type suffix to secondary mission IDs
 *
 * Requirement 4: Parse deployment zones from ContentD_SF, ContentD_In, and ContentD_AW
 *   - Test: parses strike-force deployment zone without special rules
 *   - Test: parses incursion deployment zone
 *   - Test: parses asymmetric-war deployment zone with Designer's Note special rules
 *   - Test: resolves deployment map image URLs to absolute
 *
 * Requirement 5: Parse challenger cards from ContentChallenger array
 *   - Test: parses challenger card with table-based mission
 *   - Test: parses challenger card with action-based mission
 *   - Test: extracts stratagem name, CP cost, WHEN/TARGET/EFFECT
 *
 * Requirement 6: Parse twist cards from ContentTwist array
 *   - Test: parses twist card with name and rules text
 *
 * Requirement 7: Parse tournament mission pool from static HTML table
 *   - Test: parses tournament missions from table rows A-T
 *   - Test: resolves primary mission references to kebab-case IDs
 *   - Test: resolves deployment zone references to strike-force IDs
 *   - Test: parses recommended terrain layout IDs
 *
 * Requirement 8: Parse terrain layouts from static HTML img tags
 *   - Test: parses terrain layout images
 *   - Test: derives compatible deployments from tournament mission data
 *
 * Requirement 9: Generate kebab-case IDs
 *   - Test: converts ALL CAPS name to kebab-case
 *   - Test: handles names with special characters
 *
 * Requirement 10: Title-case names from ALL CAPS headers
 *   - Test: converts ALL CAPS to Title Case
 *
 * Requirement 11: Strip HTML tags and normalize whitespace
 *   - Test: strips HTML tags and collapses whitespace
 *
 * Requirement 12: Resolve relative image URLs to absolute Wahapedia URLs
 *   - Test: prepends base URL to relative paths
 *   - Test: returns absolute URLs unchanged
 *
 * Requirement 13: Model metadata
 *   - Test: returns ChapterApproved with correct id and version
 *
 * Requirement 14: Full parse — correct counts
 *   - Test: produces correct counts for all card types from a full HTML fixture
 */

import { describe, it, expect } from 'vitest';
import { ChapterApprovedParser } from '@wh40k10e/data/ChapterApprovedParser.js';

// ─── Accessor Type for Private Methods ────────────────────────────────────────

/**
 * Type accessor for testing private methods on ChapterApprovedParser.
 * Uses the `as unknown as` pattern per project test conventions.
 */
interface ParserTestAccessor {
    extractJsArray(html: string, varName: string): string[];
    toTitleCase(name: string): string;
    toKebabCase(name: string): string;
    stripHtml(html: string): string;
    resolveUrl(url: string): string;
}

/** Casts a ChapterApprovedParser instance to expose private methods for testing. */
const asAccessor = (parser: ChapterApprovedParser): ParserTestAccessor => parser as unknown as ParserTestAccessor;

// ─── HTML Fixture Builders ────────────────────────────────────────────────────

/**
 * Builds a primary mission HTML fragment (no action).
 * Matches the Wahapedia structure: `.cgHeader` for name, `.cgText` for rules,
 * `.pnWhen` for scoring timing, `<b>NVP</b>` for VP values.
 */
const buildPrimaryMissionFragment = (
    name: string,
    rulesText: string,
    scoringTiming: string,
    vpValues: number[],
): string => {
    const vpHtml = vpValues.map((v) => `<b>${v}VP</b>`).join(' ... ');

    return (
        `<div class="cgHeader">${name}</div>` +
        `<div class="cgText">${rulesText}</div>` +
        `<div class="pnWhen"><div>${scoringTiming}</div></div>` +
        `${vpHtml}`
    );
};

/**
 * Builds a primary mission HTML fragment with an action.
 * Includes `(ACTION)` in a `.pnWhen` div plus STARTS/UNITS/COMPLETES/IF COMPLETED fields.
 */
const buildPrimaryMissionWithActionFragment = (
    name: string,
    actionName: string,
    rulesText: string,
    scoringTiming: string,
    vpValues: number[],
): string => {
    const vpHtml = vpValues.map((v) => `<b>${v}VP</b>`).join(' ... ');

    return (
        `<div class="cgHeader">${name}</div>` +
        `<div class="cgText">${rulesText}</div>` +
        `<div class="pnWhen"><div>${actionName} (ACTION)</div></div>` +
        `<b>STARTS:</b> End of your Movement phase<br><br>` +
        `<b>UNITS:</b> One Infantry unit from your army<br><br>` +
        `<b>COMPLETES:</b> End of your next Command phase<br><br>` +
        `<b>IF COMPLETED:</b> Place one terraform token<br><br>` +
        `${vpHtml}` +
        `<div class="pnWhen"><div>${scoringTiming}</div></div>`
    );
};

/**
 * Builds a primary mission HTML fragment with an OR section.
 * Includes a `.pnWhenOR` div indicating alternative scoring conditions.
 */
const buildPrimaryMissionWithOrFragment = (
    name: string,
    rulesText: string,
    scoringTiming: string,
    vpValues: number[],
): string => {
    const vpHtml = vpValues.map((v) => `<b>${v}VP</b>`).join(' ... ');

    return (
        `<div class="cgHeader">${name}</div>` +
        `<div class="cgText">${rulesText}</div>` +
        `<div class="pnWhenOR"></div>` +
        `<div class="pnWhen"><div>${scoringTiming}</div></div>` +
        `${vpHtml}`
    );
};

/**
 * Builds a fixed secondary mission HTML fragment.
 * Uses `.showFix` wrapper, `.cgHeader` for name, `.cgText` with `When Drawn:`,
 * and `.pnVP` divs for VP values.
 */
const buildFixedSecondaryFragment = (
    name: string,
    whenDrawn: string,
    rulesText: string,
    vpValues: number[],
): string => {
    const vpHtml = vpValues.map((v) => `<div class="pnVP">${v}VP</div>`).join(' ');

    return (
        `<div class="showFix">` +
        `<div class="cgHeader">${name}</div>` +
        `<div class="cgText"><b>When Drawn:</b> ${whenDrawn}<br><br>${rulesText}</div>` +
        `${vpHtml}` +
        `</div>`
    );
};

/**
 * Builds a tactical secondary mission HTML fragment (no action).
 * Uses `.showTac` wrapper class.
 */
const buildTacticalSecondaryFragment = (
    name: string,
    whenDrawn: string,
    rulesText: string,
    vpValues: number[],
): string => {
    const vpHtml = vpValues.map((v) => `<div class="pnVP">${v}VP</div>`).join(' ');

    return (
        `<div class="showTac">` +
        `<div class="cgHeader">${name}</div>` +
        `<div class="cgText"><b>When Drawn:</b> ${whenDrawn}<br><br>${rulesText}</div>` +
        `${vpHtml}` +
        `</div>`
    );
};

/**
 * Builds a tactical secondary mission HTML fragment with an action.
 * Uses `.showTac` wrapper and `.pnWhen_A` for the action marker.
 */
const buildTacticalSecondaryWithActionFragment = (
    name: string,
    actionName: string,
    whenDrawn: string,
    rulesText: string,
    vpValues: number[],
): string => {
    const vpHtml = vpValues.map((v) => `<div class="pnVP">${v}VP</div>`).join(' ');

    return (
        `<div class="showTac">` +
        `<div class="cgHeader">${name}</div>` +
        `<div class="cgText"><b>When Drawn:</b> ${whenDrawn}<br><br>${rulesText}</div>` +
        `<div class="pnWhen_A"><div>${actionName} (ACTION)</div></div>` +
        `<b>STARTS:</b> End of your Movement phase<br><br>` +
        `<b>UNITS:</b> One unit<br><br>` +
        `<b>COMPLETES:</b> End of your next Command phase<br><br>` +
        `<b>IF COMPLETED:</b> Objective is sabotaged<br><br>` +
        `${vpHtml}` +
        `</div>`
    );
};

/**
 * Builds a deployment zone HTML fragment without special rules.
 * Uses `.cgHeader` for name and `img` for map.
 */
const buildDeploymentZoneFragment = (name: string, imgPath: string): string => {
    return `<div class="cgHeader">${name}</div><img src="${imgPath}">`;
};

/**
 * Builds a deployment zone HTML fragment with Designer's Note special rules.
 * Includes `<span class="itc">` with designer note content.
 */
const buildDeploymentZoneWithSpecialRulesFragment = (name: string, imgPath: string, specialRules: string): string => {
    return (
        `<div class="cgHeader">${name}</div>` +
        `<img src="${imgPath}">` +
        `<span class="itc"><b>Designer's Note:</b> <i>${specialRules}</i></span>`
    );
};

/**
 * Builds a challenger card HTML fragment with a table-based mission.
 * Stratagem side: `.str10Name`, `.str10CP`, `.str10Text` with WHEN/TARGET/EFFECT.
 * Mission side: table after `.CA6_challenger` with header and condition rows, `.pnVP` for VP.
 */
const buildTableChallengerFragment = (
    stratName: string,
    cpCost: string,
    when: string,
    target: string,
    effect: string,
    missionName: string,
    missionCondition: string,
    vpReward: number,
): string => {
    return (
        `<div class="str10Wrap">` +
        `<div class="str10Name">${stratName}</div>` +
        `<div class="str10CP">${cpCost}</div>` +
        `<div class="str10Text">` +
        `<span><b>WHEN:</b></span> ${when}<br><br>` +
        `<span><b>TARGET:</b></span> ${target}<br><br>` +
        `<span><b>EFFECT:</b></span> ${effect}</div></div>` +
        `<div class="CA6_challenger">CHALLENGER STRATAGEM OR CHALLENGER MISSION</div>` +
        `<div class="BreakInsideAvoid"><table class="customTable">` +
        `<tr><td style="background-color:rgb(10,80,111)">${missionName} (ANY BATTLE ROUND)</td></tr>` +
        `<tr><td>${missionCondition}</td></tr>` +
        `</table></div>` +
        `<div class="pnVP">${vpReward}VP</div>`
    );
};

/**
 * Builds a challenger card HTML fragment with an action-based mission.
 * Mission side has `(ACTION)` in `.pnWhen` after `.CA6_challenger` divider.
 */
const buildActionChallengerFragment = (
    stratName: string,
    cpCost: string,
    when: string,
    target: string,
    effect: string,
    missionActionName: string,
    vpReward: number,
): string => {
    return (
        `<div class="str10Wrap">` +
        `<div class="str10Name">${stratName}</div>` +
        `<div class="str10CP">${cpCost}</div>` +
        `<div class="str10Text">` +
        `<span><b>WHEN:</b></span> ${when}<br><br>` +
        `<span><b>TARGET:</b></span> ${target}<br><br>` +
        `<span><b>EFFECT:</b></span> ${effect}</div></div>` +
        `<div class="CA6_challenger">CHALLENGER STRATAGEM OR CHALLENGER MISSION</div>` +
        `<div class="pnWhen"><div>${missionActionName} (ACTION)</div></div>` +
        `<table><tr><td>` +
        `<b>STARTS:</b> End of your Movement phase<br><br>` +
        `<b>UNITS:</b> One Infantry unit<br><br>` +
        `<b>COMPLETES:</b> End of your next Command phase<br><br>` +
        `<b>IF COMPLETED:</b> You score <b>${vpReward}VP</b><br><br>` +
        `</td></tr></table>`
    );
};

/** Builds a twist card HTML fragment. */
const buildTwistCardFragment = (name: string, rulesText: string): string => {
    return `<div class="cgHeader">${name}</div><div class="cgText">${rulesText}</div>`;
};

/**
 * Wraps HTML fragment arrays into a `<script>` block with `var <varName> = [...]` syntax.
 * Fragments are single-quoted and comma-separated, matching Wahapedia's JS array format.
 */
const wrapJsArray = (varName: string, fragments: string[]): string => {
    const escaped = fragments.map((f) => f.replace(/'/g, "\\'"));

    return `var ${varName} = ['${escaped.join("', '")}'];`;
};

/**
 * Builds a tournament mission pool HTML table.
 * Each row has: label, primary mission name, deployment name, terrain layouts.
 */
const buildTournamentTable = (
    rows: Array<{ label: string; primary: string; deployment: string; layouts: string[] }>,
): string => {
    const headerRow =
        '<tr><td colspan="4">CHAPTER APPROVED TOURNAMENT MISSION POOL</td></tr>' +
        '<tr><td></td><td>Primary Mission</td><td>Deployment</td><td>Recommended Terrain Layouts</td></tr>';
    const dataRows = rows
        .map((r) => {
            const layoutSpans = r.layouts.map((l) => `<span class="tt kwbu">${l}</span>`).join(', ');

            return (
                `<tr>` +
                `<td>${r.label}</td>` +
                `<td><span class="tt kwbu">${r.primary}</span></td>` +
                `<td><span class="tt kwbu">${r.deployment}</span></td>` +
                `<td>${layoutSpans}</td>` +
                `</tr>`
            );
        })
        .join('');

    return `<table>${headerRow}${dataRows}</table>`;
};

/**
 * Builds terrain layout img tags matching the Wahapedia pattern.
 * @param numbers - Layout numbers (e.g. [1, 2, 3])
 */
const buildTerrainLayoutImages = (numbers: number[]): string => {
    return numbers.map((n) => `<img src="/wh40k10ed/img/maps/TerrainLayout/CA_TerrainLayout${n}.png">`).join('\n');
};

/**
 * Builds a full HTML page with script arrays, tournament table, and terrain images.
 * Used for integration-style tests of the full `parse()` method.
 */
const buildFullHtmlPage = (opts: { scriptArrays: string; tournamentTable: string; terrainImages: string }): string => {
    return (
        `<html><body>` +
        `<script>${opts.scriptArrays}</script>` +
        `${opts.tournamentTable}` +
        `${opts.terrainImages}` +
        `</body></html>`
    );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

/** Describes ChapterApprovedParser parsing behaviors. */
describe('ChapterApprovedParser', () => {
    /** Requirement 1: Extract JavaScript arrays from `<script>` tags by variable name */
    describe('extractJsArray', () => {
        /** Extracts a single-element JS array from a script tag. */
        it('extracts a single-element array', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            const html = `<html><script>var ContentPM = ['<div>hello</div>'];</script></html>`;
            const result = accessor.extractJsArray(html, 'ContentPM');
            expect(result).toHaveLength(1);
            expect(result[0]).toBe('<div>hello</div>');
        });

        /** Extracts a multi-element JS array, splitting on `', '` delimiter. */
        it('extracts a multi-element array', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            const html = `<html><script>var ContentPM = ['<div>one</div>', '<div>two</div>', '<div>three</div>'];</script></html>`;
            const result = accessor.extractJsArray(html, 'ContentPM');
            expect(result).toHaveLength(3);
            expect(result[0]).toBe('<div>one</div>');
            expect(result[1]).toBe('<div>two</div>');
            expect(result[2]).toBe('<div>three</div>');
        });

        /** Returns empty array when the variable name is not found in any script. */
        it('returns empty array for missing variable', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            const html = `<html><script>var ContentPM = ['<div>hi</div>'];</script></html>`;
            const result = accessor.extractJsArray(html, 'ContentXYZ');
            expect(result).toEqual([]);
        });

        /** Returns empty array for empty HTML input. */
        it('returns empty array for empty HTML', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.extractJsArray('', 'ContentPM')).toEqual([]);
        });
    });

    /** Requirement 2: Parse primary missions from ContentPM and ContentPM_AW */
    describe('primary missions', () => {
        /** Parses a standard primary mission without an action — extracts name, rules, VP, timing. */
        it('parses standard primary mission without action', () => {
            const fragment = buildPrimaryMissionFragment(
                'TAKE AND HOLD',
                'Control objective markers to score victory points.',
                'SECOND BATTLE ROUND ONWARDS',
                [3, 15],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.primaryMissions).toHaveLength(1);
            const mission = result.primaryMissions[0];
            expect(mission.id).toBe('take-and-hold');
            expect(mission.name).toBe('Take And Hold');
            expect(mission.category).toBe('standard');
            expect(mission.rulesText).toContain('Control objective markers');
            expect(mission.vpPerScore).toBe(3);
            expect(mission.maxVP).toBe(15);
            expect(mission.scoringTiming).toBe('SECOND BATTLE ROUND ONWARDS');
            expect(mission.action).toBeNull();
        });

        /** Parses a standard primary mission with an action (STARTS/UNITS/COMPLETES/IF COMPLETED). */
        it('parses standard primary mission with action', () => {
            const fragment = buildPrimaryMissionWithActionFragment(
                'TERRAFORM',
                'TERRAFORM',
                'Place terraform tokens to control territory.',
                'END OF BATTLE',
                [1, 4, 12],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.primaryMissions).toHaveLength(1);
            const mission = result.primaryMissions[0];
            expect(mission.id).toBe('terraform');
            expect(mission.name).toBe('Terraform');
            expect(mission.action).not.toBeNull();
            expect(mission.action!.name).toBe('Terraform');
            expect(mission.action!.when).toContain('End of your Movement phase');
            expect(mission.action!.units).toContain('One Infantry unit');
            expect(mission.action!.completed).toContain('End of your next Command phase');
            expect(mission.action!.effect).toContain('terraform token');
            expect(mission.vpPerScore).toBe(1);
            expect(mission.maxVP).toBe(12);
        });

        /** Parses an asymmetric-war primary mission from ContentPM_AW. */
        it('parses asymmetric-war primary mission', () => {
            const fragment = buildPrimaryMissionFragment(
                'SCORCHED EARTH',
                'Destroy enemy territory to score points.',
                'THIRD BATTLE ROUND ONWARDS',
                [5, 20],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM_AW', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.primaryMissions).toHaveLength(1);
            const mission = result.primaryMissions[0];
            expect(mission.category).toBe('asymmetric-war');
            expect(mission.name).toBe('Scorched Earth');
        });

        /** Parses a primary mission with an OR section (alternative scoring conditions). */
        it('parses primary mission with OR section', () => {
            const fragment = buildPrimaryMissionWithOrFragment(
                'LINCHPIN',
                'Score VP for holding the centre objective.',
                'SECOND BATTLE ROUND ONWARDS',
                [5, 15],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.primaryMissions).toHaveLength(1);
            const mission = result.primaryMissions[0];
            expect(mission.name).toBe('Linchpin');
            expect(mission.specialRules).toContain('Alternative scoring condition available');
        });

        /** Extracts VP values: smallest is vpPerScore, largest is maxVP. */
        it('extracts VP values correctly — smallest is vpPerScore, largest is maxVP', () => {
            const fragment = buildPrimaryMissionFragment('VP TEST', 'Test VP extraction.', 'END OF BATTLE', [2, 8, 25]);
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.primaryMissions[0].vpPerScore).toBe(2);
            expect(result.primaryMissions[0].maxVP).toBe(25);
        });

        /** Extracts scoring timing from the non-action .pnWhen div. */
        it('extracts scoring timing from non-action pnWhen div', () => {
            const fragment = buildPrimaryMissionWithActionFragment(
                'TERRAFORM',
                'TERRAFORM',
                'Rules.',
                'END OF BATTLE',
                [1, 12],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            /** The non-action pnWhen is "END OF BATTLE", the action pnWhen contains "(ACTION)". */
            expect(result.primaryMissions[0].scoringTiming).toBe('END OF BATTLE');
        });
    });

    /** Requirement 3: Parse secondary missions from ContentSM and ContentSM_NoFixed */
    describe('secondary missions', () => {
        /** Parses a fixed secondary mission — identifies type from `.showFix` class. */
        it('parses fixed secondary mission', () => {
            const fragment = buildFixedSecondaryFragment(
                'BEHIND ENEMY LINES',
                'Draw condition text.',
                'Rules about enemy lines.',
                [2, 6],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentSM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.secondaryMissions).toHaveLength(1);
            const mission = result.secondaryMissions[0];
            expect(mission.name).toBe('Behind Enemy Lines');
            expect(mission.type).toBe('fixed');
            expect(mission.id).toBe('behind-enemy-lines-fixed');
            expect(mission.vpPerScore).toBe(2);
            expect(mission.vpCap).toBe(6);
            expect(mission.whenDrawn).toBe('Draw condition text.');
        });

        /** Parses a tactical secondary mission — identifies type from `.showTac` class. */
        it('parses tactical secondary mission', () => {
            const fragment = buildTacticalSecondaryFragment(
                'AREA DENIAL',
                'When drawn condition.',
                'Deny area to enemy.',
                [3, 9],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentSM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.secondaryMissions).toHaveLength(1);
            const mission = result.secondaryMissions[0];
            expect(mission.name).toBe('Area Denial');
            expect(mission.type).toBe('tactical');
            expect(mission.id).toBe('area-denial-tactical');
        });

        /** Parses a tactical secondary mission with an action. */
        it('parses tactical secondary with action', () => {
            const fragment = buildTacticalSecondaryWithActionFragment(
                'SABOTAGE',
                'SABOTAGE',
                'Drawn condition.',
                'Sabotage objectives.',
                [3, 9],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentSM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.secondaryMissions).toHaveLength(1);
            const mission = result.secondaryMissions[0];
            expect(mission.name).toBe('Sabotage');
            expect(mission.action).not.toBeNull();
            expect(mission.action!.name).toBe('Sabotage');
            expect(mission.action!.when).toContain('End of your Movement phase');
            expect(mission.action!.units).toContain('One unit');
            expect(mission.action!.completed).toContain('End of your next Command phase');
            expect(mission.action!.effect).toContain('sabotaged');
        });

        /** Extracts When Drawn condition from `<b>When Drawn:</b>` text. */
        it('extracts When Drawn condition', () => {
            const fragment = buildFixedSecondaryFragment(
                'MISSION X',
                'Special draw timing applies.',
                'Rules text.',
                [4, 12],
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentSM', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.secondaryMissions[0].whenDrawn).toBe('Special draw timing applies.');
        });

        /** Appends type suffix to secondary mission IDs to disambiguate fixed vs tactical. */
        it('appends type suffix to secondary mission IDs', () => {
            const fixed = buildFixedSecondaryFragment('ENGAGE', 'Draw.', 'Rules.', [2, 6]);
            const tactical = buildTacticalSecondaryFragment('RECON', 'Draw.', 'Rules.', [3, 9]);
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentSM', [fixed, tactical]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.secondaryMissions[0].id).toBe('engage-fixed');
            expect(result.secondaryMissions[1].id).toBe('recon-tactical');
        });
    });

    /** Requirement 4: Parse deployment zones from ContentD_SF, ContentD_In, ContentD_AW */
    describe('deployment zones', () => {
        /** Parses a strike-force deployment zone without special rules. */
        it('parses strike-force deployment zone', () => {
            const fragment = buildDeploymentZoneFragment('TIPPING POINT', '/wh40k10ed/img/maps/SF_TippingPoint.png');
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentD_SF', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.deploymentZones).toHaveLength(1);
            const zone = result.deploymentZones[0];
            expect(zone.name).toBe('Tipping Point');
            expect(zone.id).toBe('tipping-point-strike-force');
            expect(zone.category).toBe('strike-force');
            expect(zone.mapUrl).toBe('https://wahapedia.ru/wh40k10ed/img/maps/SF_TippingPoint.png');
            expect(zone.specialRules).toBeNull();
        });

        /** Parses an incursion deployment zone. */
        it('parses incursion deployment zone', () => {
            const fragment = buildDeploymentZoneFragment(
                'HAMMER AND ANVIL',
                '/wh40k10ed/img/maps/In_HammerAndAnvil.png',
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentD_In', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.deploymentZones).toHaveLength(1);
            expect(result.deploymentZones[0].category).toBe('incursion');
            expect(result.deploymentZones[0].id).toBe('hammer-and-anvil-incursion');
        });

        /** Parses an asymmetric-war deployment zone with Designer's Note special rules. */
        it('parses AW deployment with special rules', () => {
            const fragment = buildDeploymentZoneWithSpecialRulesFragment(
                'LAST STAND',
                '/wh40k10ed/img/maps/AW_LastStand.png',
                'The Defender deploys first.',
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentD_AW', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.deploymentZones).toHaveLength(1);
            const zone = result.deploymentZones[0];
            expect(zone.category).toBe('asymmetric-war');
            expect(zone.specialRules).toContain("Designer\\'s Note:");
            expect(zone.specialRules).toContain('Defender deploys first');
        });

        /** Resolves relative deployment map image URLs to absolute Wahapedia URLs. */
        it('resolves deployment map URLs to absolute', () => {
            const fragment = buildDeploymentZoneFragment('TEST ZONE', '/wh40k10ed/img/maps/SF_Test.png');
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentD_SF', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.deploymentZones[0].mapUrl).toMatch(/^https:\/\/wahapedia\.ru\//);
        });
    });

    /** Requirement 5: Parse challenger cards from ContentChallenger */
    describe('challenger cards', () => {
        /** Parses a challenger card with a table-based mission. */
        it('parses table-based challenger card', () => {
            const fragment = buildTableChallengerFragment(
                'BURST OF SPEED',
                '0CP',
                'Your Movement phase.',
                'One unit from your army.',
                'That unit can move extra.',
                'FOCUSED EFFORT',
                'Control more objectives than opponent.',
                3,
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentChallenger', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.challengerCards).toHaveLength(1);
            const card = result.challengerCards[0];

            /** Stratagem side */
            expect(card.stratagem.name).toBe('Burst Of Speed');
            expect(card.stratagem.cpCost).toBe(0);
            expect(card.stratagem.when).toContain('Movement phase');
            expect(card.stratagem.target).toContain('One unit');
            expect(card.stratagem.effect).toContain('move extra');

            /** Mission side */
            expect(card.mission.name).toBe('Focused Effort');
            expect(card.mission.vpReward).toBe(3);

            /** ID derived from stratagem name */
            expect(card.id).toBe('burst-of-speed');
        });

        /** Parses a challenger card with an action-based mission. */
        it('parses action-based challenger card', () => {
            const fragment = buildActionChallengerFragment(
                'FORCE A BREACH',
                '0CP',
                'Fight phase.',
                'One unit.',
                'Critical wound on 5+.',
                'SECURE EXTRACTION ZONE',
                3,
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentChallenger', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.challengerCards).toHaveLength(1);
            const card = result.challengerCards[0];

            /** Stratagem side */
            expect(card.stratagem.name).toBe('Force A Breach');
            expect(card.stratagem.cpCost).toBe(0);

            /** Mission side — action-based */
            expect(card.mission.name).toBe('Secure Extraction Zone');
            expect(card.mission.vpReward).toBe(3);
            expect(card.mission.condition).toContain('Starts:');
        });

        /** Extracts stratagem CP cost from text like "0CP". */
        it('extracts stratagem CP cost', () => {
            const fragment = buildTableChallengerFragment(
                'TEST STRAT',
                '2CP',
                'Your phase.',
                'Target.',
                'Effect.',
                'TEST MISSION',
                'Condition.',
                5,
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentChallenger', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.challengerCards[0].stratagem.cpCost).toBe(2);
        });
    });

    /** Requirement 6: Parse twist cards from ContentTwist */
    describe('twist cards', () => {
        /** Parses a twist card — extracts name and rules text. */
        it('parses twist card with name and rules text', () => {
            const fragment = buildTwistCardFragment(
                'MARTIAL PRIDE',
                'Each time a unit fails a Battle-shock test, it suffers D3 mortal wounds.',
            );
            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentTwist', [fragment]),
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.twistCards).toHaveLength(1);
            const twist = result.twistCards[0];
            expect(twist.id).toBe('martial-pride');
            expect(twist.name).toBe('Martial Pride');
            expect(twist.rulesText).toContain('Battle-shock test');
            expect(twist.rulesText).toContain('D3 mortal wounds');
        });
    });

    /** Requirement 7: Parse tournament mission pool from static HTML table */
    describe('tournament missions', () => {
        /** Parses tournament missions from the table, resolving primary/deployment references. */
        it('parses tournament missions from table', () => {
            /** Build primary missions and deployment zones for ID resolution */
            const primaryFragment = buildPrimaryMissionFragment('TAKE AND HOLD', 'Rules.', 'TIMING', [3, 15]);
            const deploymentFragment = buildDeploymentZoneFragment(
                'TIPPING POINT',
                '/wh40k10ed/img/maps/SF_TippingPoint.png',
            );

            const tournamentTable = buildTournamentTable([
                {
                    label: 'A',
                    primary: 'Take And Hold',
                    deployment: 'Tipping Point',
                    layouts: ['Layout 1', 'Layout 2'],
                },
            ]);

            const html = buildFullHtmlPage({
                scriptArrays:
                    wrapJsArray('ContentPM', [primaryFragment]) +
                    '\n' +
                    wrapJsArray('ContentD_SF', [deploymentFragment]),
                tournamentTable,
                terrainImages: buildTerrainLayoutImages([1, 2]),
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.tournamentMissions).toHaveLength(1);
            const tm = result.tournamentMissions[0];
            expect(tm.id).toBe('mission-a');
            expect(tm.label).toBe('A');
            expect(tm.primaryMissionId).toBe('take-and-hold');
            expect(tm.deploymentZoneId).toBe('tipping-point-strike-force');
            expect(tm.recommendedLayoutIds).toEqual(['layout-1', 'layout-2']);
        });

        /** Parses multiple tournament rows (A, B). */
        it('parses multiple tournament rows', () => {
            const pm1 = buildPrimaryMissionFragment('TAKE AND HOLD', 'Rules.', 'T', [3, 15]);
            const pm2 = buildPrimaryMissionFragment('SUPPLY DROP', 'Rules.', 'T', [3, 15]);
            const dz1 = buildDeploymentZoneFragment('TIPPING POINT', '/wh40k10ed/img/maps/SF_TP.png');
            const dz2 = buildDeploymentZoneFragment('HAMMER AND ANVIL', '/wh40k10ed/img/maps/SF_HA.png');

            const tournamentTable = buildTournamentTable([
                { label: 'A', primary: 'Take And Hold', deployment: 'Tipping Point', layouts: ['Layout 1'] },
                {
                    label: 'B',
                    primary: 'Supply Drop',
                    deployment: 'Hammer And Anvil',
                    layouts: ['Layout 2', 'Layout 3'],
                },
            ]);

            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM', [pm1, pm2]) + '\n' + wrapJsArray('ContentD_SF', [dz1, dz2]),
                tournamentTable,
                terrainImages: buildTerrainLayoutImages([1, 2, 3]),
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.tournamentMissions).toHaveLength(2);
            expect(result.tournamentMissions[0].label).toBe('A');
            expect(result.tournamentMissions[1].label).toBe('B');
            expect(result.tournamentMissions[1].primaryMissionId).toBe('supply-drop');
            expect(result.tournamentMissions[1].deploymentZoneId).toBe('hammer-and-anvil-strike-force');
        });

        /** Falls back to kebab-case ID when a primary mission reference cannot be resolved. */
        it('falls back to kebab-case when primary mission not found', () => {
            const tournamentTable = buildTournamentTable([
                { label: 'A', primary: 'Unknown Mission', deployment: 'Unknown Zone', layouts: ['Layout 1'] },
            ]);
            const html = buildFullHtmlPage({
                scriptArrays: '',
                tournamentTable,
                terrainImages: buildTerrainLayoutImages([1]),
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.tournamentMissions).toHaveLength(1);
            expect(result.tournamentMissions[0].primaryMissionId).toBe('unknown-mission');
            expect(result.tournamentMissions[0].deploymentZoneId).toBe('unknown-zone-strike-force');
        });
    });

    /** Requirement 8: Parse terrain layouts from static HTML img tags */
    describe('terrain layouts', () => {
        /** Parses terrain layout images and creates TerrainLayout objects. */
        it('parses terrain layout images', () => {
            const pm = buildPrimaryMissionFragment('TAKE AND HOLD', 'Rules.', 'T', [3, 15]);
            const dz = buildDeploymentZoneFragment('TIPPING POINT', '/wh40k10ed/img/maps/SF_TP.png');

            const tournamentTable = buildTournamentTable([
                {
                    label: 'A',
                    primary: 'Take And Hold',
                    deployment: 'Tipping Point',
                    layouts: ['Layout 1', 'Layout 3'],
                },
            ]);

            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM', [pm]) + '\n' + wrapJsArray('ContentD_SF', [dz]),
                tournamentTable,
                terrainImages: buildTerrainLayoutImages([1, 2, 3]),
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.terrainLayouts).toHaveLength(3);
            expect(result.terrainLayouts[0].id).toBe('layout-1');
            expect(result.terrainLayouts[0].label).toBe('Layout 1');
            expect(result.terrainLayouts[0].layoutUrl).toBe(
                'https://wahapedia.ru/wh40k10ed/img/maps/TerrainLayout/CA_TerrainLayout1.png',
            );
        });

        /** Derives compatible deployments from tournament mission data. */
        it('derives compatible deployments from tournament data', () => {
            const pm = buildPrimaryMissionFragment('TAKE AND HOLD', 'Rules.', 'T', [3, 15]);
            const dz = buildDeploymentZoneFragment('TIPPING POINT', '/wh40k10ed/img/maps/SF_TP.png');

            const tournamentTable = buildTournamentTable([
                { label: 'A', primary: 'Take And Hold', deployment: 'Tipping Point', layouts: ['Layout 1'] },
            ]);

            const html = buildFullHtmlPage({
                scriptArrays: wrapJsArray('ContentPM', [pm]) + '\n' + wrapJsArray('ContentD_SF', [dz]),
                tournamentTable,
                terrainImages: buildTerrainLayoutImages([1, 2]),
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            /** Layout 1 is used in mission A with Tipping Point → compatible */
            const layout1 = result.terrainLayouts.find((l) => l.id === 'layout-1');
            expect(layout1).toBeDefined();
            expect(layout1!.compatibleDeployments).toContain('tipping-point-strike-force');

            /** Layout 2 is not referenced in any tournament mission → no compatible deployments */
            const layout2 = result.terrainLayouts.find((l) => l.id === 'layout-2');
            expect(layout2).toBeDefined();
            expect(layout2!.compatibleDeployments).toEqual([]);
        });
    });

    /** Requirement 9: Generate kebab-case IDs from names */
    describe('kebab-case ID generation', () => {
        /** Converts ALL CAPS name to kebab-case. */
        it('converts ALL CAPS name to kebab-case', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.toKebabCase('TAKE AND HOLD')).toBe('take-and-hold');
        });

        /** Handles names with special characters by replacing them with hyphens. */
        it('handles special characters', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.toKebabCase("DESIGNER'S NOTE")).toBe('designer-s-note');
        });

        /** Collapses consecutive hyphens. */
        it('collapses consecutive hyphens', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.toKebabCase('HELLO  WORLD')).toBe('hello-world');
        });

        /** Trims leading/trailing hyphens. */
        it('trims leading and trailing hyphens', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.toKebabCase(' HELLO ')).toBe('hello');
        });
    });

    /** Requirement 10: Title-case names from ALL CAPS headers */
    describe('title-casing', () => {
        /** Converts ALL CAPS to Title Case. */
        it('converts ALL CAPS to Title Case', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.toTitleCase('TAKE AND HOLD')).toBe('Take And Hold');
        });

        /** Handles single-word names. */
        it('handles single-word names', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.toTitleCase('TERRAFORM')).toBe('Terraform');
        });
    });

    /** Requirement 11: Strip HTML tags and normalize whitespace */
    describe('HTML stripping', () => {
        /** Strips HTML tags and collapses whitespace. */
        it('strips HTML tags and normalizes whitespace', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.stripHtml('<b>Bold</b> and <i>italic</i>  text')).toBe('Bold and italic text');
        });

        /** Returns empty string for empty input. */
        it('returns empty string for empty input', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.stripHtml('')).toBe('');
        });

        /** Handles nested tags. */
        it('handles nested tags', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.stripHtml('<div><span>nested</span> text</div>')).toBe('nested text');
        });
    });

    /** Requirement 12: Resolve relative image URLs to absolute Wahapedia URLs */
    describe('URL resolution', () => {
        /** Prepends Wahapedia base URL to relative paths. */
        it('prepends base URL to relative paths', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.resolveUrl('/wh40k10ed/img/map.png')).toBe('https://wahapedia.ru/wh40k10ed/img/map.png');
        });

        /** Returns absolute URLs unchanged. */
        it('returns absolute URLs unchanged', () => {
            const parser = new ChapterApprovedParser();
            const accessor = asAccessor(parser);
            expect(accessor.resolveUrl('https://example.com/img.png')).toBe('https://example.com/img.png');
        });
    });

    /** Requirement 13: Model metadata */
    describe('model metadata', () => {
        /** Returns ChapterApproved with correct id and version. */
        it('returns model with id "chapter-approved-2025-26" and version "2025-26"', () => {
            const html = buildFullHtmlPage({
                scriptArrays: '',
                tournamentTable: '',
                terrainImages: '',
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.id).toBe('chapter-approved-2025-26');
            expect(result.version).toBe('2025-26');
        });
    });

    /** Requirement 14: Full parse — correct counts for all card types */
    describe('full parse integration', () => {
        /** Produces correct counts for all card types from a multi-type HTML fixture. */
        it('produces correct counts for all card types', () => {
            /** Build 2 standard primary missions */
            const pm1 = buildPrimaryMissionFragment('TAKE AND HOLD', 'Rules.', 'TIMING', [3, 15]);
            const pm2 = buildPrimaryMissionWithActionFragment('TERRAFORM', 'TERRAFORM', 'Rules.', 'END', [1, 12]);

            /** Build 1 asymmetric-war primary mission */
            const pmAW = buildPrimaryMissionFragment('SCORCHED EARTH', 'AW rules.', 'TIMING', [5, 20]);

            /** Build 1 strike-force, 1 incursion, 1 AW deployment */
            const dzSF = buildDeploymentZoneFragment('TIPPING POINT', '/wh40k10ed/img/maps/SF_TP.png');
            const dzIn = buildDeploymentZoneFragment('DAWN OF WAR', '/wh40k10ed/img/maps/In_DoW.png');
            const dzAW = buildDeploymentZoneWithSpecialRulesFragment(
                'LAST STAND',
                '/wh40k10ed/img/maps/AW_LS.png',
                'Special rule.',
            );

            /** Build ContentSM: 1 fixed + 2 tactical = 3 entries */
            const smFixed = buildFixedSecondaryFragment('ENGAGE', 'Draw.', 'Rules.', [2, 6]);
            const smTac1 = buildTacticalSecondaryFragment('AREA DENIAL', 'Draw.', 'Rules.', [3, 9]);
            const smTac2 = buildTacticalSecondaryFragment('RECON', 'Draw.', 'Rules.', [4, 12]);

            /** Build ContentSM_NoFixed: 2 tactical entries (same missions as tactical from ContentSM) */
            const smNF1 = buildTacticalSecondaryFragment('AREA DENIAL', 'Draw.', 'Rules.', [3, 9]);
            const smNF2 = buildTacticalSecondaryFragment('RECON', 'Draw.', 'Rules.', [4, 12]);

            /** Build 2 twist cards */
            const tw1 = buildTwistCardFragment('MARTIAL PRIDE', 'Twist rules 1.');
            const tw2 = buildTwistCardFragment('CHILLING RAIN', 'Twist rules 2.');

            /** Build 2 challenger cards (1 table-based, 1 action-based) */
            const ch1 = buildTableChallengerFragment(
                'BURST OF SPEED',
                '0CP',
                'Movement.',
                'Unit.',
                'Effect.',
                'FOCUSED EFFORT',
                'Condition.',
                3,
            );
            const ch2 = buildActionChallengerFragment(
                'FORCE A BREACH',
                '0CP',
                'Fight.',
                'Unit.',
                'Effect.',
                'EXTRACTION ZONE',
                3,
            );

            /** Build tournament table with 2 rows */
            const tournamentTable = buildTournamentTable([
                { label: 'A', primary: 'Take And Hold', deployment: 'Tipping Point', layouts: ['Layout 1'] },
                { label: 'B', primary: 'Terraform', deployment: 'Tipping Point', layouts: ['Layout 1', 'Layout 2'] },
            ]);

            /** Build 2 terrain layout images */
            const terrainImages = buildTerrainLayoutImages([1, 2]);

            const scriptArrays = [
                wrapJsArray('ContentPM', [pm1, pm2]),
                wrapJsArray('ContentPM_AW', [pmAW]),
                wrapJsArray('ContentD_SF', [dzSF]),
                wrapJsArray('ContentD_In', [dzIn]),
                wrapJsArray('ContentD_AW', [dzAW]),
                wrapJsArray('ContentSM', [smFixed, smTac1, smTac2]),
                wrapJsArray('ContentSM_NoFixed', [smNF1, smNF2]),
                wrapJsArray('ContentTwist', [tw1, tw2]),
                wrapJsArray('ContentChallenger', [ch1, ch2]),
            ].join('\n');

            const html = buildFullHtmlPage({
                scriptArrays,
                tournamentTable,
                terrainImages,
            });
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            /** 2 standard + 1 AW = 3 primary missions */
            expect(result.primaryMissions).toHaveLength(3);
            expect(result.primaryMissions.filter((pm) => pm.category === 'standard')).toHaveLength(2);
            expect(result.primaryMissions.filter((pm) => pm.category === 'asymmetric-war')).toHaveLength(1);

            /** 3 from ContentSM + 2 from ContentSM_NoFixed = 5 secondary missions */
            expect(result.secondaryMissions).toHaveLength(5);
            expect(result.secondaryMissions.filter((sm) => sm.type === 'fixed')).toHaveLength(1);
            expect(result.secondaryMissions.filter((sm) => sm.type === 'tactical')).toHaveLength(4);

            /** 1 SF + 1 incursion + 1 AW = 3 deployment zones */
            expect(result.deploymentZones).toHaveLength(3);

            /** 2 challenger cards */
            expect(result.challengerCards).toHaveLength(2);

            /** 2 twist cards */
            expect(result.twistCards).toHaveLength(2);

            /** 2 tournament missions */
            expect(result.tournamentMissions).toHaveLength(2);

            /** 2 terrain layouts */
            expect(result.terrainLayouts).toHaveLength(2);

            /** Correct model metadata */
            expect(result.id).toBe('chapter-approved-2025-26');
            expect(result.version).toBe('2025-26');
        });

        /** Handles empty HTML gracefully — produces zero counts and correct metadata. */
        it('handles empty HTML — returns model with zero counts', () => {
            const html = '<html><body></body></html>';
            const parser = new ChapterApprovedParser();
            const result = parser.parse(html);

            expect(result.id).toBe('chapter-approved-2025-26');
            expect(result.version).toBe('2025-26');
            expect(result.primaryMissions).toHaveLength(0);
            expect(result.secondaryMissions).toHaveLength(0);
            expect(result.deploymentZones).toHaveLength(0);
            expect(result.challengerCards).toHaveLength(0);
            expect(result.twistCards).toHaveLength(0);
            expect(result.tournamentMissions).toHaveLength(0);
            expect(result.terrainLayouts).toHaveLength(0);
        });
    });
});
