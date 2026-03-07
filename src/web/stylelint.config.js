/** @type {import('stylelint').Config} */
export default {
    extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
    rules: {
        /**
         * Allow Tailwind's @apply with utility classes that contain non-standard syntax
         * like theme() references and arbitrary values.
         */
        'declaration-property-value-no-unknown': null,

        /**
         * oklch() is valid modern CSS but some rules may flag its syntax.
         * Ensure color functions are not over-restricted.
         */
        'color-function-notation': 'modern',

        /**
         * Tailwind v4 uses @theme to register custom properties that don't follow
         * standard property naming. Disable the custom-property-pattern rule
         * since theme tokens are generated names.
         */
        'custom-property-pattern': null,

        /**
         * Allow Tailwind's @variant and @custom-variant nesting patterns.
         */
        'no-descending-specificity': null,

        /**
         * Our design tokens use decimal notation for oklch lightness (e.g., 0.52
         * instead of 52%). Both are valid CSS; we prefer decimal for consistency
         * with the oklch spec which defines lightness as a 0-1 range.
         */
        'lightness-notation': null,

        /**
         * Our design tokens use unitless hue values in oklch (e.g., 235 instead
         * of 235deg). Both are valid CSS; unitless is more concise and matches
         * common oklch usage patterns.
         */
        'hue-degree-notation': null,

        /**
         * We use blank lines between groups of custom properties in @theme blocks
         * for visual grouping (e.g., separating color tokens from spacing tokens).
         * Disable this rule to preserve intentional formatting.
         */
        'custom-property-empty-line-before': null,
    },
};
