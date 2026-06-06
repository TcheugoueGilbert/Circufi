/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

/**
 * Verify JWT token and attach user ID to request
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Missing or invalid authorization header',
          statusCode: 401,
        },
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = authService.verifyToken(token);
      req.userId = decoded.userId;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          statusCode: 401,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
        statusCode: 500,
      },
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token, but sets userId if token is valid
 */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = authService.verifyToken(token);
        req.userId = decoded.userId;
      } catch (error) {
        // Token invalid but that's okay - continue without auth
      }
    }

    next();
  } catch (error) {
    next();
  }
}
