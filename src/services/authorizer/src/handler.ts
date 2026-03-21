import { jwtVerify } from 'jose';
import * as Sentry from '@sentry/aws-serverless';
import { getJwks } from '@/jwks.js';
import { getServiceConfig } from '@/utils/secrets.js';
import { extractTokenFromEvent, buildIssuer } from '@/utils/token.js';
import { generatePolicy } from '@/utils/policy.js';
import { isJwtPayload } from '@/utils/jwt.js';
import type { AuthorizerContext, AuthorizerEvent, AuthorizerResult } from '@/types.js';

/**
 * Default principal identifier used when denying access.
 */
const DEFAULT_PRINCIPAL_ID = 'unknown';

/**
 * Lambda authorizer entry point for Auth0 JWT validation.
 *
 * Extracts the token from the authorizer event (supporting both TOKEN
 * and REQUEST event types), fetches service configuration from environment
 * variables, and verifies the JWT against the Auth0 JWKS endpoint. Returns
 * an Allow or Deny IAM policy based on the verification result.
 *
 * @param event - API Gateway TOKEN or REQUEST authorizer event.
 * @returns IAM policy result with Allow or Deny effect.
 */
export const handler = async (event: AuthorizerEvent): Promise<AuthorizerResult> => {
    const token = extractTokenFromEvent(event);

    if (!token) {
        return generatePolicy(DEFAULT_PRINCIPAL_ID, 'Deny', event.methodArn);
    }

    try {
        const config = await getServiceConfig();
        const issuer = buildIssuer(config.auth0Domain);

        const { payload } = await jwtVerify(token, getJwks(config.auth0Domain), {
            audience: config.auth0Audience,
            issuer,
        });

        if (!isJwtPayload(payload)) {
            return generatePolicy(DEFAULT_PRINCIPAL_ID, 'Deny', event.methodArn);
        }

        const context: AuthorizerContext = {
            sub: payload.sub,
        };

        if (payload.email) {
            context.email = payload.email;
        }

        if (payload.name) {
            context.name = payload.name;
        }

        return generatePolicy(payload.sub, 'Allow', event.methodArn, context);
    } catch (error) {
        Sentry.captureException(error);

        return generatePolicy(DEFAULT_PRINCIPAL_ID, 'Deny', event.methodArn);
    }
};
