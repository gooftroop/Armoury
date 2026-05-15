/**
 * @requirements
 * 1. Must render a loading skeleton for the route segment.
 */

/** Renders a loading skeleton. */
export default function Loading() {
    return (
        <div className="flex h-full w-full items-center justify-center p-6">
            <div className="text-muted-foreground animate-pulse" />
        </div>
    );
}
