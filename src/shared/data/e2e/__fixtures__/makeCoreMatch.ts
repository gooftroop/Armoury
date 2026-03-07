import type { Match } from '@models/MatchModel.js';
import { makeMatch } from '../../../../systems/e2e/__fixtures__/makeMatch.ts';

export function makeCoreMatch(overrides: Partial<Match> = {}): Match {
    return makeMatch(overrides);
}
