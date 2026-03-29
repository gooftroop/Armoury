/**
 * Users API client package.
 *
 * Provides React Query query/mutation options factories, query key builders,
 * and all user/account entity types for the users REST API.
 */

// === Types ===

export type {
    User,
    UserPreferences,
    SystemPreferences,
    Account,
    UserParams,
    AccountParams,
    CreateUserRequest,
    UpdateUserRequest,
    CreateAccountRequest,
    UpdateAccountRequest,
} from '@/types.js';

// === Error Classes and Type Guards ===

export { UsersApiError, UsersNetworkError, isUsersApiError, isUsersNetworkError } from '@/types.js';

// === Config ===

export { USERS_BASE_URL } from '@/config.js';

// === Query Key Builders ===

export { buildQueryUsersKey } from '@/queries/queryUsers.js';
export { buildQueryUserKey } from '@/queries/queryUser.js';
export { buildQueryAccountKey } from '@/queries/queryAccount.js';

// === Query Options Builders ===

export { queryUsers } from '@/queries/queryUsers.js';
export { queryUser } from '@/queries/queryUser.js';
export { queryAccount } from '@/queries/queryAccount.js';

// === Mutation Options Builders ===

export { mutationCreateUser } from '@/mutations/mutationCreateUser.js';
export { mutationUpdateUser } from '@/mutations/mutationUpdateUser.js';
export { mutationDeleteUser } from '@/mutations/mutationDeleteUser.js';
export { mutationCreateAccount } from '@/mutations/mutationCreateAccount.js';
export { mutationUpdateAccount } from '@/mutations/mutationUpdateAccount.js';
export { mutationDeleteAccount } from '@/mutations/mutationDeleteAccount.js';
