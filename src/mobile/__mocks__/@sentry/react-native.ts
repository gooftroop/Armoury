/** No-op Sentry mock for Vitest — prevents ESM/CJS incompatibility with react-native. */
export const init = () => {};

export const wrap = (component: unknown) => component;

export const captureException = () => '';

export const captureMessage = () => '';

export const setUser = () => {};

export const setTag = () => {};

export const setExtra = () => {};

export const addBreadcrumb = () => {};

export const withScope = (fn: (scope: unknown) => void) => {
    fn({});
};

export const startSpan = () => ({});

export const Severity = { Error: 'error', Warning: 'warning', Info: 'info' };
