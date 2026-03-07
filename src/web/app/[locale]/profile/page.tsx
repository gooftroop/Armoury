/**
 * Profile page — server component displaying Auth0 user information.
 *
 * Fetches the current Auth0 session and renders user details (avatar, name, email,
 * member-since date) inside a centered Card layout. When no session exists, shows
 * a sign-in prompt with a link to the Auth0 login route.
 *
 * @requirements
 * 1. Must be a Server Component (no 'use client').
 * 2. Must fetch Auth0 session via auth0.getSession().
 * 3. Must show a sign-in message with link to /auth/login when not authenticated.
 * 4. Must display user avatar with initials fallback when authenticated.
 * 5. Must display user name, email, email-verified badge, and member-since date.
 * 6. Must provide a Sign Out link to /auth/logout.
 * 7. Must use next-intl for all user-facing text.
 * 8. Must use UI components from the shared component library (Card, Avatar, Badge, Separator, Button).
 *
 * @module profile-page
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { auth0 } from '@web/src/lib/auth0.js';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Separator,
} from '@web/src/components/ui/index.js';

/** Props for the locale-parameterized profile page. */
export interface ProfilePageProps {
    params: Promise<{
        locale: string;
    }>;
}

/**
 * Extracts up to two initials from a display name.
 *
 * Splits the name on whitespace and takes the first character of the first
 * and last words. Returns '?' when the name is empty or undefined.
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

/**
 * Formats an ISO date string into a locale-aware medium-length date.
 *
 * Falls back to 'N/A' when the input is falsy or cannot be parsed.
 *
 * @param isoDate - An ISO 8601 date string (e.g. from Auth0 `updated_at`).
 * @param locale - The BCP 47 locale tag for formatting.
 * @returns A formatted date string or 'N/A'.
 */
function formatDate(isoDate: string | undefined, locale: string): string {
    if (!isoDate) {
        return 'N/A';
    }

    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

/**
 * Renders the Profile page.
 *
 * When authenticated, displays user details (avatar, name, email, membership date)
 * in a centered card layout with a sign-out action. When not authenticated, shows a
 * prompt to sign in.
 *
 * @param props - Page props containing the locale parameter.
 * @returns The rendered profile page JSX.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('profile');
    const session = await auth0.getSession();
    const isAuthenticated = session !== null && session !== undefined;

    if (!isAuthenticated) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-base p-6 text-foreground">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center gap-4 p-8">
                        <p className="text-secondary">{t('notAuthenticated')}</p>
                        <Button asChild>
                            <a href="/auth/login">Sign In</a>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    const user = session.user;
    const name = String(user.name ?? '');
    const email = String(user.email ?? '');
    const picture = String(user.picture ?? '');
    const emailVerified = Boolean(user.email_verified);
    const updatedAt = user.updated_at ? String(user.updated_at) : undefined;
    const initials = getInitials(name);
    const memberSince = formatDate(updatedAt, locale);

    return (
        <main className="flex min-h-screen flex-col bg-base p-6 text-foreground">
            <div className="mx-auto w-full max-w-2xl">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-primary">
                            {t('title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6 p-8">
                        {/* Avatar */}
                        <Avatar size="lg">
                            <AvatarImage src={picture} alt={name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>

                        {/* Display Name */}
                        <h2 className="text-xl font-semibold text-foreground">{name}</h2>

                        <Separator />

                        {/* Details */}
                        <div className="w-full space-y-4">
                            {/* Email */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-secondary">
                                    {t('email')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-foreground">{email}</span>
                                    {emailVerified && (
                                        <Badge variant="secondary">✓</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Member Since */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-secondary">
                                    {t('memberSince')}
                                </span>
                                <span className="text-sm text-foreground">{memberSince}</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Sign Out */}
                        <Button variant="outline" asChild>
                            <a href="/auth/logout">{t('signOut')}</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
