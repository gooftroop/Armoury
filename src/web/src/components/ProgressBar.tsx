import * as React from 'react';

/**
 * Props for the ProgressBar presentational component.
 */
export interface ProgressBarProps {
    /** Current phase label (e.g., "Loading...", "Syncing"). */
    phase: string;
    /** Number of DAOs completed. */
    completed: number;
    /** Total number of DAOs to load. */
    total: number;
    /** Number of DAOs that failed. */
    failures: number;
}

function ProgressBar({ phase, completed, total, failures }: ProgressBarProps): React.ReactElement {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-white/90">{phase}</span>

            <div
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Sync progress"
                className="h-1.5 w-32 rounded-full bg-white/20"
            >
                <div className="h-full rounded-full bg-white/80" style={{ width: `${String(percentage)}%` }} />
            </div>

            <span className="text-xs text-white/60">
                {String(completed)}/{String(total)}
            </span>

            {failures > 0 && <span className="text-xs text-red-400">{String(failures)} failed</span>}
        </div>
    );
}

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
