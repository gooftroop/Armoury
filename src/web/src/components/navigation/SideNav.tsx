'use client';

/**
 * @requirements
 * 1. Must export the side navigation component for desktop and tablet screens (>=768px).
 * 2. Must display navigation links with icons and active state.
 * 3. Must be collapsible.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Swords, BookOpen, Flag, Users, Library, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface SideNavProps {
    locale: string;
    gameSystem: string;
}

const NAV_ITEMS = [
    { id: 'armies', path: 'armies', icon: Swords },
    { id: 'matches', path: 'matches', icon: BookOpen },
    { id: 'campaigns', path: 'campaigns', icon: Flag },
    { id: 'social', path: 'social', icon: Users },
    { id: 'references', path: 'references', icon: Library },
] as const;

/**
 * Sidebar navigation component for desktop and tablet screens.
 *
 * @param props - Component props
 * @returns The SideNav component
 */
export function SideNav({ locale, gameSystem }: SideNavProps) {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const basePath = `/${locale}/${gameSystem}`;

    return (
        <aside
            className={cn(
                'hidden h-[100dvh] flex-col border-r border-border-subtle bg-surface transition-all duration-300 md:flex',
                collapsed ? 'w-16' : 'w-60',
            )}
        >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
                {!collapsed && (
                    <Link
                        href="/"
                        className="font-display text-lg font-bold tracking-wider text-primary truncate"
                        title={t('switchSystem')}
                    >
                        ARMOURY
                    </Link>
                )}
                {collapsed && (
                    <Link
                        href="/"
                        className="mx-auto font-display text-lg font-bold tracking-wider text-primary"
                        title={t('switchSystem')}
                    >
                        A
                    </Link>
                )}
            </div>

            <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
                {NAV_ITEMS.map((item) => {
                    const href = `${basePath}/${item.path}`;
                    // Active if the pathname exactly matches or starts with the path (e.g., /armies or /armies/new)
                    // but we need to ensure we don't falsely match on just string inclusion.
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={href}
                            title={
                                collapsed
                                    ? t(item.id as 'armies' | 'matches' | 'campaigns' | 'social' | 'references')
                                    : undefined
                            }
                            className={cn(
                                'group flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors hover:bg-hover',
                                isActive
                                    ? 'bg-accent-primary-muted font-medium text-accent-primary'
                                    : 'text-secondary hover:text-primary',
                            )}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            {!collapsed && (
                                <span>
                                    {t(item.id as 'armies' | 'matches' | 'campaigns' | 'social' | 'references')}
                                </span>
                            )}
                            {isActive && !collapsed && (
                                <div className="absolute left-0 h-8 w-[3px] rounded-r-full bg-accent-primary" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex flex-col gap-2 p-2">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex h-10 w-full items-center justify-center rounded-md text-secondary hover:bg-hover hover:text-primary"
                    title={collapsed ? t('expand') : t('collapse')}
                >
                    {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
                <div
                    className={cn(
                        'flex items-center rounded-md p-2 hover:bg-hover cursor-pointer',
                        collapsed ? 'justify-center' : 'gap-3 px-3',
                    )}
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border">
                        <span className="text-xs font-medium">U</span>
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium leading-tight text-primary">User</span>
                            <span className="truncate text-xs text-tertiary">Free Plan</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
