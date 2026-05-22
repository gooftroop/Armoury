import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    addBreadcrumb: vi.fn(),
    init: vi.fn(),
}));
