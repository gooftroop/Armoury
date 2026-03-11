'use client';

/**
 * Select Component
 *
 * Displays a list of options for the user to pick from—triggered by a button.
 * Built on Radix UI Select primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
 *    SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton components.
 * 2. Must use Radix UI Select primitive from radix-ui package.
 * 3. Must use Select.Portal for content positioning.
 * 4. Must use design tokens for styling.
 * 5. Must display displayName in React DevTools.
 */

import { Select } from 'radix-ui';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils.ts';

/**
 * Props for the SelectTrigger component.
 */
export type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof Select.Trigger>;

/**
 * Props for the SelectContent component.
 */
export type SelectContentProps = React.ComponentPropsWithoutRef<typeof Select.Content>;

/**
 * Props for the SelectLabel component.
 */
export type SelectLabelProps = React.ComponentPropsWithoutRef<typeof Select.Label>;

/**
 * Props for the SelectItem component.
 */
export type SelectItemProps = React.ComponentPropsWithoutRef<typeof Select.Item>;

/**
 * Props for the SelectSeparator component.
 */
export type SelectSeparatorProps = React.ComponentPropsWithoutRef<typeof Select.Separator>;

/**
 * Props for the SelectScrollUpButton component.
 */
export type SelectScrollUpButtonProps = React.ComponentPropsWithoutRef<typeof Select.ScrollUpButton>;

/**
 * Props for the SelectScrollDownButton component.
 */
export type SelectScrollDownButtonProps = React.ComponentPropsWithoutRef<typeof Select.ScrollDownButton>;

/**
 * Select component - the root select component.
 */
const SelectRoot = Select.Root;

/**
 * SelectGroup component - groups related items.
 */
const SelectGroup = Select.Group;

/**
 * SelectValue component - displays the selected value.
 */
const SelectValue = Select.Value;

/**
 * SelectTrigger component - the button that opens the select.
 *
 * @param props - Component props including className and standard Select.Trigger attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered SelectTrigger component.
 */
const SelectTrigger = React.forwardRef<React.ElementRef<typeof Select.Trigger>, SelectTriggerProps>(
    ({ className, children, ...props }, ref) => (
        <Select.Trigger
            className={cn(
                'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
                className,
            )}
            ref={ref}
            {...props}
        >
            {children}
            <Select.Icon asChild>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </Select.Icon>
        </Select.Trigger>
    ),
);
SelectTrigger.displayName = 'SelectTrigger';

/**
 * SelectScrollUpButton component - scroll indicator for long lists.
 *
 * @param props - Component props including standard Select.ScrollUpButton attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered SelectScrollUpButton component.
 */
const SelectScrollUpButton = React.forwardRef<
    React.ElementRef<typeof Select.ScrollUpButton>,
    SelectScrollUpButtonProps
>(({ className, ...props }, ref) => (
    <Select.ScrollUpButton
        className={cn('flex cursor-default items-center justify-center py-1', className)}
        ref={ref}
        {...props}
    >
        <ChevronUp className="h-4 w-4" />
    </Select.ScrollUpButton>
));
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

/**
 * SelectScrollDownButton component - scroll indicator for long lists.
 *
 * @param props - Component props including standard Select.ScrollDownButton attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered SelectScrollDownButton component.
 */
const SelectScrollDownButton = React.forwardRef<
    React.ElementRef<typeof Select.ScrollDownButton>,
    SelectScrollDownButtonProps
>(({ className, ...props }, ref) => (
    <Select.ScrollDownButton
        className={cn('flex cursor-default items-center justify-center py-1', className)}
        ref={ref}
        {...props}
    >
        <ChevronDown className="h-4 w-4" />
    </Select.ScrollDownButton>
));
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

/**
 * SelectContent component - the dropdown content container.
 *
 * @param props - Component props including className, position, and standard Select.Content attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered SelectContent component.
 */
const SelectContent = React.forwardRef<React.ElementRef<typeof Select.Content>, SelectContentProps>(
    ({ className, children, position = 'popper', ...props }, ref) => (
        <Select.Portal>
            <Select.Content
                className={cn(
                    'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    position === 'popper' &&
                        'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                    className,
                )}
                position={position}
                ref={ref}
                {...props}
            >
                <SelectScrollUpButton />
                <Select.Viewport
                    className={cn(
                        'p-1',
                        position === 'popper' &&
                            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
                    )}
                >
                    {children}
                </Select.Viewport>
                <SelectScrollDownButton />
            </Select.Content>
        </Select.Portal>
    ),
);
SelectContent.displayName = 'SelectContent';

/**
 * SelectLabel component - a label for a group of items.
 *
 * @param props - Component props including className and standard Select.Label attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered SelectLabel component.
 */
const SelectLabel = React.forwardRef<React.ElementRef<typeof Select.Label>, SelectLabelProps>(
    ({ className, ...props }, ref) => (
        <Select.Label className={cn('px-2 py-1.5 text-sm font-semibold', className)} ref={ref} {...props} />
    ),
);
SelectLabel.displayName = 'SelectLabel';

/**
 * SelectItem component - an individual option in the select.
 *
 * @param props - Component props including className and standard Select.Item attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered SelectItem component.
 */
const SelectItem = React.forwardRef<React.ElementRef<typeof Select.Item>, SelectItemProps>(
    ({ className, children, ...props }, ref) => (
        <Select.Item
            className={cn(
                'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className,
            )}
            ref={ref}
            {...props}
        >
            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                <Select.ItemIndicator>
                    <Check className="h-4 w-4" />
                </Select.ItemIndicator>
            </span>
            <Select.ItemText>{children}</Select.ItemText>
        </Select.Item>
    ),
);
SelectItem.displayName = 'SelectItem';

/**
 * SelectSeparator component - a visual separator between items.
 *
 * @param props - Component props including className and standard Select.Separator attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered SelectSeparator component.
 */
const SelectSeparator = React.forwardRef<React.ElementRef<typeof Select.Separator>, SelectSeparatorProps>(
    ({ className, ...props }, ref) => (
        <Select.Separator className={cn('-mx-1 my-1 h-px bg-muted', className)} ref={ref} {...props} />
    ),
);
SelectSeparator.displayName = 'SelectSeparator';

export {
    SelectRoot as Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
};
