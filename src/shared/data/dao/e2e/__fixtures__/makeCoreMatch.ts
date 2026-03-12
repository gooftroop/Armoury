import type { Match } from '@armoury/models/MatchModel';
import { makeMatch } from '../../../../systems/e2e/__fixtures__/makeMatch.js';

export function makeCoreMatch(overrides: Partial<Match> = {}): Match {
    return makeMatch(overrides);
}
