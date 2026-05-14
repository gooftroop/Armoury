import { defineRouting } from 'next-intl/routing';

/** Defines the supported locales and default locale for i18n routing. */
export const routing = defineRouting({
    locales: ['en'],
    defaultLocale: 'en',
    localePrefix: 'as-needed',
});
