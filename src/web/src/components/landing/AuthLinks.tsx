'use client';

/**
 * Authentication action links — sign-in and account creation prompts.
 *
 * @requirements
 * 1. Must render sign-in link pointing to /auth/login.
 * 2. Must render create-account link pointing to /auth/login?screen_hint=signup.
 * 3. Must use next-intl useTranslations for all user-facing strings.
 * 4. Must NOT use data-testid.
 *
 * @module auth-links
 */

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/index.js';

/**
 * AuthLinks — renders sign-in and create-account action links.
 *
 * Uses the 'landing' translation namespace internally since it is a client
 * component co-located with the landing page.
 *
 * @returns The rendered authentication links.
 */
function AuthLinks(): React.ReactElement {
    const t = useTranslations('landing');

    return (
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
    );
}

AuthLinks.displayName = 'AuthLinks';

export { AuthLinks };
