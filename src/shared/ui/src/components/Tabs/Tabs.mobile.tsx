import * as React from 'react';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { XStack, YStack, Text, useTheme } from 'tamagui';
import type { ViewProps, PressableProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Tabs, TabsList, TabsTrigger, TabsContent.
 * 2. Must export type aliases: TabsListProps, TabsTriggerProps, TabsContentProps.
 * 3. Must use React context to share active tab state between sub-components.
 * 4. Must use Tamagui primitives and theme tokens resolved from useTheme().
 * 5. Must set displayName for every sub-component.
 */

/**
 * Resolves a theme token into a concrete color string.
 */
function resolveThemeColor(theme: ReturnType<typeof useTheme>, token: string): string | undefined {
    const themeRecord = theme as unknown as Record<string, { get?: () => string; val?: string } | undefined>;
    const value = themeRecord[token];

    if (value?.get) {
        return value.get();
    }

    return value?.val;
}

/** Context for sharing tab state between compound components. */
interface TabsContextValue {
    /** Currently active tab value. */
    value: string;
    /** Callback to change the active tab. */
    onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
    value: '',
    onValueChange: () => {},
});

/** Props for the Tabs root component. */
interface TabsProps extends ViewProps {
    /** Active tab value (controlled). */
    value?: string;
    /** Default active tab value (uncontrolled). */
    defaultValue?: string;
    /** Callback when the active tab changes. */
    onValueChange?: (value: string) => void;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Tab sub-components. */
    children?: React.ReactNode;
}

/** Props for the TabsList component. */
export interface TabsListProps extends ViewProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Tab trigger children. */
    children?: React.ReactNode;
}

/** Props for the TabsTrigger component. */
export interface TabsTriggerProps extends PressableProps {
    /** Tab value identifier. */
    value: string;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Trigger content. */
    children?: React.ReactNode;
}

/** Props for the TabsContent component. */
export interface TabsContentProps extends ViewProps {
    /** Tab value this content belongs to. */
    value: string;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Content children. */
    children?: React.ReactNode;
}

/**
 * Tabs component - the root tabs component managing active state.
 *
 * @param props - Component props including value, defaultValue, and onValueChange.
 * @returns The rendered Tabs component.
 */
const Tabs = React.forwardRef<React.ElementRef<typeof YStack>, TabsProps>(
    ({ value: controlledValue, defaultValue = '', onValueChange, className: _className, children }, ref) => {
        const [internalValue, setInternalValue] = useState(defaultValue);
        const currentValue = controlledValue ?? internalValue;

        const handleValueChange = (newValue: string): void => {
            if (controlledValue === undefined) {
                setInternalValue(newValue);
            }

            onValueChange?.(newValue);
        };

        return (
            <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
                <YStack ref={ref}>{children}</YStack>
            </TabsContext.Provider>
        );
    },
);
Tabs.displayName = 'Tabs';

/**
 * TabsList component - horizontal container for tab triggers.
 *
 * @param props - Component props including standard view attributes.
 * @returns The rendered TabsList component.
 */
const TabsList = React.forwardRef<React.ElementRef<typeof XStack>, TabsListProps>(
    ({ className: _className, children }, ref) => {
        const theme = useTheme();

        return (
            <XStack
                ref={ref}
                height={36}
                alignItems="center"
                justifyContent="center"
                borderRadius="$3"
                backgroundColor={resolveThemeColor(theme, 'muted')}
                padding="$0.5"
            >
                {children}
            </XStack>
        );
    },
);
TabsList.displayName = 'TabsList';

/**
 * TabsTrigger component - a button that activates a tab panel.
 *
 * @param props - Component props including value and standard pressable attributes.
 * @returns The rendered TabsTrigger component.
 */
const TabsTrigger = React.forwardRef<React.ElementRef<typeof Pressable>, TabsTriggerProps>(
    ({ value, className: _className, children, ...props }, ref) => {
        const theme = useTheme();
        const { value: activeValue, onValueChange } = React.useContext(TabsContext);
        const isActive = value === activeValue;

        return (
            <Pressable
                ref={ref as React.Ref<React.ElementRef<typeof Pressable>>}
                onPress={() => {
                    onValueChange(value);
                }}
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    backgroundColor: isActive ? resolveThemeColor(theme, 'background') : 'transparent',
                    shadowColor: isActive ? 'rgba(0,0,0,0.1)' : 'transparent',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isActive ? 1 : 0,
                    shadowRadius: 2,
                    elevation: isActive ? 1 : 0,
                }}
                {...props}
            >
                <Text
                    fontSize="$2"
                    fontWeight="500"
                    color={isActive ? resolveThemeColor(theme, 'color') : resolveThemeColor(theme, 'mutedForeground')}
                >
                    {children}
                </Text>
            </Pressable>
        );
    },
);
TabsTrigger.displayName = 'TabsTrigger';

/**
 * TabsContent component - contains the content associated with a tab trigger.
 *
 * Only renders when its value matches the active tab value.
 *
 * @param props - Component props including value and standard view attributes.
 * @returns The rendered TabsContent component or null if inactive.
 */
const TabsContent = React.forwardRef<React.ElementRef<typeof YStack>, TabsContentProps>(
    ({ value, className: _className, children }, ref) => {
        const { value: activeValue } = React.useContext(TabsContext);

        if (value !== activeValue) {
            return null;
        }

        return (
            <YStack ref={ref} marginTop="$2">
                {children}
            </YStack>
        );
    },
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
