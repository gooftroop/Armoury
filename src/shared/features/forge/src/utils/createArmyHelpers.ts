/**
 * Army construction helpers for the forge feature.
 *
 * @requirements
 * 1. Must export getPointsLimitForBattleSize and buildNewArmy.
 * 2. Must derive army points limits from battle size presets only.
 * 3. Must construct minimal valid Army objects with canonical defaults.
 * 4. Must not use default exports.
 */

import { type Army, type BattleSize } from '@armoury/wh40k10e';

/** Draft input required to build a new army. */
export interface CreateArmyDraft {
    /** Army name entered by the user. */
    name: string;
    /** Selected faction identifier. */
    factionId: string;
    /** Selected detachment identifier, or null when none applies. */
    detachmentId: string | null;
    /** Selected battle size preset. */
    battleSize: BattleSize;
    /** Current authenticated owner identifier. */
    ownerId: string;
}

const POINTS_LIMIT_BY_BATTLE_SIZE: Record<BattleSize, number> = {
    Incursion: 1000,
    StrikeForce: 2000,
    Onslaught: 3000,
};

/** Returns the canonical points limit for a battle size preset. */
export function getPointsLimitForBattleSize(battleSize: BattleSize): number {
    return POINTS_LIMIT_BY_BATTLE_SIZE[battleSize];
}

/** Builds a minimal valid Army object from create-army draft input. */
export function buildNewArmy(draft: CreateArmyDraft): Army {
    const createdAt = new Date().toISOString();

    return {
        id: globalThis.crypto.randomUUID(),
        ownerId: draft.ownerId,
        name: draft.name.trim(),
        factionId: draft.factionId,
        detachmentId: draft.detachmentId,
        warlordUnitId: null,
        battleSize: draft.battleSize,
        pointsLimit: getPointsLimitForBattleSize(draft.battleSize),
        units: [],
        totalPoints: 0,
        notes: '',
        versions: [],
        currentVersion: 0,
        createdAt,
        updatedAt: createdAt,
    };
}
