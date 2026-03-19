import * as React from 'react';
/**
 * Landing route entry point.
 *
 * @requirements
 * 1. Must remain an Expo Router default export route file.
 * 2. Must delegate all orchestration and rendering to LandingContainer.
 *
 * @module landing-route
 */

import { LandingContainer } from '@/components/LandingContainer.js';

/**
 * Route wrapper for the landing tab.
 *
 * @returns LandingContainer route content.
 */
export default function LandingRoute(): React.ReactElement {
    return <LandingContainer />;
}
