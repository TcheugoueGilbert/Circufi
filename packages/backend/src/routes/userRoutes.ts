/**
 * User routes
 * GET /users/:userId
 * PUT /users/:userId
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { firebaseService } from '../services/firebaseService';
import { reputationService } from '../services/reputationService';

const router = Router();

// Validation schemas
const updateUserSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  referencePhone: z.string().optional(),
});

/**
 * GET /users/:userId
 * Get user profile by ID
 */
router.get('/:userId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await firebaseService.getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    // Recalculate trust score
    const updatedTrustScore = reputationService.calculateTrustScore(user);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        email: user.email,
        verificationStatus: user.verificationStatus,
        joinedAt: user.joinedAt,
        lastActive: user.lastActive,
        reputation: {
          ...user.reputation,
          trustScore: updatedTrustScore,
        },
        groupCount: user.groupIds.length,
        adminGroupCount: user.adminGroupIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /users/:userId
 * Update user profile (requires auth)
 */
router.put('/:userId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Verify user is updating their own profile
    if (req.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot update another user\'s profile',
          statusCode: 403,
        },
      });
    }

    const body = updateUserSchema.parse(req.body);

    const user = await firebaseService.getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    // Update user
    const updates: Record<string, any> = {
      ...body,
      lastActive: Date.now(),
    };

    await firebaseService.updateUser(userId, updates);

    // Get updated user
    const updatedUser = await firebaseService.getUser(userId);

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser!.id,
        phoneNumber: updatedUser!.phoneNumber,
        displayName: updatedUser!.displayName,
        email: updatedUser!.email,
        verificationStatus: updatedUser!.verificationStatus,
        reputation: updatedUser!.reputation,
        message: 'User profile updated successfully',
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
