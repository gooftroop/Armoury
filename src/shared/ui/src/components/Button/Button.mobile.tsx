import * as React from 'react';
import { Button as TamaguiButton, styled, Text, useTheme, type GetProps } from 'tamagui';

/**
 * @requirements
 * 1. Must export Button, buttonVariants, and ButtonProps with the same names as web.
 * 2. Must support variants: primary, secondary, highlight, ghost, destructive, outline, link, unstyled.
 * 3. Must support sizes: sm, md, lg with mobile-appropriate dimensions.
 * 4. Must accept asChild and className for cross-platform compatibility and ignore them on mobile.
 * 5. Must use Tamagui primitives and theme tokens resolved from useTheme().
 * 6. Must set displayName for React DevTools readability.
 */

/**
 * Supported button visual variants.
 */
type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'highlight'
    | 'ghost'
    | 'destructive'
    | 'outline'
    | 'link'
    | 'unstyled';

/**
 * Supported button size variants.
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Variant option bag used by buttonVariants compatibility helper.
 */
interface ButtonVariantOptions {
    /** Selected visual variant. */
    variant?: ButtonVariant;
    /** Selected size variant. */
    size?: ButtonSize;
    /** Web-only className compatibility input. */
    className?: string;
}

/**
 * Cross-platform compatibility helper that mirrors the web export shape.
 *
 * @param options - Variant, size, and compatibility values.
 * @returns Normalized variant settings for the mobile implementation.
 */
function buttonVariants(options: ButtonVariantOptions = {}): Required<Omit<ButtonVariantOptions, 'className'>> {
    const variant = options.variant ?? 'primary';
    const size = options.size ?? 'md';

    return { variant, size };
}

const ButtonFrame = styled(TamaguiButton, {
    borderRadius: '$2',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: '$2',
    pressStyle: {
        opacity: 0.9,
    },
    variants: {
        size: {
            sm: {
                minHeight: 32,
                paddingHorizontal: '$3',
            },
            md: {
                minHeight: 36,
                paddingHorizontal: '$4',
            },
            lg: {
                minHeight: 40,
                paddingHorizontal: '$5',
            },
        },
    } as const,
    defaultVariants: {
        size: 'md',
    },
});

/**
 * Props for the mobile Button component.
 */
export interface ButtonProps extends Omit<GetProps<typeof TamaguiButton>, 'size' | 'variant'> {
    /** Visual variant controlling foreground/background/border colors. */
    variant?: ButtonVariant;
    /** Size token mapped to mobile touch-target dimensions. */
    size?: ButtonSize;
    /** Web compatibility prop ignored on mobile. */
    asChild?: boolean;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
}

/**
 * Resolves a theme token into a concrete color string.
 *
 * @param theme - Active Tamagui theme object.
 * @param token - Theme token key.
 * @returns Resolved color string when available.
 */
function resolveThemeColor(theme: ReturnType<typeof useTheme>, token: string): string | undefined {
    const themeRecord = theme as unknown as Record<string, { get?: () => string; val?: string } | undefined>;
    const value = themeRecord[token];

    if (value?.get) {
        return value.get();
    }

    return value?.val;
}

/**
 * Button component for mobile platforms using Tamagui primitives.
 *
 * @param props - Variant, size, compatibility props, and Tamagui button props.
 * @param ref - Forwarded button ref.
 * @returns A themed mobile button.
 */
const Button = React.forwardRef<React.ElementRef<typeof TamaguiButton>, ButtonProps>(
    ({ variant = 'primary', size = 'md', asChild: _asChild, className: _className, children, ...props }, ref) => {
        const theme = useTheme();
        const normalized = buttonVariants({ variant, size });

        const backgroundByVariant: Record<ButtonVariant, string | undefined> = {
            primary: resolveThemeColor(theme, 'primary'),
            secondary: resolveThemeColor(theme, 'secondary'),
            highlight: resolveThemeColor(theme, 'highlight'),
            ghost: 'transparent',
            destructive: resolveThemeColor(theme, 'destructive'),
            outline: 'transparent',
            link: 'transparent',
            unstyled: 'transparent',
        };

        const borderByVariant: Record<ButtonVariant, string | undefined> = {
            primary: 'transparent',
            secondary: 'transparent',
            highlight: 'transparent',
            ghost: 'transparent',
            destructive: 'transparent',
            outline: resolveThemeColor(theme, 'borderColor'),
            link: 'transparent',
            unstyled: 'transparent',
        };

        const textByVariant: Record<ButtonVariant, string | undefined> = {
            primary: resolveThemeColor(theme, 'primaryForeground'),
            secondary: resolveThemeColor(theme, 'secondaryForeground'),
            highlight: resolveThemeColor(theme, 'highlightForeground'),
            ghost: resolveThemeColor(theme, 'color'),
            destructive: resolveThemeColor(theme, 'destructiveForeground'),
            outline: resolveThemeColor(theme, 'color'),
            link: resolveThemeColor(theme, 'secondary'),
            unstyled: resolveThemeColor(theme, 'color'),
        };

        const underline = normalized.variant === 'link' || normalized.variant === 'unstyled' ? 'underline' : 'none';
        const borderWidth = normalized.variant === 'outline' ? 1 : 0;

        return (
            <ButtonFrame
                ref={ref}
                size={normalized.size}
                backgroundColor={backgroundByVariant[normalized.variant]}
                borderColor={borderByVariant[normalized.variant]}
                borderWidth={borderWidth}
                {...props}
            >
                <Text
                    color={textByVariant[normalized.variant]}
                    textDecorationLine={underline}
                    fontSize={normalized.size === 'sm' ? '$2' : normalized.size === 'lg' ? '$5' : '$3'}
                    fontWeight={normalized.variant === 'unstyled' ? '400' : '600'}
                >
                    {children}
                </Text>
            </ButtonFrame>
        );
    },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
