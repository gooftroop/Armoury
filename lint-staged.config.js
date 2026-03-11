export default {
    '*.{ts,tsx,js,jsx,json,md,css,html,yaml,yml}': ['prettier --write'],
    '*.{ts,tsx}': () => 'npx turbo run typecheck',
};
