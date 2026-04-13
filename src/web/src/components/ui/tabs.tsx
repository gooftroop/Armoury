'use client';

/**
 * Tabs Component
 *
 * A set of layered sections of content—known as tab panels—that are displayed one at a time.
 * Built on Radix UI Tabs primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export Tabs, TabsList, TabsTrigger, TabsContent components.
 * 2. Must use Radix UI Tabs primitive from radix-ui package.
 * 3. Must use design tokens for styling.
 * 4. Must display displayName in React DevTools.
 */

import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ReactElement, ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils.js';

/**
 * Props for the TabsList component.
 */
export type TabsListProps = ComponentPropsWithRef<typeof TabsPrimitive.List>;

/**
 * Props for the TabsTrigger component.
 */
export type TabsTriggerProps = ComponentPropsWithRef<typeof TabsPrimitive.Trigger>;

/**
 * Props for the TabsContent component.
 */
export type TabsContentProps = ComponentPropsWithRef<typeof TabsPrimitive.Content>;

/**
 * Tabs component - the root tabs component.
 */
const Tabs = TabsPrimitive.Root;

/**
 * TabsList component - contains the tab triggers.
 *
 * @param props - Component props including className and standard Tabs.List attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered TabsList component.
 */
function TabsList({ className, ref, ...props }: TabsListProps): ReactElement {
    return (
        <TabsPrimitive.List
            className={cn(
                'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

TabsList.displayName = 'TabsList';

/**
 * TabsTrigger component - a button that activates a tab panel.
 *
 * @param props - Component props including className and standard Tabs.Trigger attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered TabsTrigger component.
 */
function TabsTrigger({ className, ref, ...props }: TabsTriggerProps): ReactElement {
    return (
        <TabsPrimitive.Trigger
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

TabsTrigger.displayName = 'TabsTrigger';

/**
 * TabsContent component - contains the content associated with a tab trigger.
 *
 * @param props - Component props including className and standard Tabs.Content attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered TabsContent component.
 */
function TabsContent({ className, ref, ...props }: TabsContentProps): ReactElement {
    return (
        <TabsPrimitive.Content
            className={cn(
                'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
