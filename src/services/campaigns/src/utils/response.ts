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
 * Builds a standard JSON response.
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
