import type { BattleScribeConstraint } from './types.ts';
import { ensureArray } from './types.ts';
import type { ParsedConstraint } from './constraintTypes.ts';

/**
 * Parse a single BattleScribe constraint XML element into a ParsedConstraint.
 *
 * Extracts constraint metadata from BattleScribe `<constraint>` XML elements
 * and converts them to a typed ParsedConstraint object. Maps BattleScribe XML
 * attributes (@_type, @_field, @_scope, @_value, @_id) to the ParsedConstraint
 * interface fields.
 *
 * BattleScribe constraint XML structure:
 * ```xml
 * <constraint id="..." type="max" field="selections" scope="roster" value="3" />
 * ```
 *
 * @param constraint - The BattleScribe constraint XML element to parse
 * @param sourceEntryId - Optional ID of the entry this constraint belongs to
 * @param sourceEntryName - Optional human-readable name of the source entry
 * @returns A typed ParsedConstraint object ready for validation
 */
export function parseConstraint(
    constraint: BattleScribeConstraint,
    sourceEntryId?: string,
    sourceEntryName?: string,
): ParsedConstraint {
    const value = parseInt(constraint['@_value'] ?? '0', 10);

    return {
        id: constraint['@_id'],
        constraintType: constraint['@_type'] as 'min' | 'max' | 'increment',
        value: Number.isNaN(value) ? 0 : value,
        field: constraint['@_field'] ?? 'selections',
        scope: constraint['@_scope'] ?? 'self',
        sourceEntryId,
        sourceEntryName,
    };
}

/**
 * Parse all constraints from a constraints container (handles single or array).
 *
 * Batch version of parseConstraint() that handles BattleScribe constraint containers.
 * Normalizes single constraint elements to arrays using ensureArray() and parses
 * each constraint individually. Returns an empty array if the container is undefined.
 *
 * BattleScribe XML structure:
 * ```xml
 * <constraints>
 *   <constraint id="..." type="max" field="selections" scope="roster" value="3" />
 *   <constraint id="..." type="max" field="points" scope="roster" value="500" />
 * </constraints>
 * ```
 *
 * @param container - The constraints container with a constraint property (single or array)
 * @param sourceEntryId - Optional ID of the entry these constraints belong to
 * @param sourceEntryName - Optional human-readable name of the source entry
 * @returns Array of parsed ParsedConstraint objects, empty if container is undefined
 */
export function parseConstraints(
    container: { constraint: BattleScribeConstraint | BattleScribeConstraint[] } | undefined,
    sourceEntryId?: string,
    sourceEntryName?: string,
): ParsedConstraint[] {
    if (!container) {
        return [];
    }

    const constraints = ensureArray(container.constraint);

    return constraints.map((constraint) => parseConstraint(constraint, sourceEntryId, sourceEntryName));
}
