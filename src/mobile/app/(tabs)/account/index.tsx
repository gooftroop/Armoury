import * as React from 'react';
/**
 * Account route entry point.
 *
 * @requirements
 * 1. Must remain an Expo Router default export route file.
 * 2. Must delegate all orchestration and rendering to AccountContainer.
 *
 * @module account-route
 */

import { AccountContainer } from '@/components/AccountContainer.js';

/**
 * Route wrapper for the account tab.
 *
 * @returns AccountContainer route content.
 */
export default function AccountRoute(): React.ReactElement {
    return <AccountContainer />;
}
