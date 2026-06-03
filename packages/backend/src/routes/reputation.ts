// packages/backend/src/routes/reputation.ts
import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { ReputationService } from '../services/ReputationService';
import { getRiskCategory } from '@circufi/shared';

const router = Router();

router.use(authenticateToken);

router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { groupId } = req.query;
    
    // Check if user has permission to view this reputation
    if (userId !== req.userId) {
      // Check if they're in the same group
      const userDoc = await db.collection('users').doc(req.userId).get();
      const user = userDoc.data();
      
      if (!user?.groupIds?.some((groupId: string) => groupId === groupId)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }
    
    const reputation = await ReputationService.calculateUserReputation(userId, groupId as string);
    const events = await ReputationService.getReputationEvents(userId);
    const riskCategory = getRiskCategory(reputation.trustScore);
    
    res.json({
      success: true,
      data: {
        ...reputation,
        riskCategory,
        recentEvents: events.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Get reputation error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reputation' });
  }
});

router.get('/:userId/history', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const events = await ReputationService.getReputationEvents(userId, 50);
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get reputation history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reputation history' });
  }
});

export default router;