import type { ApiResponse } from '@/types.js';

/**
 * Standard CORS headers included in all API responses.
 */
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
} as const;

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
            ...CORS_HEADERS,
        },
        body: JSON.stringify({
            error: responseError,
            message,
        }),
    };
}
