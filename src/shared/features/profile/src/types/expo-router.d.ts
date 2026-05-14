/**
 * Type stubs for expo-router — required for mobile type generation.
 */
declare module 'expo-router' {
    export function useRouter(): {
        push: (path: string) => void;
        replace: (path: string) => void;
        back: () => void;
    };
}
