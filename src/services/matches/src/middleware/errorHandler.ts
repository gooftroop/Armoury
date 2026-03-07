import type { ApiResponse } from '@matches/src/types.js';

/**
 * Formats an error into an API Gateway response with appropriate status code and message.
 * @param error Error to format.
 * @returns API response with error details.
 */
export function formatErrorResponse(error: Error): ApiResponse {
    const isValidationError = error.name === 'ValidationError';
    const isDbError = error.name === 'DatabaseError';
    const statusCode = isValidationError ? 400 : 500;
    const responseError = isValidationError ? 'ValidationError' : isDbError ? 'DatabaseError' : 'ServerError';
    const message = error.message || 'Unknown error';

    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            error: responseError,
            message,
        }),
    };
}
