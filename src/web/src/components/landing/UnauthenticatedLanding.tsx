'use client';

/**
 * Unauthenticated landing experience — shown when no Auth0 session exists.
 *
 * Displays sign-in / sign-up links and the SystemGrid (which will redirect
 * to Auth0 login when a tile is clicked).
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must render sign-in and sign-up auth links.
 * 3. Must render SystemGrid with isAuthenticated=false.
 * 4. Must use next-intl useTranslations for all user-facing strings.
 * 5. Must reuse the auth link design from the original page.tsx.
 *
 * @module unauthenticated-landing
 */

import { useTranslations } from 'next-intl';

import type { GameSystemManifest } from '@armoury/data-dao';

import { SystemGrid } from '@/components/SystemGridContainer.js';
import { Button } from '@/components/ui/index.js';

/** Props for the UnauthenticatedLanding component. */
export interface UnauthenticatedLandingProps {
    /** Discovered game system manifests. */
    manifests: GameSystemManifest[];
}

/**
 * Renders the unauthenticated landing page content: auth links + system grid.
 *
 * @param props - Component props.
 * @returns The rendered unauthenticated landing experience.
 */
export function UnauthenticatedLanding({ manifests }: UnauthenticatedLandingProps): React.ReactElement {
    const t = useTranslations('landing');

    return (
        <>
            <div className="mb-8 flex flex-col items-center gap-3">
                <p className="text-sm text-foreground">
                    {t('auth.signInPrefix')}{' '}
                    <Button variant="link" asChild>
                        <a href="/auth/login">{t('auth.signInLink')}</a>
                    </Button>
                </p>
                <p className="text-sm text-foreground">
                    {t('auth.createAccountPrefix')}{' '}
                    <Button variant="link" asChild>
                        <a href="/auth/login?screen_hint=signup">{t('auth.createAccountLink')}</a>
                    </Button>
                </p>
            </div>

            <SystemGrid manifests={manifests} isAuthenticated={false} />
        </>
    );
}

UnauthenticatedLanding.displayName = 'UnauthenticatedLanding';
