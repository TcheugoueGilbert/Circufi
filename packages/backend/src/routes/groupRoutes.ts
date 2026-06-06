/**
 * Group routes
 * POST /groups
 * GET /groups/:groupId
 * PUT /groups/:groupId
 * POST /groups/:groupId/members
 * DELETE /groups/:groupId/members/:userId
 * GET /groups (list user's groups)
 * GET /groups/:groupId/health
 * GET /groups/:groupId/rotation
 * POST /groups/:groupId/rotation/advance
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { firebaseService } from '../services/firebaseService';
import { reputationService } from '../services/reputationService';
import { generateId } from '../utils/helpers';

const router = Router();

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  contributionAmount: z.number().positive('Contribution amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 letters'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  maxMembers: z.number().optional(),
  minTrustScore: z.number().min(0).max(100).optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  maxMembers: z.number().optional(),
  minTrustScore: z.number().min(0).max(100).optional(),
});

const addMemberSchema = z.object({
  phoneNumber: z.string().optional(),
  userId: z.string().optional(),
});

/**
 * POST /groups
 * Create a new group (requires auth)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = createGroupSchema.parse(req.body);
    const adminUserId = req.userId!;

    // Get admin user
    const adminUser = await firebaseService.getUser(adminUserId);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Admin user not found',
          statusCode: 404,
        },
      });
    }

    // Calculate next payment date
    const now = new Date();
    let nextPaymentDate = new Date();
    switch (body.frequency) {
      case 'weekly':
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
        break;
      case 'biweekly':
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
        break;
      case 'monthly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        break;
    }

    const groupId = generateId();

    const newGroup = {
      id: groupId,
      name: body.name,
      description: body.description || '',

      admin: {
        userId: adminUserId,
        name: adminUser.displayName,
      },

      rules: {
        contributionAmount: body.contributionAmount,
        currency: body.currency,
        frequency: body.frequency,
        nextPaymentDate: nextPaymentDate.getTime(),
        maxMembers: body.maxMembers,
        minTrustScore: body.minTrustScore || 0,
      },

      members: {
        [adminUserId]: {
          joinedAt: Date.now(),
          status: 'active' as const,
          role: 'admin' as const,
        },
      },

      rotation: {
        cycle: 1,
        order: [adminUserId],
        currentBeneficiary: adminUserId,
        currentBeneficiaryIndex: 0,
      },

      stats: {
        totalCollected: 0,
        totalDisbursed: 0,
        healthScore: 50,
        completedCycles: 0,
      },

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await firebaseService.createGroup(groupId, newGroup);

    // Add group to admin's profile
    const updatedGroupIds = [...adminUser.groupIds, groupId];
    const updatedAdminGroupIds = [...adminUser.adminGroupIds, groupId];

    await firebaseService.updateUser(adminUserId, {
      groupIds: updatedGroupIds,
      adminGroupIds: updatedAdminGroupIds,
    });

    res.status(201).json({
      success: true,
      data: {
        id: newGroup.id,
        name: newGroup.name,
        admin: newGroup.admin,
        rules: newGroup.rules,
        memberCount: 1,
        message: 'Group created successfully',
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
 * GET /groups/:groupId
 * Get group details
 */
router.get('/:groupId', async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    res.status(200).json({
      success: true,
      data: {
        ...group,
        memberCount: Object.keys(group.members).length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /groups/:groupId
 * Update group (only admin)
 */
router.put('/:groupId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const body = updateGroupSchema.parse(req.body);
    const userId = req.userId!;

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

    if (group.admin.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only group admin can update group',
          statusCode: 403,
        },
      });
    }

    const updates: Record<string, any> = {
      ...body,
      updatedAt: Date.now(),
    };

    await firebaseService.updateGroup(groupId, updates);

    const updatedGroup = await firebaseService.getGroup(groupId);

    res.status(200).json({
      success: true,
      data: updatedGroup,
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
 * POST /groups/:groupId/members
 * Add member to group
 */
router.post('/:groupId/members', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const body = addMemberSchema.parse(req.body);
    const adminUserId = req.userId!;

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

    if (group.admin.userId !== adminUserId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only group admin can add members',
          statusCode: 403,
        },
      });
    }

    // Find user by phone or ID
    let newMemberId: string;

    if (body.phoneNumber) {
      const user = await firebaseService.getUserByPhone(body.phoneNumber);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User with that phone number not found',
            statusCode: 404,
          },
        });
      }
      newMemberId = user.id;
    } else if (body.userId) {
      const user = await firebaseService.getUser(body.userId);
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
      newMemberId = body.userId;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Either phoneNumber or userId must be provided',
          statusCode: 400,
        },
      });
    }

    // Check if already member
    if (group.members[newMemberId]) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'MEMBER_ALREADY_EXISTS',
          message: 'User is already a member of this group',
          statusCode: 409,
        },
      });
    }

    // Check trust score requirement
    const newMember = await firebaseService.getUser(newMemberId);
    if (
      newMember &&
      group.rules.minTrustScore &&
      newMember.reputation.trustScore < group.rules.minTrustScore
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'LOW_TRUST_SCORE',
          message: `User's trust score is below the minimum required (${group.rules.minTrustScore})`,
          statusCode: 403,
        },
      });
    }

    // Add member to group
    group.members[newMemberId] = {
      joinedAt: Date.now(),
      status: 'active',
      role: 'member',
    };

    // Add to rotation order
    group.rotation.order.push(newMemberId);

    await firebaseService.updateGroup(groupId, group);

    // Add group to member's profile
    const memberUser = await firebaseService.getUser(newMemberId);
    if (memberUser) {
      const updatedGroupIds = [...memberUser.groupIds, groupId];
      await firebaseService.updateUser(newMemberId, { groupIds: updatedGroupIds });
    }

    res.status(200).json({
      success: true,
      data: {
        memberId: newMemberId,
        memberName: newMember?.displayName,
        message: 'Member added to group',
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
 * DELETE /groups/:groupId/members/:userId
 * Remove member from group
 */
router.delete(
  '/:groupId/members/:userId',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { groupId, userId } = req.params;
      const adminUserId = req.userId!;

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

      if (group.admin.userId !== adminUserId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only group admin can remove members',
            statusCode: 403,
          },
        });
      }

      if (!group.members[userId]) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MEMBER_NOT_FOUND',
            message: 'Member not found in group',
            statusCode: 404,
          },
        });
      }

      // Remove member
      group.members[userId].status = 'removed';

      await firebaseService.updateGroup(groupId, group);

      // Remove group from member's profile
      const member = await firebaseService.getUser(userId);
      if (member) {
        const updatedGroupIds = member.groupIds.filter((id) => id !== groupId);
        await firebaseService.updateUser(userId, { groupIds: updatedGroupIds });
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Member removed from group',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /groups
 * List user's groups
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const groups = await firebaseService.getUserGroups(userId);

    res.status(200).json({
      success: true,
      data: {
        groups: groups.map((g) => ({
          id: g.id,
          name: g.name,
          memberCount: Object.keys(g.members).length,
          contribution Amount: g.rules.contributionAmount,
          currency: g.rules.currency,
          frequency: g.rules.frequency,
          healthScore: g.stats.healthScore,
        })),
        count: groups.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /groups/:groupId/health
 * Get group health score and member reliability
 */
router.get('/:groupId/health', async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    const healthScore = await reputationService.calculateGroupHealthScore(group);
    const memberReliability = await reputationService.getMemberReliability(groupId);
    const riskFlags = await reputationService.getGroupRiskFlags(groupId);

    res.status(200).json({
      success: true,
      data: {
        groupHealthScore: healthScore,
        memberReliability,
        riskFlags,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /groups/:groupId/rotation
 * Get current rotation details
 */
router.get('/:groupId/rotation', async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    // Get current and next beneficiary
    const currentBeneficiary = await firebaseService.getUser(
      group.rotation.currentBeneficiary
    );
    const nextBeneficiaryIndex = (group.rotation.currentBeneficiaryIndex + 1) % group.rotation.order.length;
    const nextBeneficiary = await firebaseService.getUser(
      group.rotation.order[nextBeneficiaryIndex]
    );

    // Get payment progress for current cycle
    const contributions = await firebaseService.getGroupContributions(groupId);
    const paymentProgress: Record<string, any> = {};

    for (const userId of group.rotation.order) {
      const userContributions = contributions.filter(
        (c) =>
          c.paidBy.userId === userId &&
          c.status === 'completed' &&
          c.currentBeneficiary.userId === group.rotation.currentBeneficiary
      );

      paymentProgress[userId] = {
        paid: userContributions.length > 0,
        amount: userContributions[0]?.amount || 0,
        date: userContributions[0]?.actualDate || null,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        cycle: group.rotation.cycle,
        order: group.rotation.order,
        currentBeneficiary: {
          userId: currentBeneficiary?.id,
          displayName: currentBeneficiary?.displayName,
        },
        nextBeneficiary: {
          userId: nextBeneficiary?.id,
          displayName: nextBeneficiary?.displayName,
        },
        nextPaymentDate: group.rules.nextPaymentDate,
        paymentProgress,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
