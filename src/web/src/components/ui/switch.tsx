'use client';

/**
 * Switch Component
 *
 * A control that allows the user to toggle between checked and not checked.
 * Built on Radix UI Switch primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export Switch component with forwardRef.
 * 2. Must use Radix UI Switch primitive from radix-ui package.
 * 3. Must display thumb indicator that moves on state change.
 * 4. Must use design tokens for styling (bg-primary, bg-input, etc.).
 * 5. Must display displayName in React DevTools.
 */

import { Switch as SwitchPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../../lib/utils.ts';

/**
 * Props for the Switch component.
 */
export type SwitchProps = React.ComponentPropsWithRef<typeof SwitchPrimitive.Root>;

/**
 * Switch component - a toggle control for on/off state.
 *
 * @param props - Component props including standard Switch attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered Switch component.
 */
function Switch({ className, ref, ...props }: SwitchProps): React.ReactElement {
    return (
        <SwitchPrimitive.Root
            className={cn(
                'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
                className,
            )}
            ref={ref}
            {...props}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
                )}
            />
        </SwitchPrimitive.Root>
    );
}

Switch.displayName = 'Switch';

export { Switch };
