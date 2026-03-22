'use client';

/**
 * Label Component
 *
 * A label component for form fields.
 * Built on Radix UI Label primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export Label component with forwardRef.
 * 2. Must use Radix UI Label primitive from radix-ui package.
 * 3. Must use design tokens for styling.
 * 4. Must merge user className with default styles using cn utility.
 * 5. Must display displayName in React DevTools.
 */

import { Label as LabelPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils.js';

/**
 * Label variant styles using class-variance-authority.
 */
const labelVariants = cva('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

/**
 * Props for the Label component.
 */
export interface LabelProps
    extends React.ComponentPropsWithRef<typeof LabelPrimitive.Root>, VariantProps<typeof labelVariants> {}

/**
 * Label component - a label for form fields.
 *
 * @param props - Component props including standard Label attributes.
 * @param ref - Forwarded ref to the label element.
 * @returns The rendered Label component.
 */
function Label({ className, ref, ...props }: LabelProps): React.ReactElement {
    return <LabelPrimitive.Root className={cn(labelVariants(), className)} ref={ref} {...props} />;
}

Label.displayName = 'Label';

export { Label };
