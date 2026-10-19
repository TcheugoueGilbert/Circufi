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
 * GET /groups/:groupId/members
 * GET /groups/code/:code
 * POST /groups/:groupId/join
 * POST /groups/:groupId/rotation/advance
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { firebaseService } from '../services/firebaseService';
import { reputationService } from '../services/reputationService';
import { generateId, generateInviteCode } from '../utils/helpers';
import { Group, User } from '../types';

const router = Router();

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  contributionAmount: z.number().positive('Contribution amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 letters').default('NGN'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  maxMembers: z.number().int().min(2).max(100).optional(),
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
 * Clients may send the rules either flat (`contributionAmount`, ...) or nested
 * under `rules`. Both are accepted and normalised to the flat shape.
 */
function flattenRules(body: any): any {
  if (body && typeof body === 'object' && body.rules && typeof body.rules === 'object') {
    const { rules, ...rest } = body;
    return { ...rules, ...rest };
  }
  return body;
}

/**
 * Load a group and make sure the caller is an active member.
 * Sends the error response itself and returns null when access is denied.
 */
async function loadGroupForMember(req: AuthRequest, res: Response, groupId: string) {
  const group = await firebaseService.getGroup(groupId);
  if (!group) {
    res.status(404).json({
      success: false,
      error: { code: 'GROUP_NOT_FOUND', message: 'Group not found', statusCode: 404 },
    });
    return null;
  }
  const membership = group.members?.[req.userId!];
  if (!membership || membership.status === 'removed') {
    res.status(403).json({
      success: false,
      error: { code: 'NOT_A_MEMBER', message: 'You are not a member of this group', statusCode: 403 },
    });
    return null;
  }
  return group;
}

/**
 * Add a user to a group: membership record, rotation slot, user's group list and
 * a notification for the admin. Shared by "admin adds member" and "member joins by code".
 */
async function enrollMember(group: Group, user: User): Promise<void> {
  group.members[user.id] = { joinedAt: Date.now(), status: 'active', role: 'member' };
  if (!group.rotation.order.includes(user.id)) {
    group.rotation.order.push(user.id);
  }
  group.updatedAt = Date.now();

  await firebaseService.updateGroup(group.id, {
    members: group.members,
    rotation: group.rotation,
    updatedAt: group.updatedAt,
  });
  await firebaseService.updateUser(user.id, {
    groupIds: Array.from(new Set([...(user.groupIds || []), group.id])),
  });

  if (group.admin.userId !== user.id) {
    await firebaseService.createNotification(group.admin.userId, {
      id: generateId(),
      userId: group.admin.userId,
      type: 'member_joined',
      groupId: group.id,
      message: `${user.displayName} joined ${group.name}`,
      read: false,
      createdAt: Date.now(),
    });
  }
}

/**
 * POST /groups
 * Create a new group (requires auth)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = createGroupSchema.parse(flattenRules(req.body));
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
      inviteCode: generateInviteCode(),

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
        inviteCode: newGroup.inviteCode,
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
router.get('/:groupId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const group = await loadGroupForMember(req, res, req.params.groupId);
    if (!group) return;

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

    if (group.rules.maxMembers && Object.keys(group.members).length >= group.rules.maxMembers) {
      return res.status(409).json({
        success: false,
        error: { code: 'GROUP_FULL', message: 'This circle has reached its member limit', statusCode: 409 },
      });
    }

    // Check trust score requirement
    const newMember = await firebaseService.getUser(newMemberId);
    if (!newMember) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found', statusCode: 404 },
      });
    }
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

    await enrollMember(group, newMember!);

    res.status(200).json({
      success: true,
      data: {
        memberId: newMemberId,
        memberName: newMember.displayName,
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

      if (userId === group.admin.userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_REMOVE_ADMIN',
            message: 'The circle admin cannot be removed',
            statusCode: 400,
          },
        });
      }

      // Remove member and take them out of the rotation
      group.members[userId].status = 'removed';
      const slot = group.rotation.order.indexOf(userId);
      if (slot !== -1) {
        group.rotation.order.splice(slot, 1);
        if (slot < group.rotation.currentBeneficiaryIndex) {
          group.rotation.currentBeneficiaryIndex--;
        }
        if (group.rotation.currentBeneficiary === userId) {
          group.rotation.currentBeneficiaryIndex = Math.min(slot, group.rotation.order.length - 1);
          group.rotation.currentBeneficiary = group.rotation.order[group.rotation.currentBeneficiaryIndex];
        }
      }

      await firebaseService.updateGroup(groupId, {
        members: group.members,
        rotation: group.rotation,
        updatedAt: Date.now(),
      });

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
      data: groups.map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: Object.keys(g.members).length,
        contributionAmount: g.rules.contributionAmount,
        currency: g.rules.currency,
        frequency: g.rules.frequency,
        healthScore: g.stats.healthScore,
        admin: g.admin,
        rules: g.rules,
        members: g.members,
        rotation: g.rotation,
        stats: g.stats
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /groups/code/:code
 * Get group by invite code
 */
router.get('/code/:code', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code.trim().toUpperCase();

    const group = await firebaseService.getGroupByInviteCode(code);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Circle not found. Check the code and try again.',
          statusCode: 404,
        },
      });
    }

    // Preview only: no member IDs or ledger data are exposed before joining
    res.status(200).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        admin: group.admin,
        rules: group.rules,
        memberCount: Object.keys(group.members).length,
        stats: { healthScore: group.stats.healthScore },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /groups/:groupId/join
 * The authenticated user joins a group after previewing it with an invite code
 */
router.post('/:groupId/join', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const group = await firebaseService.getGroup(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'GROUP_NOT_FOUND', message: 'Group not found', statusCode: 404 },
      });
    }

    const existing = group.members[userId];
    if (existing && existing.status !== 'removed') {
      return res.status(409).json({
        success: false,
        error: { code: 'MEMBER_ALREADY_EXISTS', message: 'You are already a member of this circle', statusCode: 409 },
      });
    }
    if (existing && existing.status === 'removed') {
      return res.status(403).json({
        success: false,
        error: { code: 'REMOVED_FROM_GROUP', message: 'You were removed from this circle. Ask the admin to add you back.', statusCode: 403 },
      });
    }

    const activeCount = Object.values(group.members).filter((m) => m.status !== 'removed').length;
    if (group.rules.maxMembers && activeCount >= group.rules.maxMembers) {
      return res.status(409).json({
        success: false,
        error: { code: 'GROUP_FULL', message: 'This circle has reached its member limit', statusCode: 409 },
      });
    }

    const user = await firebaseService.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found', statusCode: 404 },
      });
    }

    if (group.rules.minTrustScore && user.reputation.trustScore < group.rules.minTrustScore) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'LOW_TRUST_SCORE',
          message: `Your trust score is below the minimum required (${group.rules.minTrustScore})`,
          statusCode: 403,
        },
      });
    }

    await enrollMember(group, user);

    res.status(200).json({
      success: true,
      data: { groupId: group.id, message: 'You have joined the circle' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /groups/:groupId/members
 * Members of a circle with their reputation snapshot (members only)
 */
router.get('/:groupId/members', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const group = await loadGroupForMember(req, res, req.params.groupId);
    if (!group) return;

    const entries = Object.entries(group.members).filter(([, m]) => m.status !== 'removed');
    const members = await Promise.all(
      entries.map(async ([memberId, membership]) => {
        const user = await firebaseService.getUser(memberId);
        const rotationIndex = group.rotation.order.indexOf(memberId);
        return {
          userId: memberId,
          displayName: user?.displayName ?? 'Unknown',
          phoneNumber: user?.phoneNumber ?? '',
          trustScore: user ? reputationService.calculateTrustScore(user) : 0,
          onTimeRate: user?.reputation.onTimeRate ?? 0,
          totalPayments: user?.reputation.totalPayments ?? 0,
          joinedAt: membership.joinedAt,
          status: membership.status,
          role: membership.role,
          rotationPosition: rotationIndex === -1 ? null : rotationIndex + 1,
        };
      })
    );

    members.sort((a, b) => (a.rotationPosition ?? 999) - (b.rotationPosition ?? 999));

    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /groups/:groupId/health
 * Get group health score and member reliability
 */
router.get('/:groupId/health', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;

    const group = await loadGroupForMember(req, res, groupId);
    if (!group) return;

    const details = await reputationService.getGroupHealthDetails(group);
    const memberReliability = await reputationService.getMemberReliability(groupId);

    res.status(200).json({
      success: true,
      data: {
        ...details,
        groupHealthScore: details.healthScore,
        memberReliability,
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
router.get('/:groupId/rotation', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;

    const group = await loadGroupForMember(req, res, groupId);
    if (!group) return;

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

    // One row per member in rotation order. "hasBenefited" = already received a payout this cycle.
    const members = await Promise.all(
      group.rotation.order.map(async (userId, index) => {
        const user = await firebaseService.getUser(userId);
        const received = contributions
          .filter((c) => c.status === 'completed' && c.currentBeneficiary.userId === userId)
          .sort((a, b) => b.actualDate - a.actualDate);
        const hasBenefited = index < group.rotation.currentBeneficiaryIndex;
        return {
          userId,
          displayName: user?.displayName ?? 'Unknown',
          position: index + 1,
          hasBenefited,
          benefitDate: hasBenefited ? received[0]?.actualDate : undefined,
          amount: hasBenefited ? received.reduce((sum, c) => sum + c.amount, 0) || undefined : undefined,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        cycle: group.rotation.cycle,
        order: group.rotation.order,
        currentBeneficiaryIndex: group.rotation.currentBeneficiaryIndex,
        contributionAmount: group.rules.contributionAmount,
        currency: group.rules.currency,
        members,
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

/**
 * POST /groups/:groupId/rotation/advance
 * Admin closes the current round: the next member in the order becomes the beneficiary.
 * When the order wraps around, a full cycle is completed.
 */
router.post('/:groupId/rotation/advance', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const group = await loadGroupForMember(req, res, req.params.groupId);
    if (!group) return;

    if (group.admin.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only group admin can advance the rotation', statusCode: 403 },
      });
    }

    const order = group.rotation.order;
    const nextIndex = (group.rotation.currentBeneficiaryIndex + 1) % order.length;
    const wrapped = nextIndex === 0;

    const contributions = await firebaseService.getGroupContributions(group.id);
    const roundTotal = contributions
      .filter((c) => c.status === 'completed' && c.currentBeneficiary.userId === group.rotation.currentBeneficiary)
      .reduce((sum, c) => sum + c.amount, 0);

    const nextPayment = new Date(group.rules.nextPaymentDate);
    switch (group.rules.frequency) {
      case 'weekly':
        nextPayment.setDate(nextPayment.getDate() + 7);
        break;
      case 'biweekly':
        nextPayment.setDate(nextPayment.getDate() + 14);
        break;
      case 'monthly':
        nextPayment.setMonth(nextPayment.getMonth() + 1);
        break;
    }

    const rotation = {
      ...group.rotation,
      currentBeneficiaryIndex: nextIndex,
      currentBeneficiary: order[nextIndex],
      cycle: wrapped ? group.rotation.cycle + 1 : group.rotation.cycle,
    };
    const stats = {
      ...group.stats,
      totalDisbursed: group.stats.totalDisbursed + roundTotal,
      completedCycles: wrapped ? group.stats.completedCycles + 1 : group.stats.completedCycles,
    };

    await firebaseService.updateGroup(group.id, {
      rotation,
      stats,
      rules: { ...group.rules, nextPaymentDate: nextPayment.getTime() },
      updatedAt: Date.now(),
    });

    res.status(200).json({
      success: true,
      data: {
        cycle: rotation.cycle,
        currentBeneficiary: rotation.currentBeneficiary,
        nextPaymentDate: nextPayment.getTime(),
        cycleCompleted: wrapped,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
