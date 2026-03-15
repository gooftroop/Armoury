/**
 * Landing page — server component that discovers game systems and renders the system selector.
 *
 * Fetches available game system manifests from the filesystem and the current Auth0 session,
 * then delegates rendering of interactive tiles to the client-side SystemGrid component.
 * Auth links are conditionally shown when no session exists. A compact user tile is shown
 * when the user is authenticated.
 *
 * @requirements
 * 1. Must be a Server Component (no 'use client').
 * 2. Must discover game system manifests via discoverSystemManifests().
 * 3. Must check Auth0 session via auth0.getSession().
 * 4. Must render SystemGrid with manifests and isAuthenticated props.
 * 5. Must show auth links only when the user is not authenticated.
 * 6. Must use next-intl for all user-facing text.
 * 7. Must match the layout from mockups/01-landing.html.
 * 8. Must show a compact user tile (avatar, welcome text, settings link) when authenticated.
 * 9. Must use text-highlight for the h1 heading color (bronze/copper).
 * 10. Must use text-secondary for auth link colors (amber/gold).
 * 11. Must use text-foreground for the legal disclaimer (white, prominent).
 * 12. Auth links must appear between the tagline and the SystemGrid.
 *
 * @module landing-page
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Settings } from 'lucide-react';

import { auth0 } from '@/lib/auth0.js';
import { discoverSystemManifests } from '@/lib/discoverSystems.js';
import { SystemGrid } from '@/components/SystemGrid.js';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/index.js';

/** Props for the locale-parameterized landing page. */
export interface LandingPageProps {
    params: Promise<{ locale: string }>;
}

/**
 * Extracts up to two initials from a display name.
 *
 * @param name - The user's display name.
 * @returns One or two uppercase initial characters, or '?' as fallback.
 */
function getInitials(name: string | undefined): string {
    if (!name || name.trim().length === 0) {
        return '?';
    }

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0]![0]!.toUpperCase();
    }

    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** Renders the landing page with dynamic game system tiles and conditional auth links. */
export default async function LandingPage({ params }: LandingPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('landing');
    const [session, manifests] = await Promise.all([auth0?.getSession() ?? null, discoverSystemManifests()]);

    const isAuthenticated = session !== null && session !== undefined;

    return (
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 md:p-8">
            <h1 className="mb-2 font-display text-4xl font-bold uppercase tracking-[0.12em] text-highlight md:text-5xl lg:text-6xl">
                {t('logo')}
            </h1>
            <p className="mb-8 tracking-wide text-tertiary">{t('tagline')}</p>

            {isAuthenticated && session.user && (
                <div
                    data-testid="user-tile"
                    className="mb-8 flex items-center gap-3 rounded-lg border border-border/40 bg-surface/60 px-4 py-2"
                >
                    <Avatar size="sm">
                        <AvatarImage src={String(session.user.picture ?? '')} alt={String(session.user.name ?? '')} />
                        <AvatarFallback>{getInitials(String(session.user.name ?? ''))}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">
                        {t('welcome', { name: String(session.user.name ?? '') })}
                    </span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a
                                    href={`/${locale}/profile`}
                                    className="ml-auto rounded-md p-1 text-secondary transition-colors hover:text-secondary-hover"
                                    aria-label={t('editProfile')}
                                >
                                    <Settings className="h-4 w-4" />
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>{t('editProfile')}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            {!isAuthenticated && (
                <div className="mb-8 flex flex-col items-center gap-3">
                    <p className="text-sm text-foreground">
                        {t('auth.signInPrefix')}{' '}
                        <Button variant="unstyled" asChild>
                            <a href="/auth/login">{t('auth.signInLink')}</a>
                        </Button>
                    </p>
                    <p className="text-sm text-foreground">
                        {t('auth.createAccountPrefix')}{' '}
                        <Button variant="unstyled" asChild>
                            <a href="/auth/login?screen_hint=signup">{t('auth.createAccountLink')}</a>
                        </Button>
                    </p>
                </div>
            )}

            <SystemGrid manifests={manifests} isAuthenticated={isAuthenticated} />

            <div className="mt-8 px-6 text-center">
                <p className="mx-auto max-w-[480px] text-[11px] leading-relaxed text-foreground">{t('legal')}</p>
            </div>
        </main>
    );
}
