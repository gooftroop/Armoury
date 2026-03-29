import * as React from 'react';
import { TextInput } from 'react-native';
import { useTheme } from 'tamagui';
import type { TextInputProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Input component and InputProps interface.
 * 2. Must support error state styling via border color change.
 * 3. Must use theme tokens resolved from useTheme().
 * 4. Must map web input 'type' prop to appropriate RN TextInput props.
 * 5. Must set displayName for React DevTools readability.
 */

/**
 * Resolves a theme token into a concrete color string.
 */
function resolveThemeColor(theme: ReturnType<typeof useTheme>, token: string): string | undefined {
    const themeRecord = theme as unknown as Record<string, { get?: () => string; val?: string } | undefined>;
    const value = themeRecord[token];

    if (value?.get) {
        return value.get();
    }

    return value?.val;
}

/** Props for the mobile Input component. */
export interface InputProps extends TextInputProps {
    /** Whether the input has an error state. */
    error?: boolean;
    /** Web input type — mapped to RN equivalents where possible. */
    type?: string;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Forward ref to underlying TextInput component. */
    ref?: React.Ref<TextInput>;
}

/**
 * Maps a web input `type` value to React Native TextInput props.
 */
function mapInputType(type?: string): Partial<TextInputProps> {
    switch (type) {
        case 'password': {
            return { secureTextEntry: true };
        }

        case 'email': {
            return { keyboardType: 'email-address', autoCapitalize: 'none' };
        }

        case 'number': {
            return { keyboardType: 'numeric' };
        }

        case 'tel': {
            return { keyboardType: 'phone-pad' };
        }

        case 'url': {
            return { keyboardType: 'url', autoCapitalize: 'none' };
        }

        default: {
            return {};
        }
    }
}

/**
 * Input component - a text input field for forms.
 *
 * @param props - Component props including error, type, and standard TextInput attributes.
 * @returns The rendered Input component.
 */
function Input({ error, type = 'text', className: _className, style, ref, ...props }: InputProps): React.ReactElement {
    const theme = useTheme();
    const typeProps = mapInputType(type);

    const borderColor = error ? resolveThemeColor(theme, 'destructive') : resolveThemeColor(theme, 'input');

    return (
        <TextInput
            ref={ref}
            placeholderTextColor={resolveThemeColor(theme, 'placeholderColor')}
            style={[
                {
                    height: 36,
                    width: '100%',
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor,
                    backgroundColor: resolveThemeColor(theme, 'background'),
                    color: resolveThemeColor(theme, 'color'),
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    fontSize: 14,
                },
                style,
            ]}
            {...typeProps}
            {...props}
        />
    );
}

Input.displayName = 'Input';

export { Input };
