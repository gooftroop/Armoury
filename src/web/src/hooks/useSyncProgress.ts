import { useEffect, useState } from 'react';

import type { SyncProgressState } from '@armoury/data-dao';
import type { SyncProgressCollector } from '@armoury/data-dao';

const IDLE_STATE: SyncProgressState = {
    phase: 'idle',
    completed: 0,
    total: 0,
    failures: 0,
    message: '',
};

export function useSyncProgress(collector: SyncProgressCollector | null): SyncProgressState {
    const [state, setState] = useState<SyncProgressState>(() => collector?.getState() ?? IDLE_STATE);

    useEffect(() => {
        if (!collector) {
            setState(IDLE_STATE);

            return;
        }

        setState(collector.getState());

        const unsubscribe = collector.subscribe((next) => {
            setState(next);
        });

        return unsubscribe;
    }, [collector]);

    return state;
}
