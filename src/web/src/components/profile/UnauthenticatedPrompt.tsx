'use client';

/**
 * Unauthenticated prompt tile — a visually appealing card prompting the
 * visitor to sign in or create an account.
 *
 * Pure render component — all user-facing strings arrive via props so
 * the parent can supply next-intl translations.
 *
 * @module UnauthenticatedPrompt
 */

import type { ReactElement } from 'react';
import { Button, Card, CardContent } from '@/components/ui/index.js';

/**
 * @requirements
 * 1. Must be a pure render component — no hooks, no side effects.
 * 2. Must render sign-in link pointing to /auth/login.
 * 3. Must render create-account link pointing to /auth/login?screen_hint=signup.
 * 4. Must use Card/Button components with proper visual hierarchy.
 * 5. Must NOT use data-testid attributes.
 * 6. Must look good on the dark theme.
 */

/** Props for UnauthenticatedPrompt. */
export interface UnauthenticatedPromptProps {
    /** Localised prefix text before the sign-in CTA (e.g. "Already have an account?"). */
    signInPrefix: string;
    /** Localised label for the sign-in button. */
    signInLabel: string;
    /** Localised prefix text before the create-account CTA. */
    createAccountPrefix: string;
    /** Localised label for the create-account link. */
    createAccountLabel: string;
}

/**
 * Modern card prompting unauthenticated visitors to sign in or create
 * an account. Uses a primary button for sign-in (main CTA) and a ghost
 * button for account creation (secondary action).
 *
 * @param props - Localised string props.
 * @returns The unauthenticated prompt card element.
 */
export function UnauthenticatedPrompt({
    signInPrefix,
    signInLabel,
    createAccountPrefix,
    createAccountLabel,
}: UnauthenticatedPromptProps): ReactElement {
    return (
        <Card className="w-full max-w-xs border-border/40 bg-surface/60">
            <CardContent className="flex flex-col items-center gap-4 px-6 py-5">
                <div className="flex w-full flex-col items-center gap-2">
                    <p className="text-sm text-tertiary">{signInPrefix}</p>
                    <Button variant="primary" className="w-full" asChild>
                        <a href="/auth/login">{signInLabel}</a>
                    </Button>
                </div>
                <div className="flex w-full flex-col items-center gap-2">
                    <p className="text-sm text-tertiary">{createAccountPrefix}</p>
                    <Button variant="ghost" className="w-full" asChild>
                        <a href="/auth/login?screen_hint=signup">{createAccountLabel}</a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

UnauthenticatedPrompt.displayName = 'UnauthenticatedPrompt';
