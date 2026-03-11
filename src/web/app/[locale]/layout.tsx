import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Libre_Franklin, JetBrains_Mono } from 'next/font/google';
import { routing } from '@web/src/i18n/routing.js';
import { Providers } from '@web/src/components/providers.js';
import '../globals.css';

export const metadata: Metadata = {
    title: 'Armoury',
    description: 'Tabletop army management',
};

const libreFranklin = Libre_Franklin({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

/** Returns all supported locales for static generation at build time. */
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

/** Locale-aware layout providing the HTML shell, fonts, theme init, and i18n provider. */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);

    return (
        <html
            lang={locale}
            className={`${libreFranklin.variable} ${jetbrainsMono.variable} dark`}
            suppressHydrationWarning
        >
            <head>
                <script src="/js/init.js" />
            </head>
            <body className="min-h-screen bg-background text-foreground antialiased">
                <NextIntlClientProvider>
                    <Providers>{children}</Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
