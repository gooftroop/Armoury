/**
 * @requirements
 * 1. Must define an Expo Router Tabs layout with 6 specific screens.
 * 2. Must configure the tab bar using Tamagui theme tokens for a dark aesthetic.
 * 3. Must specify titles for each tab: The Forge, War Ledger, Campaigns, Allies, References, Account.
 */

import { Tabs } from 'expo-router';
import { useTheme } from 'tamagui';

/**
 * Tab navigator layout component.
 * Configures the bottom tab bar and nested screen properties.
 *
 * @returns The tab layout configuration.
 */
export default function TabLayout() {
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.primary?.val || '#4cb0e5',
                tabBarInactiveTintColor: theme.mutedForeground?.val || '#a1a5ab',
                tabBarStyle: {
                    backgroundColor: theme.background?.val || '#121416',
                    borderTopColor: theme.border?.val || '#292b2f',
                },
                headerStyle: {
                    backgroundColor: theme.background?.val || '#121416',
                },
                headerTintColor: theme.foreground?.val || '#f6f9fc',
            }}
        >
            <Tabs.Screen
                name="armies/index"
                options={{
                    title: 'The Forge',
                    tabBarLabel: 'The Forge',
                }}
            />
            <Tabs.Screen
                name="matches/index"
                options={{
                    title: 'War Ledger',
                    tabBarLabel: 'War Ledger',
                }}
            />
            <Tabs.Screen
                name="campaigns/index"
                options={{
                    title: 'Campaigns',
                    tabBarLabel: 'Campaigns',
                }}
            />
            <Tabs.Screen
                name="social/index"
                options={{
                    title: 'Allies',
                    tabBarLabel: 'Allies',
                }}
            />
            <Tabs.Screen
                name="references/index"
                options={{
                    title: 'References',
                    tabBarLabel: 'References',
                }}
            />
            <Tabs.Screen
                name="account/index"
                options={{
                    title: 'Account',
                    tabBarLabel: 'Account',
                }}
            />
        </Tabs>
    );
}
