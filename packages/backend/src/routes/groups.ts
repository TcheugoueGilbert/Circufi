// packages/backend/src/routes/groups.ts
import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';
import { GroupService } from '../services/GroupService';
import { CreateGroupRequest, AddMemberRequest } from '@circufi/shared';

const router = Router();

router.use(authenticateToken);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const request: CreateGroupRequest = req.body;
    const group = await GroupService.createGroup(req.userId!, request);
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId!).get();
    const user = userDoc.data();
    const groupIds = user?.groupIds || [];
    
    const groups = [];
    for (const groupId of groupIds) {
      const groupDoc = await db.collection('groups').doc(groupId).get();
      if (groupDoc.exists) {
        groups.push({ id: groupDoc.id, ...groupDoc.data() });
      }
    }
    
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

router.get('/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const groupDoc = await db.collection('groups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    res.json({ success: true, data: { id: groupDoc.id, ...groupDoc.data() } });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group' });
  }
});

router.post('/:groupId/members', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { phoneNumber }: AddMemberRequest = req.body;
    
    const user = await GroupService.addMember(groupId, req.userId!, phoneNumber);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to add member' });
  }
});

router.delete('/:groupId/members/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, userId } = req.params;
    
    const groupDoc = await db.collection('groups').doc(groupId).get();
    const group = groupDoc.data();
    
    if (group?.admin?.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only admin can remove members' });
    }
    
    delete group.members[userId];
    group.rotation.order = group.rotation.order.filter((id: string) => id !== userId);
    group.updatedAt = Date.now();
    
    await db.collection('groups').doc(groupId).update({
      members: group.members,
      rotation: group.rotation,
      updatedAt: group.updatedAt
    });
    
    // Remove group from user's list
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    user.groupIds = user.groupIds.filter((id: string) => id !== groupId);
    await db.collection('users').doc(userId).update({ groupIds: user.groupIds });
    
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
});

router.get('/:groupId/health', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const health = await GroupService.getGroupHealth(groupId);
    res.json({ success: true, data: health });
  } catch (error) {
    console.error('Get group health error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group health' });
  }
});

router.get('/:groupId/rotation', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const groupDoc = await db.collection('groups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    const group = groupDoc.data();
    const members = Object.keys(group.members);
    
    // Get payment status for each member
    const paymentProgress: Record<string, any> = {};
    for (const memberId of members) {
      const contributionsSnapshot = await db.collection('contributions')
        .where('groupId', '==', groupId)
        .where('paidBy.userId', '==', memberId)
        .where('status', '==', 'completed')
        .get();
      
      paymentProgress[memberId] = {
        paid: contributionsSnapshot.size > 0,
        count: contributionsSnapshot.size
      };
    }
    
    res.json({
      success: true,
      data: {
        cycle: group.rotation.cycle,
        order: group.rotation.order,
        currentBeneficiary: group.rotation.currentBeneficiary,
        currentBeneficiaryIndex: group.rotation.currentBeneficiaryIndex,
        nextBeneficiary: group.rotation.order[group.rotation.currentBeneficiaryIndex + 1] || group.rotation.order[0],
        nextPaymentDate: group.rules.nextPaymentDate,
        paymentProgress
      }
    });
  } catch (error) {
    console.error('Get rotation error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rotation' });
  }
});

export default router;