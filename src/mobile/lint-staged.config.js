export default {
    '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix'],
    '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': ['prettier --write'],
    '*.{ts,tsx}': () => 'tsc --noEmit',
};
