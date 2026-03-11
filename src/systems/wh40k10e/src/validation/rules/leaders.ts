import type { Army, ArmyUnit } from '../../models/ArmyModel.ts';
import type { FactionData } from '../../models/FactionData.ts';
import type { Unit } from '../../models/UnitModel.ts';
import type { ValidationResult } from '../types.ts';

/**
 * Look up the unit datasheet name for an army unit.
 * @param armyUnit - The army unit to look up
 * @param factionData - The faction data containing unit definitions
 * @returns The unit name from the datasheet, or the unitId as fallback
 */
function getUnitName(armyUnit: ArmyUnit, factionData: FactionData): string {
    const definition = factionData.units.find((unit) => unit.id === armyUnit.unitId);

    return definition?.name ?? armyUnit.unitId;
}

/**
 * Check that a leader is not assigned to lead itself.
 */
function checkLeaderNotSelf(armyUnit: ArmyUnit, targetUnit: ArmyUnit, leaderName: string): ValidationResult | null {
    if (armyUnit.id !== targetUnit.id) {
        return null;
    }

    return {
        id: `leader-self-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'leader',
        message: `${leaderName} cannot lead itself.`,
        unitId: armyUnit.id,
        unitName: leaderName,
    };
}

/**
 * Check that a leader unit has the Character keyword.
 */
function checkLeaderIsCharacter(armyUnit: ArmyUnit, leaderDefinition: Unit): ValidationResult | null {
    const lowerKeywords = leaderDefinition.keywords.map((k) => k.toLowerCase());

    if (lowerKeywords.includes('character')) {
        return null;
    }

    return {
        id: `leader-not-character-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'leader',
        message: `Only Character units can be leaders. ${leaderDefinition.name} is not a Character.`,
        unitId: armyUnit.id,
        unitName: leaderDefinition.name,
    };
}

/**
 * Check that a leader unit has the Leader ability defined.
 */
function checkLeaderHasAbility(armyUnit: ArmyUnit, leaderDefinition: Unit): ValidationResult | null {
    if (leaderDefinition.leader) {
        return null;
    }

    return {
        id: `leader-missing-ability-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'leader',
        message: `${leaderDefinition.name} does not have leader attachment rules.`,
        unitId: armyUnit.id,
        unitName: leaderDefinition.name,
    };
}

/**
 * Check that the leader's canAttachTo list includes the target unit.
 * Matches by looking up the target unit's datasheet name.
 */
function checkLeaderCanAttachToTarget(
    armyUnit: ArmyUnit,
    leaderDefinition: Unit,
    targetUnitName: string,
    leaderName: string,
): ValidationResult | null {
    if (leaderDefinition.leader && leaderDefinition.leader.canAttachTo.includes(targetUnitName)) {
        return null;
    }

    return {
        id: `leader-invalid-target-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'leader',
        message: `${leaderName} cannot attach to ${targetUnitName}.`,
        unitId: armyUnit.id,
        unitName: leaderName,
        details: {
            allowedTargets: leaderDefinition.leader?.canAttachTo ?? [],
            targetUnitName,
        },
    };
}

/**
 * Check that a target unit does not already have a leader assigned.
 */
function checkTargetNotAlreadyLed(
    targetUnit: ArmyUnit,
    targetUnitName: string,
    newLeaderId: string,
    existingLeaderId: string | undefined,
): ValidationResult | null {
    if (!existingLeaderId) {
        return null;
    }

    return {
        id: `leader-multiple-${targetUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'leader',
        message: `${targetUnitName} already has a leader assigned.`,
        unitId: targetUnit.id,
        unitName: targetUnitName,
        details: {
            existingLeaderId,
            newLeaderId,
        },
    };
}

/**
 * Validate leader attachment rules.
 *
 * This validator runs five checks on leader assignments:
 * 1. checkLeaderNotSelf: A leader cannot be assigned to lead itself.
 * 2. checkLeaderIsCharacter: Only Character units can be leaders.
 * 3. checkLeaderHasAbility: The leader unit must have a Leader ability defined in its datasheet.
 * 4. checkLeaderCanAttachToTarget: The leader's canAttachTo list must include the target unit name.
 * 5. checkTargetNotAlreadyLed: A target unit cannot have multiple leaders assigned.
 *
 * Per Warhammer 40K 10th edition rules, the Leader keyword allows a Character unit to attach to
 * a Bodyguard unit, forming an Attached unit. The Leader's canAttachTo list specifies which unit
 * types it can lead (e.g., "Infantry", "Bodyguard"). Each target unit can only have one leader.
 *
 * @param army - The army list to validate, containing units with optional leadingUnitId assignments.
 * @param factionData - The faction data containing unit definitions with keywords, Character
 *                      status, and Leader ability definitions.
 * @returns Array of ValidationResult objects. Includes error results for leader violations
 *          (self-assignment, non-Character leaders, missing ability, invalid targets, multiple leaders).
 */
export function validateLeaders(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];
    const leadingAssignments = new Map<string, string>();

    for (const armyUnit of army.units) {
        if (!armyUnit.leadingUnitId) {
            continue;
        }

        const leaderDefinition = factionData.units.find((unit) => unit.id === armyUnit.unitId);
        const targetUnit = army.units.find((candidate) => candidate.id === armyUnit.leadingUnitId);

        if (!leaderDefinition || !targetUnit) {
            continue;
        }

        const leaderName = leaderDefinition.name;
        const targetUnitName = getUnitName(targetUnit, factionData);

        const selfResult = checkLeaderNotSelf(armyUnit, targetUnit, leaderName);

        if (selfResult) {
            results.push(selfResult);
            continue;
        }

        const characterResult = checkLeaderIsCharacter(armyUnit, leaderDefinition);

        if (characterResult) {
            results.push(characterResult);
        }

        const abilityResult = checkLeaderHasAbility(armyUnit, leaderDefinition);

        if (abilityResult) {
            results.push(abilityResult);
            continue;
        }

        const attachResult = checkLeaderCanAttachToTarget(armyUnit, leaderDefinition, targetUnitName, leaderName);

        if (attachResult) {
            results.push(attachResult);
        }

        const multipleResult = checkTargetNotAlreadyLed(
            targetUnit,
            targetUnitName,
            armyUnit.id,
            leadingAssignments.get(targetUnit.id),
        );

        if (multipleResult) {
            results.push(multipleResult);
        } else {
            leadingAssignments.set(targetUnit.id, armyUnit.id);
        }
    }

    return results;
}
