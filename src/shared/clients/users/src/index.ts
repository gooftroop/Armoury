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
    Account,
    UserParams,
    AccountParams,
    CreateUserRequest,
    UpdateUserRequest,
    CreateAccountRequest,
    UpdateAccountRequest,
} from './types.ts';

// === Error Classes and Type Guards ===

export { UsersApiError, UsersNetworkError, isUsersApiError, isUsersNetworkError } from './types.ts';

// === Config ===

export { USERS_BASE_URL } from './config.ts';

// === Query Key Builders ===

export { buildQueryUsersKey } from './queries/queryUsers.ts';
export { buildQueryUserKey } from './queries/queryUser.ts';
export { buildQueryAccountKey } from './queries/queryAccount.ts';

// === Query Options Builders ===

export { queryUsers } from './queries/queryUsers.ts';
export { queryUser } from './queries/queryUser.ts';
export { queryAccount } from './queries/queryAccount.ts';

// === Mutation Options Builders ===

export { mutationCreateUser } from './mutations/mutationCreateUser.ts';
export { mutationUpdateUser } from './mutations/mutationUpdateUser.ts';
export { mutationDeleteUser } from './mutations/mutationDeleteUser.ts';
export { mutationCreateAccount } from './mutations/mutationCreateAccount.ts';
export { mutationUpdateAccount } from './mutations/mutationUpdateAccount.ts';
export { mutationDeleteAccount } from './mutations/mutationDeleteAccount.ts';
