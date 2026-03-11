/**
 * @requirements
 * 1. Must export a layout that wraps the game system application shell.
 * 2. Must render the SideNav (desktop) and BottomNav (mobile).
 * 3. Must pass the gameSystem param down to the navigation components.
 */

import { SideNav } from '@/components/navigation/SideNav.js';
import { BottomNav } from '@/components/navigation/BottomNav.js';

export interface AppLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
        gameSystem: string;
    }>;
}

/**
 * The main application shell layout.
 * Renders the responsive navigation around the main content area.
 *
 * @param props - Layout props
 * @returns The wrapped React tree
 */
export default async function AppLayout({ children, params }: AppLayoutProps) {
    const { locale, gameSystem } = await params;

    return (
        <div className="flex min-h-[100dvh] w-full flex-col bg-base md:flex-row">
            {/* Desktop Side Navigation */}
            <div className="hidden shrink-0 md:block">
                <SideNav locale={locale} gameSystem={gameSystem} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex-col pb-14 md:pb-0 relative min-h-0 min-w-0">{children}</div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden">
                <BottomNav locale={locale} gameSystem={gameSystem} />
            </div>
        </div>
    );
}
