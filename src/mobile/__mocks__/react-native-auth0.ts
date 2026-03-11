export const Auth0Provider = ({ children }: { children: React.ReactNode }) => children;
export const useAuth0 = () => ({
    authorize: async () => {},
    clearSession: async () => {},
    user: undefined,
    isLoading: false,
    error: undefined,
});
