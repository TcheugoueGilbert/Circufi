/**
 * Contribution routes
 * POST /contributions
 * GET /contributions/:groupId
 * GET /contributions/user/:userId?groupId=X
 * PUT /contributions/:contributionId
 * POST /contributions/:contributionId/verify
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { firebaseService } from '../services/firebaseService';
import { reputationService } from '../services/reputationService';
import { generateId } from '../utils/helpers';
import { Contribution } from '../types';

const router = Router();

// Validation schemas
const createContributionSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['manual', 'mobile_money', 'bank_transfer']),
  paymentReference: z.string().optional(),
  scheduledDate: z.number().optional(),
  actualDate: z.number(),
  note: z.string().optional(),
});

const updateContributionSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed', 'disputed']).optional(),
  amount: z.number().positive().optional(),
  note: z.string().optional(),
});

/**
 * POST /contributions
 * Create a new contribution
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = createContributionSchema.parse(req.body);
    const userId = req.userId!;

    const group = await firebaseService.getGroup(body.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          statusCode: 404,
        },
      });
    }

    // Verify user is a member
    if (!group.members[userId]) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_A_MEMBER',
          message: 'You are not a member of this group',
          statusCode: 403,
        },
      });
    }

    // Verify contribution amount matches group rules
    if (body.amount !== group.rules.contributionAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: `Contribution amount must be ${group.rules.contributionAmount}`,
          statusCode: 400,
        },
      });
    }

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

    // Determine if payment is on time
    const scheduledDate = body.scheduledDate || group.rules.nextPaymentDate;
    const isOnTime = reputationService.isPaymentOnTime(scheduledDate, body.actualDate);

    const contributionId = generateId();

    const newContribution = {
      id: contributionId,
      groupId: body.groupId,

      paidBy: {
        userId,
        displayName: user.displayName,
      },

      amount: body.amount,
      currency: group.rules.currency,

      currentBeneficiary: {
        userId: group.rotation.currentBeneficiary,
        displayName: (await firebaseService.getUser(group.rotation.currentBeneficiary))
          ?.displayName || 'Unknown',
      },

      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,

      scheduledDate,
      actualDate: body.actualDate,
      isOnTime,

      status: 'pending' as const,
      note: body.note,
    };

    await firebaseService.createContribution(body.groupId, newContribution);

    // Tell the current beneficiary a payment is waiting for confirmation
    if (group.rotation.currentBeneficiary !== userId) {
      await firebaseService.createNotification(group.rotation.currentBeneficiary, {
        id: generateId(),
        userId: group.rotation.currentBeneficiary,
        type: 'payment_received',
        groupId: body.groupId,
        message: `${user.displayName} logged a contribution of ${group.rules.currency} ${body.amount.toLocaleString()} to ${group.name}`,
        read: false,
        createdAt: Date.now(),
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: newContribution.id,
        amount: newContribution.amount,
        currency: newContribution.currency,
        isOnTime: newContribution.isOnTime,
        status: newContribution.status,
        message: 'Contribution recorded',
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
 * GET /contributions/:groupId
 * Get all contributions for a group
 */
router.get('/:groupId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;

    const group = await firebaseService.getGroup(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          statusCode: 404,
        },
      });
    }

    const membership = group.members[req.userId!];
    if (!membership || membership.status === 'removed') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_A_MEMBER',
          message: 'You are not a member of this group',
          statusCode: 403,
        },
      });
    }

    const contributions = await firebaseService.getGroupContributions(groupId);

    const sorted = contributions.sort((a, b) => b.actualDate - a.actualDate);

    res.status(200).json({
      success: true,
      data: {
        contributions: sorted,
        count: sorted.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /contributions/user/:userId
 * Get contributions by user (optionally filtered by groupId)
 */
router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { groupId } = req.query as { groupId?: string };

    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own payment history',
          statusCode: 403,
        },
      });
    }

    let contributions: (Contribution & { groupName?: string })[] = [];

    if (groupId) {
      const group = await firebaseService.getGroup(groupId as string);
      const groupContribs = await firebaseService.getUserContributions(
        groupId as string,
        userId
      );
      contributions = groupContribs.map(c => ({
        ...c,
        groupName: group?.name || 'Unknown Group'
      }));
    } else {
      // Fetch from all groups user belongs to
      const user = await firebaseService.getUser(userId);
      if (user) {
        for (const gid of user.groupIds) {
          const group = await firebaseService.getGroup(gid);
          const groupContribs = await firebaseService.getUserContributions(gid, userId);
          const mapped = groupContribs.map(c => ({
            ...c,
            groupName: group?.name || 'Unknown Group'
          }));
          contributions = [...contributions, ...mapped];
        }
      }
    }

    const sorted = contributions.sort((a, b) => b.actualDate - a.actualDate);

    res.status(200).json({
      success: true,
      data: sorted, // Return array directly as expected by frontend
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /contributions/:contributionId
 * Update contribution status
 */
router.put('/:contributionId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { contributionId } = req.params;
    const body = updateContributionSchema.parse(req.body);

    // Note: We need groupId to fetch contribution, but it's not in the URL
    // In a real app, we might store all contributions in one collection
    // For now, we'll need to search for it
    const allGroups = await firebaseService.getAllGroups();

    let contribution: any = null;
    let groupId: string = '';

    for (const group of allGroups) {
      const contributions = await firebaseService.getGroupContributions(group.id);
      const found = contributions.find((c) => c.id === contributionId);
      if (found) {
        contribution = found;
        groupId = group.id;
        break;
      }
    }

    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONTRIBUTION_NOT_FOUND',
          message: 'Contribution not found',
          statusCode: 404,
        },
      });
    }

    const group = await firebaseService.getGroup(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          statusCode: 404,
        },
      });
    }

    // Only admin or the contributor can update
    if (group.admin.userId !== req.userId && contribution.paidBy.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot update this contribution',
          statusCode: 403,
        },
      });
    }

    const isAdmin = group.admin.userId === req.userId;

    // Only the admin can confirm / dispute a payment, otherwise members could self-verify
    if (body.status !== undefined && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the group admin can change the status of a contribution',
          statusCode: 403,
        },
      });
    }

    // Contributors may only amend their own record while it is still pending
    if (!isAdmin && contribution.status !== 'pending') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'This contribution can no longer be edited',
          statusCode: 403,
        },
      });
    }

    const updates: Record<string, any> = {
      ...body,
    };

    await firebaseService.updateContribution(groupId, contributionId, updates);

    // If marked as completed, record reputation event
    if (body.status === 'completed' && contribution.status !== 'completed') {
      const eventType = contribution.isOnTime ? 'payment_on_time' : 'payment_late';
      const reason = contribution.isOnTime
        ? 'On-time payment'
        : `Late by ${reputationService.getDaysLate(
            contribution.scheduledDate,
            contribution.actualDate
          )} days`;

      await reputationService.recordReputationEvent(
        contribution.paidBy.userId,
        eventType,
        reason,
        groupId
      );

      // Update contribution metrics
      await reputationService.updateContributionMetrics(contribution.paidBy.userId, groupId);
      await reputationService.refreshGroupStats(groupId);
    }

    const updatedContribution = await firebaseService.getContribution(groupId, contributionId);

    res.status(200).json({
      success: true,
      data: updatedContribution,
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
 * POST /contributions/:contributionId/verify
 * Verify a contribution (admin only)
 */
router.post(
  '/:contributionId/verify',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { contributionId } = req.params;
      const adminUserId = req.userId!;

      // Find the contribution
      const allGroups = await firebaseService.getAllGroups();

      let contribution: any = null;
      let groupId: string = '';

      for (const group of allGroups) {
        const contributions = await firebaseService.getGroupContributions(group.id);
        const found = contributions.find((c) => c.id === contributionId);
        if (found) {
          contribution = found;
          groupId = group.id;
          break;
        }
      }

      if (!contribution) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONTRIBUTION_NOT_FOUND',
            message: 'Contribution not found',
            statusCode: 404,
          },
        });
      }

      const group = await firebaseService.getGroup(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found',
            statusCode: 404,
          },
        });
      }

      // Verify admin
      if (group.admin.userId !== adminUserId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only group admin can verify contributions',
            statusCode: 403,
          },
        });
      }

      // Mark as completed
      const updates = {
        status: 'completed' as const,
        verifiedBy: {
          userId: adminUserId,
          timestamp: Date.now(),
        },
      };

      await firebaseService.updateContribution(groupId, contributionId, updates);

      // Record reputation event
      const eventType = contribution.isOnTime ? 'payment_on_time' : 'payment_late';
      const reason = contribution.isOnTime
        ? 'On-time payment'
        : `Late by ${reputationService.getDaysLate(
            contribution.scheduledDate,
            contribution.actualDate
          )} days`;

      await reputationService.recordReputationEvent(
        contribution.paidBy.userId,
        eventType,
        reason,
        groupId
      );

      // Update contribution metrics
      await reputationService.updateContributionMetrics(contribution.paidBy.userId, groupId);
      await reputationService.refreshGroupStats(groupId);

      // Tell the payer their contribution was confirmed
      await firebaseService.createNotification(contribution.paidBy.userId, {
        id: generateId(),
        userId: contribution.paidBy.userId,
        type: 'payment_received',
        groupId,
        message: `Your contribution to ${group.name} was confirmed`,
        read: false,
        createdAt: Date.now(),
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Contribution verified',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
