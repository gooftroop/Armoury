export const Text = 'Text';
export const View = 'View';
export const Platform = { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios };
export const Dimensions = { get: () => ({ width: 375, height: 812, scale: 2, fontScale: 1 }) };
export const StyleSheet = {
    create: <T extends Record<string, unknown>>(styles: T): T => styles,
};
