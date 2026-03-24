import type { ApiResponse } from '@/types.js';

/**
 * Standard CORS headers included in all API responses.
 */
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': process.env['ALLOWED_ORIGIN'] ?? '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
} as const;

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
            ...CORS_HEADERS,
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
            ...CORS_HEADERS,
        },
        body: JSON.stringify({
            error,
            message,
        }),
    };
}
