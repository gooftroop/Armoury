'use client';

/**
 * Separator Component
 *
 * A visual divider between sections of content.
 * Built on Radix UI Separator primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export Separator component with forwardRef.
 * 2. Must use Radix UI Separator primitive from radix-ui package.
 * 3. Must support horizontal and vertical orientations.
 * 4. Must use design tokens for styling (bg-border).
 * 5. Must display displayName in React DevTools.
 */

import { Separator as SeparatorPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@web/src/lib/utils.js';

/**
 * Props for the Separator component.
 */
export type SeparatorProps = React.ComponentPropsWithRef<typeof SeparatorPrimitive.Root>;

/**
 * Separator component - a visual divider between sections.
 *
 * @param props - Component props including orientation and standard Separator attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered Separator component.
 */
function Separator({
    className,
    orientation = 'horizontal',
    decorative = true,
    ref,
    ...props
}: SeparatorProps): React.ReactElement {
    return (
        <SeparatorPrimitive.Root
            className={cn(
                'shrink-0 bg-border',
                orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
                className,
            )}
            decorative={decorative}
            orientation={orientation}
            ref={ref}
            {...props}
        />
    );
}

Separator.displayName = 'Separator';

export { Separator };
