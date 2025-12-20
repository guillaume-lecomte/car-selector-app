import { type Context } from 'hono';

import { type ApiErrorResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code || 'ERROR';
  }
}

export function handleError(
  c: Context,
  error: unknown,
): Response {
  if (error instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      message: error.message,
      code: error.code ?? 'ERROR',
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    };

    return c.json(response);
  }

  if (error && typeof error === 'object' && 'issues' in error) {
    const response: ApiErrorResponse = {
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    };

    return c.json(response, 400);
  }

  const response: ApiErrorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error',
    code: 'INTERNAL_ERROR',
  };

  return c.json(response, 500);
}
