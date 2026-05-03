declare module 'next/link' {
    import type { ComponentProps, FC } from 'react';

    const Link: FC<ComponentProps<'a'> & { href: string }>;
    export default Link;
}

declare module 'next-intl' {
    export function useTranslations(
        namespace?: string,
    ): (key: string, params?: Record<string, string | number>) => string;
}

declare module 'lucide-react' {
    import type { FC, SVGProps } from 'react';

    type Icon = FC<SVGProps<SVGSVGElement> & { size?: number | string }>;
    export const Swords: Icon;
    export const Copy: Icon;
    export const Trash2: Icon;
    export const SlidersHorizontal: Icon;
    export const ChevronDown: Icon;
    export const ChevronUp: Icon;
    export const Shield: Icon;
    export const Plus: Icon;
}
