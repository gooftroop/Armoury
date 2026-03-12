/**
 * @armoury/ui — Cross-platform shared component library.
 *
 * Components are resolved to platform-specific implementations
 * (.web.tsx / .native.tsx) at bundle time by webpack (Next.js) and
 * Metro (Expo). This barrel re-exports shared types only until
 * individual components are promoted from platform workspaces.
 *
 * @requirements
 * 1. Re-exports must cover every public component and type in @armoury/ui.
 * 2. Platform-specific implementation files must not be imported directly
 *    by consumers — always import from '@armoury/ui' or '@armoury/ui/<component>'.
 */

// Shared base types — safe to import from both web and mobile
export type { ButtonVariant, ButtonSize, DrawerSide, BadgeVariant, InputVariant, SelectOption } from '@/types.js';
