// packages/backend/src/routes/contributions.ts
import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';
import { Contribution, LogContributionRequest } from '@circufi/shared';
import { ReputationService } from '../services/ReputationService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticateToken);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, amount, paymentMethod, paymentReference, scheduledDate, actualDate, note }: LogContributionRequest = req.body;
    
    // Get group to verify amount
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    const group = groupDoc.data();
    
    // Validate amount
    if (amount !== group.rules.contributionAmount) {
      return res.status(400).json({ 
        success: false, 
        error: `Contribution amount must be ${group.rules.contributionAmount} ${group.rules.currency}` 
      });
    }
    
    // Get user info
    const userDoc = await db.collection('users').doc(req.userId!).get();
    const user = userDoc.data();
    
    const isOnTime = actualDate <= scheduledDate;
    const contributionId = uuidv4();
    const now = Date.now();
    
    const contribution: Contribution = {
      id: contributionId,
      groupId,
      paidBy: {
        userId: req.userId!,
        displayName: user.displayName
      },
      amount,
      currency: group.rules.currency,
      currentBeneficiary: {
        userId: group.rotation.currentBeneficiary,
        displayName: '' // Will be populated
      },
      paymentMethod,
      paymentReference,
      scheduledDate,
      actualDate,
      isOnTime,
      status: 'pending',
      note,
      createdAt: now,
      updatedAt: now
    };
    
    // Get beneficiary display name
    const beneficiaryDoc = await db.collection('users').doc(group.rotation.currentBeneficiary).get();
    if (beneficiaryDoc.exists) {
      const beneficiary = beneficiaryDoc.data();
      contribution.currentBeneficiary.displayName = beneficiary.displayName;
    }
    
    await db.collection('contributions').doc(contributionId).set(contribution);
    
    res.status(201).json({ success: true, data: contribution });
  } catch (error) {
    console.error('Log contribution error:', error);
    res.status(500).json({ success: false, error: 'Failed to log contribution' });
  }
});

router.put('/:contributionId/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { contributionId } = req.params;
    
    const contributionDoc = await db.collection('contributions').doc(contributionId).get();
    if (!contributionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Contribution not found' });
    }
    
    const contribution = contributionDoc.data() as Contribution;
    
    // Verify admin status
    const groupDoc = await db.collection('groups').doc(contribution.groupId).get();
    const group = groupDoc.data();
    
    if (group.admin.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only group admin can verify contributions' });
    }
    
    const oldStatus = contribution.status;
    contribution.status = 'completed';
    contribution.verifiedBy = {
      userId: req.userId!,
      timestamp: Date.now()
    };
    contribution.updatedAt = Date.now();
    
    await db.collection('contributions').doc(contributionId).update({
      status: 'completed',
      verifiedBy: contribution.verifiedBy,
      updatedAt: contribution.updatedAt
    });
    
    // Update reputation
    await ReputationService.updateReputationFromContribution(contribution, oldStatus);
    
    // Update group stats
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', contribution.groupId)
      .where('status', '==', 'completed')
      .get();
    
    const totalCollected = contributionsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().amount || 0);
    }, 0);
    
    await db.collection('groups').doc(contribution.groupId).update({
      'stats.totalCollected': totalCollected,
      updatedAt: Date.now()
    });
    
    res.json({ success: true, data: contribution });
  } catch (error) {
    console.error('Verify contribution error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify contribution' });
  }
});

router.get('/group/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', groupId)
      .orderBy('scheduledDate', 'desc')
      .get();
    
    const contributions = contributionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, data: contributions });
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contributions' });
  }
});

router.get('/user', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.query;
    
    let query = db.collection('contributions').where('paidBy.userId', '==', req.userId);
    if (groupId) {
      query = query.where('groupId', '==', groupId);
    }
    
    const contributionsSnapshot = await query.orderBy('scheduledDate', 'desc').get();
    const contributions = contributionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, data: contributions });
  } catch (error) {
    console.error('Get user contributions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contributions' });
  }
});

export default router;