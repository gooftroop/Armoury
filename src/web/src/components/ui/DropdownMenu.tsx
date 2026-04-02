'use client';

/**
 * DropdownMenu Component
 *
 * Displays a menu to the user—triggered by a button—with a list of actions or options.
 * Built on Radix UI DropdownMenu primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
 *    DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator,
 *    DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub,
 *    DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup components.
 * 2. Must use Radix UI DropdownMenu primitive from radix-ui package.
 * 3. Must use DropdownMenu.Portal for content positioning.
 * 4. Must use design tokens for styling.
 * 5. Must display displayName in React DevTools.
 */

import { DropdownMenu } from 'radix-ui';
import { Check, ChevronRight, Circle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils.js';

/**
 * Props for the DropdownMenuTrigger component.
 */
export type DropdownMenuTriggerProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.Trigger>;

/**
 * Props for the DropdownMenuContent component.
 */
export type DropdownMenuContentProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.Content>;

/**
 * Props for the DropdownMenuItem component.
 */
export type DropdownMenuItemProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.Item> & {
    inset?: boolean;
};

/**
 * Props for the DropdownMenuCheckboxItem component.
 */
export type DropdownMenuCheckboxItemProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.CheckboxItem>;

/**
 * Props for the DropdownMenuRadioItem component.
 */
export type DropdownMenuRadioItemProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.RadioItem>;

/**
 * Props for the DropdownMenuLabel component.
 */
export type DropdownMenuLabelProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.Label> & {
    inset?: boolean;
};

/**
 * Props for the DropdownMenuSeparator component.
 */
export type DropdownMenuSeparatorProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.Separator>;

/**
 * Props for the DropdownMenuShortcut component.
 */
export type DropdownMenuShortcutProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * Props for the DropdownMenuSubTrigger component.
 */
export type DropdownMenuSubTriggerProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.SubTrigger> & {
    inset?: boolean;
};

/**
 * Props for the DropdownMenuSubContent component.
 */
export type DropdownMenuSubContentProps = React.ComponentPropsWithoutRef<typeof DropdownMenu.SubContent>;

/**
 * DropdownMenu component - the root dropdown menu component.
 */
const DropdownMenuRoot = DropdownMenu.Root;

/**
 * DropdownMenuTrigger component - the button that opens the menu.
 */
const DropdownMenuTrigger = DropdownMenu.Trigger;

/**
 * DropdownMenuGroup component - groups related items.
 */
const DropdownMenuGroup = DropdownMenu.Group;

/**
 * DropdownMenuPortal component - portal for rendering menu content.
 */
const DropdownMenuPortal = DropdownMenu.Portal;

/**
 * DropdownMenuSub component - submenu container.
 */
const DropdownMenuSub = DropdownMenu.Sub;

/**
 * DropdownMenuRadioGroup component - radio button group.
 */
const DropdownMenuRadioGroup = DropdownMenu.RadioGroup;

/**
 * DropdownMenuSubTrigger component - trigger for a submenu.
 *
 * @param props - Component props including className and standard DropdownMenu.SubTrigger attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered DropdownMenuSubTrigger component.
 */
function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ref,
    ...props
}: DropdownMenuSubTriggerProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
    return (
        <DropdownMenu.SubTrigger
            className={cn(
                'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                inset && 'pl-8',
                className,
            )}
            ref={ref}
            {...props}
        >
            {children}
            <ChevronRight className="ml-auto" />
        </DropdownMenu.SubTrigger>
    );
}

DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

/**
 * DropdownMenuSubContent component - content for a submenu.
 *
 * @param props - Component props including className and standard DropdownMenu.SubContent attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered DropdownMenuSubContent component.
 */
function DropdownMenuSubContent({
    className,
    ref,
    ...props
}: DropdownMenuSubContentProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
    return (
        <DropdownMenu.Portal>
            <DropdownMenu.SubContent
                className={cn(
                    'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className,
                )}
                ref={ref}
                {...props}
            />
        </DropdownMenu.Portal>
    );
}

DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

/**
 * DropdownMenuContent component - the main menu content container.
 *
 * @param props - Component props including className, sideOffset, and standard DropdownMenu.Content attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered DropdownMenuContent component.
 */
function DropdownMenuContent({
    className,
    sideOffset = 4,
    ref,
    ...props
}: DropdownMenuContentProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
    return (
        <DropdownMenu.Portal>
            <DropdownMenu.Content
                className={cn(
                    'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className,
                )}
                ref={ref}
                sideOffset={sideOffset}
                {...props}
            />
        </DropdownMenu.Portal>
    );
}

DropdownMenuContent.displayName = 'DropdownMenuContent';

/**
 * DropdownMenuItem component - an individual item in the menu.
 *
 * @param props - Component props including className, inset, and standard DropdownMenu.Item attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered DropdownMenuItem component.
 */
function DropdownMenuItem({
    className,
    inset,
    ref,
    ...props
}: DropdownMenuItemProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
    return (
        <DropdownMenu.Item
            className={cn(
                'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
                inset && 'pl-8',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

DropdownMenuItem.displayName = 'DropdownMenuItem';

/**
 * DropdownMenuCheckboxItem component - a checkbox item in the menu.
 *
 * @param props - Component props including className and standard DropdownMenu.CheckboxItem attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered DropdownMenuCheckboxItem component.
 */
function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ref,
    ...props
}: DropdownMenuCheckboxItemProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
    return (
        <DropdownMenu.CheckboxItem
            checked={checked}
            className={cn(
                'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className,
            )}
            ref={ref}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <DropdownMenu.ItemIndicator>
                    <Check className="h-4 w-4" />
                </DropdownMenu.ItemIndicator>
            </span>
            {children}
        </DropdownMenu.CheckboxItem>
    );
}

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

/**
 * DropdownMenuRadioItem component - a radio item in the menu.
 *
 * @param props - Component props including className and standard DropdownMenu.RadioItem attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered DropdownMenuRadioItem component.
 */
function DropdownMenuRadioItem({
    className,
    children,
    ref,
    ...props
}: DropdownMenuRadioItemProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
    return (
        <DropdownMenu.RadioItem
            className={cn(
                'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className,
            )}
            ref={ref}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <DropdownMenu.ItemIndicator>
                    <Circle className="h-2 w-2 fill-current" />
                </DropdownMenu.ItemIndicator>
            </span>
            {children}
        </DropdownMenu.RadioItem>
    );
}

DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

/**
 * DropdownMenuLabel component - a label for a group of items.
 *
 * @param props - Component props including className, inset, and standard DropdownMenu.Label attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered DropdownMenuLabel component.
 */
function DropdownMenuLabel({
    className,
    inset,
    ref,
    ...props
}: DropdownMenuLabelProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
    return (
        <DropdownMenu.Label
            className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
            ref={ref}
            {...props}
        />
    );
}

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

/**
 * DropdownMenuSeparator component - a visual separator between items.
 *
 * @param props - Component props including className and standard DropdownMenu.Separator attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered DropdownMenuSeparator component.
 */
function DropdownMenuSeparator({
    className,
    ref,
    ...props
}: DropdownMenuSeparatorProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
    return <DropdownMenu.Separator className={cn('-mx-1 my-1 h-px bg-muted', className)} ref={ref} {...props} />;
}

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

/**
 * DropdownMenuShortcut component - displays a keyboard shortcut.
 *
 * @param props - Component props including className and standard span attributes.
 * @param ref - Forwarded ref to the span element.
 * @returns The rendered DropdownMenuShortcut component.
 */
function DropdownMenuShortcut({
    className,
    ref,
    ...props
}: DropdownMenuShortcutProps & { ref?: React.Ref<HTMLSpanElement> }): React.ReactElement {
    return <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} ref={ref} {...props} />;
}

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
    DropdownMenuRoot as DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
};
