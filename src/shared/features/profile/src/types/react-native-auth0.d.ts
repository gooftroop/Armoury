/**
 * Type stubs for react-native-auth0 — required for mobile type generation.
 */
declare module 'react-native-auth0' {
    interface User {
        name?: string;
        email?: string;
        picture?: string;
        sub?: string;
        [key: string]: unknown;
    }

    interface Credentials {
        accessToken?: string;
    }

    export function useAuth0(): {
        user: User | null;
        authorize: (options: Record<string, unknown>) => Promise<void>;
        clearSession: () => Promise<void>;
        getCredentials: () => Promise<Credentials | null>;
    };
}
