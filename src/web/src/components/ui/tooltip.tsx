'use client';

/**
 * Tooltip Component
 *
 * A popup that displays information related to an element when the element receives keyboard focus
 * or the mouse hovers over it. Built on Radix UI Tooltip primitive.
 *
 * @requirements
 * 1. Must export TooltipProvider, Tooltip, TooltipTrigger, TooltipContent components.
 * 2. Must use Radix UI Tooltip primitive from radix-ui package.
 * 3. Must use design tokens for styling.
 * 4. Must support side variants: top, right, bottom, left.
 * 5. Must display displayName in React DevTools.
 */

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@web/src/lib/utils.js';

/**
 * Props for the TooltipTrigger component.
 */
export type TooltipTriggerProps = React.ComponentPropsWithRef<typeof TooltipPrimitive.Trigger>;

/**
 * Props for the TooltipContent component.
 */
export interface TooltipContentProps extends React.ComponentPropsWithRef<typeof TooltipPrimitive.Content> {
    /**
     * The preferred side of the trigger to render against.
     */
    side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * TooltipProvider component - wraps your app to provide tooltip context.
 */
const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Tooltip component - the root tooltip component.
 */
const Tooltip = TooltipPrimitive.Root;

/**
 * TooltipTrigger component - the element that triggers the tooltip.
 *
 * @param props - Component props including standard Tooltip.Trigger attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered TooltipTrigger component.
 */
function TooltipTrigger(
    { ref, ...props }: TooltipTriggerProps,
): React.ReactElement {
    return <TooltipPrimitive.Trigger ref={ref} {...props} />;
}

TooltipTrigger.displayName = 'TooltipTrigger';

/**
 * TooltipContent component - the content displayed in the tooltip.
 *
 * @param props - Component props including side offset and standard Tooltip.Content attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered TooltipContent component.
 */
function TooltipContent(
    { className, sideOffset = 4, ref, ...props }: TooltipContentProps,
): React.ReactElement {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                className={cn(
                    'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className,
                )}
                ref={ref}
                sideOffset={sideOffset}
                {...props}
            />
        </TooltipPrimitive.Portal>
    );
}

TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
