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
 * Builds a successful JSON response.
 * @param statusCode HTTP status code.
 * @param payload Response payload to serialize.
 * @returns API response with JSON body.
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
 * Builds an error JSON response.
 * @param statusCode HTTP status code.
 * @param error Error type or code.
 * @param message Human-readable error message.
 * @returns API response with error JSON body.
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
