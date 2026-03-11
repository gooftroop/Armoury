import type { ApiResponse } from '../types.ts';

/**
 * Formats an error into an API Gateway proxy response.
 *
 * @param error - Error instance to normalize.
 * @returns API response with status code and error payload.
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
