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
} from '@clients-users/types.js';

// === Error Classes and Type Guards ===

export {
    UsersApiError,
    UsersNetworkError,
    isUsersApiError,
    isUsersNetworkError,
} from '@clients-users/types.js';

// === Config ===

export { USERS_BASE_URL } from '@clients-users/config.js';

// === Query Key Builders ===

export { buildQueryUsersKey } from '@clients-users/queries/queryUsers.js';
export { buildQueryUserKey } from '@clients-users/queries/queryUser.js';
export { buildQueryAccountKey } from '@clients-users/queries/queryAccount.js';

// === Query Options Builders ===

export { queryUsers } from '@clients-users/queries/queryUsers.js';
export { queryUser } from '@clients-users/queries/queryUser.js';
export { queryAccount } from '@clients-users/queries/queryAccount.js';

// === Mutation Options Builders ===

export { mutationCreateUser } from '@clients-users/mutations/mutationCreateUser.js';
export { mutationUpdateUser } from '@clients-users/mutations/mutationUpdateUser.js';
export { mutationDeleteUser } from '@clients-users/mutations/mutationDeleteUser.js';
export { mutationCreateAccount } from '@clients-users/mutations/mutationCreateAccount.js';
export { mutationUpdateAccount } from '@clients-users/mutations/mutationUpdateAccount.js';
export { mutationDeleteAccount } from '@clients-users/mutations/mutationDeleteAccount.js';
