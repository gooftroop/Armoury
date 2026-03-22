import type { AuthorizerContext, AuthorizerResult, PolicyEffect } from '@/types.js';

/**
 * Builds a wildcard resource ARN scoped to the API stage.
 *
 * Uses a single trailing wildcard to match both REST API routes
 * (e.g. {stage}/GET/users) and WebSocket routes (e.g. {stage}/$connect).
 *
 * @param methodArn - API Gateway method ARN.
 * @returns Stage-scoped wildcard resource ARN.
 */
const buildWildcardResource = (methodArn: string): string => {
    const arnParts = methodArn.split('/');

    if (arnParts.length < 2) {
        return methodArn;
    }

    return `${arnParts[0]}/${arnParts[1]}/*`;
};

/**
 * Creates an IAM policy result for the authorizer response.
 *
 * @param principalId - Principal identifier for the subject.
 * @param effect - Allow or Deny policy effect.
 * @param resource - API Gateway method ARN.
 * @param context - Optional authorizer context to return.
 * @returns IAM policy response for API Gateway.
 */
export const generatePolicy = (
    principalId: string,
    effect: PolicyEffect,
    resource: string,
    context?: AuthorizerContext,
): AuthorizerResult => {
    const resourceWildcard = buildWildcardResource(resource);

    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resourceWildcard,
                },
            ],
        },
        context,
    };
};
