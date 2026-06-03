// packages/backend/src/routes/chat.ts
import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { AIAssistantService } from '../services/AIAssistantService';
import { ChatRequest } from '@circufi/shared';

const router = Router();

router.use(authenticateToken);

router.post('/message', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, message, sessionId }: ChatRequest = req.body;
    
    if (!groupId || !message) {
      return res.status(400).json({ success: false, error: 'Group ID and message are required' });
    }
    
    const result = await AIAssistantService.processMessage(
      req.userId!,
      groupId,
      message,
      sessionId
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ success: false, error: 'Failed to process message' });
  }
});

router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const sessionsSnapshot = await db.collection('chatSessions')
      .where('userId', '==', req.userId)
      .orderBy('updatedAt', 'desc')
      .get();
    
    const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

router.get('/sessions/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const sessionDoc = await db.collection('chatSessions').doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const session = sessionDoc.data();
    if (session.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    res.json({ success: true, data: { id: sessionDoc.id, ...session } });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
});

export default router;