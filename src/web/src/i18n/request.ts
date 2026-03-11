import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing.js';

/** Provides per-request i18n configuration, loading the correct message bundle for the active locale. */
export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default as Record<string, string>,
    };
});
