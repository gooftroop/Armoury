export const Slot = 'Slot';
export const Stack = 'Stack';
export const Tabs = 'Tabs';
export const Link = 'Link';
export const router = {
    push: () => {},
    replace: () => {},
    back: () => {},
    canGoBack: () => false,
};
export const useRouter = () => router;
export const useLocalSearchParams = () => ({});
export const useGlobalSearchParams = () => ({});
export const useSegments = () => [];
export const usePathname = () => '/';
