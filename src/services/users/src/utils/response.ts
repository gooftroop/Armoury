import type { ApiResponse } from '@/types.js';

/**
 * Builds a standard JSON response.
 *
 * @param statusCode - HTTP status code to return.
 * @param payload - Serializable payload for the response body.
 * @returns API response with JSON body and headers.
 */
export function jsonResponse(statusCode: number, payload: unknown): ApiResponse {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    };
}

/**
 * Builds a JSON error response.
 *
 * @param statusCode - HTTP status code to return.
 * @param error - Short error code identifier.
 * @param message - Human readable error message.
 * @returns API response with error payload.
 */
export function errorResponse(statusCode: number, error: string, message: string): ApiResponse {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            error,
            message,
        }),
    };
}
