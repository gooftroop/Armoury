'use client';

/**
 * @requirements
 * 1. Must export the bottom navigation component for mobile screens (<768px).
 * 2. Must display navigation links with icons and text labels.
 * 3. Must be fixed to the bottom of the screen.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Swords, BookOpen, Flag, Users, Library } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface BottomNavProps {
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
 * Bottom navigation bar for mobile screens.
 *
 * @param props - Component props
 * @returns The BottomNav component
 */
export function BottomNav({ locale, gameSystem }: BottomNavProps) {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const basePath = `/${locale}/${gameSystem}`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 border-t border-border-subtle bg-surface pb-safe md:hidden">
            <div className="flex w-full items-center justify-around px-2">
                {NAV_ITEMS.map((item) => {
                    const href = `${basePath}/${item.path}`;
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={href}
                            className={cn(
                                'flex h-full min-w-16 flex-col items-center justify-center gap-1 px-1 transition-colors',
                                isActive ? 'text-accent-primary' : 'text-secondary hover:text-primary',
                            )}
                        >
                            <Icon className={cn('h-5 w-5', isActive ? 'stroke-[2.5px]' : 'stroke-2')} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">
                                {t(item.id as 'armies' | 'matches' | 'campaigns' | 'social' | 'references')}
                            </span>
                            {isActive && <div className="absolute bottom-1 h-1 w-1 rounded-full bg-accent-primary" />}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
