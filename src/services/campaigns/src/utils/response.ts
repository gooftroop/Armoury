import type { ApiResponse } from '@/types.js';

/**
 * Builds a standard JSON response.
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
