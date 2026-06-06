/**
 * Authentication routes
 * POST /auth/register
 * POST /auth/verify
 * POST /auth/resend
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { firebaseService } from '../services/firebaseService';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Invalid email format').optional(),
});

const verifySchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  code: z.string().min(1, 'Verification code is required'),
});

const resendSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

/**
 * POST /auth/register
 * Register a new user with phone number
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);

    const result = await authService.register(body.phoneNumber, body.displayName, body.email);

    res.status(201).json({
      success: true,
      data: {
        userId: result.userId,
        verificationRequired: result.verificationRequired,
        message: 'User registered. Verification code sent to phone.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
          statusCode: 400,
        },
      });
    }

    next(error);
  }
});

/**
 * POST /auth/verify
 * Verify phone number with OTP code
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = verifySchema.parse(req.body);

    const result = await authService.verify(body.phoneNumber, body.code);

    res.status(200).json({
      success: true,
      data: {
        userId: result.userId,
        token: result.token,
        user: {
          id: result.user.id,
          phoneNumber: result.user.phoneNumber,
          displayName: result.user.displayName,
          email: result.user.email,
          reputation: result.user.reputation,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
          statusCode: 400,
        },
      });
    }

    next(error);
  }
});

/**
 * POST /auth/resend
 * Resend verification code
 */
router.post('/resend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = resendSchema.parse(req.body);

    await authService.resendVerificationCode(body.phoneNumber);

    res.status(200).json({
      success: true,
      data: {
        message: 'Verification code sent to phone.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
          statusCode: 400,
        },
      });
    }

    next(error);
  }
});

export default router;
