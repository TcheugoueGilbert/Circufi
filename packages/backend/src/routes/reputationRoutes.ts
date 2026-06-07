/**
 * Reputation routes
 * GET /reputation/:userId
 * GET /reputation/:userId/events
 */

import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { firebaseService } from '../services/firebaseService';
import { reputationService } from '../services/reputationService';

const router = Router();

/**
 * GET /reputation/:userId
 * Get user's reputation profile
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

    // Get recent events
    const events = await firebaseService.getUserReputationEvents(userId);
    const recentEvents = events.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        displayName: user.displayName,
        trustScore: updatedTrustScore,
        onTimeRate: user.reputation.onTimeRate,
        totalPayments: user.reputation.totalPayments,
        totalDisbursed: user.reputation.totalDisbursed,
        flags: user.reputation.flags,
        joinedAt: user.joinedAt,
        recentEvents: recentEvents // Include events here
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /reputation/:userId/events
 * Get user's recent reputation events
 */
router.get('/:userId/events', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query as { limit?: string };

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

    const events = await firebaseService.getUserReputationEvents(userId);
    const recentEvents = events.slice(0, parseInt(limit || '10', 10));

    res.status(200).json({
      success: true,
      data: {
        events: recentEvents,
        count: recentEvents.length,
        total: events.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
