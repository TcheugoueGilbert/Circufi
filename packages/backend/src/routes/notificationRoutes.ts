/**
 * Notification routes
 * GET /notifications/:userId
 * PUT /notifications/:userId/mark-read
 */

import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { firebaseService } from '../services/firebaseService';

const router = Router();

function forbidden(res: Response) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'You can only access your own notifications',
      statusCode: 403,
    },
  });
}

/**
 * GET /notifications/:userId
 * List the caller's notifications, newest first
 */
router.get('/:userId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.userId !== req.userId) return forbidden(res);

    const notifications = await firebaseService.getUserNotifications(req.userId!);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /notifications/:userId/mark-read
 * Mark every notification of the caller as read
 */
router.put('/:userId/mark-read', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.userId !== req.userId) return forbidden(res);

    await firebaseService.markAllNotificationsAsRead(req.userId!);

    res.status(200).json({ success: true, data: { message: 'Notifications marked as read' } });
  } catch (error) {
    next(error);
  }
});

export default router;
