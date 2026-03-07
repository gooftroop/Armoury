import { describe, expect, it } from 'vitest';
import { formatErrorResponse } from '@matches/src/middleware/errorHandler.js';

describe('error handler', () => {
    it('returns 400 for ValidationError', () => {
        const error = new Error('Invalid input');

        error.name = 'ValidationError';

        const response = formatErrorResponse(error);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({
            error: 'ValidationError',
            message: 'Invalid input',
        });
    });

    it('returns 500 for DatabaseError', () => {
        const error = new Error('Database down');

        error.name = 'DatabaseError';

        const response = formatErrorResponse(error);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body)).toMatchObject({
            error: 'DatabaseError',
            message: 'Database down',
        });
    });

    it('returns 500 for generic errors', () => {
        const error = new Error('Unexpected');
        const response = formatErrorResponse(error);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body)).toMatchObject({
            error: 'ServerError',
            message: 'Unexpected',
        });
    });
});
