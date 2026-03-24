import type { Match } from '@armoury/models';
import { makeMatch } from '../../../../../systems/wh40k10e/e2e/__fixtures__/makeMatch.js';

export function makeCoreMatch(overrides: Partial<Match> = {}): Match {
    return makeMatch(overrides);
}
