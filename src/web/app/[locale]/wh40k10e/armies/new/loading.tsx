/**
 * @requirements
 * 1. Must render a loading skeleton for the route segment.
 */

/** Renders a loading skeleton for the Create Army form. */
export default function Loading() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-6">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="flex flex-col gap-6">
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
            </div>
        </div>
    );
}
