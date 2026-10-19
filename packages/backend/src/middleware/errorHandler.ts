/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handler
 */
export function errorHandler(err: Error | ApiError, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      },
    });
  }

  // Handle common error messages
  const errorMap: Record<string, { code: string; statusCode: number }> = {
    INVALID_PHONE_NUMBER: { code: 'INVALID_PHONE_NUMBER', statusCode: 400 },
    PHONE_NUMBER_ALREADY_EXISTS: {
      code: 'PHONE_NUMBER_ALREADY_EXISTS',
      statusCode: 409,
    },
    USER_NOT_FOUND: { code: 'USER_NOT_FOUND', statusCode: 404 },
    GROUP_NOT_FOUND: { code: 'GROUP_NOT_FOUND', statusCode: 404 },
    CONTRIBUTION_NOT_FOUND: {
      code: 'CONTRIBUTION_NOT_FOUND',
      statusCode: 404,
    },
    NO_VERIFICATION_CODE_SENT: {
      code: 'NO_VERIFICATION_CODE_SENT',
      statusCode: 400,
    },
    VERIFICATION_CODE_EXPIRED: {
      code: 'VERIFICATION_CODE_EXPIRED',
      statusCode: 400,
    },
    INVALID_VERIFICATION_CODE: {
      code: 'INVALID_VERIFICATION_CODE',
      statusCode: 400,
    },
    TOO_MANY_ATTEMPTS: { code: 'TOO_MANY_ATTEMPTS', statusCode: 429 },
    SESSION_NOT_FOUND: { code: 'SESSION_NOT_FOUND', statusCode: 404 },
    AI_SERVICE_ERROR: { code: 'AI_SERVICE_ERROR', statusCode: 503 },
    USER_OR_GROUP_NOT_FOUND: {
      code: 'USER_OR_GROUP_NOT_FOUND',
      statusCode: 404,
    },
  };

  const errorConfig = errorMap[err.message] || {
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
  };

  // Only unexpected failures are logged; domain errors (404, 409, ...) are part of normal operation
  if (errorConfig.statusCode >= 500) {
    console.error('Error:', err);
  }

  return res.status(errorConfig.statusCode).json({
    success: false,
    error: {
      code: errorConfig.code,
      message: err.message,
      statusCode: errorConfig.statusCode,
    },
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
}
