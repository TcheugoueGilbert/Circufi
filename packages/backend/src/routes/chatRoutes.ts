/**
 * Chat/AI Assistant routes
 * POST /chat/message
 * GET /chat/sessions
 * GET /chat/sessions/:sessionId
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { firebaseService } from '../services/firebaseService';
import { ollamaAIService } from '../services/ollamaAIService';

const router = Router();

// Validation schemas
const sendMessageSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
});

/**
 * POST /chat/message
 * Send a message and get AI response
 */
router.post('/message', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = sendMessageSchema.parse(req.body);
    const userId = req.userId!;

    // Verify user is in the group
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

    // Get or create chat session
    let session;

    try {
      if (body.sessionId) {
        session = await ollamaAIService.continueChat(userId, body.sessionId, body.message);
      } else {
        session = await ollamaAIService.chat(userId, body.groupId, body.message);
        await firebaseService.createChatSession(userId, session);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: 'AI service is unavailable. Please check if Ollama is running.',
          statusCode: 503,
        },
      });
    }

    // Save session to Firebase
    await firebaseService.updateChatSession(userId, session.id, {
      messages: session.messages,
      updatedAt: session.updatedAt,
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        messages: session.messages,
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
 * GET /chat/sessions
 * Get list of user's chat sessions
 */
router.get('/sessions', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const sessions = await firebaseService.getUserChatSessions(userId);

    res.status(200).json({
      success: true,
      data: {
        sessions: sessions.map((s) => ({
          id: s.id,
          groupId: s.groupId,
          messageCount: s.messages.length,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          lastMessage: s.messages.length > 0 ? s.messages[s.messages.length - 1].content : null,
        })),
        count: sessions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /chat/sessions/:sessionId
 * Get full chat session with all messages
 */
router.get('/sessions/:sessionId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId!;

    const session = await firebaseService.getChatSession(userId, sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Chat session not found',
          statusCode: 404,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: session.id,
        groupId: session.groupId,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /chat/health
 * Check if Ollama AI service is available
 */
router.get('/health', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isHealthy = await ollamaAIService.healthCheck();

    if (isHealthy) {
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          message: 'Ollama AI service is available',
        },
      });
    } else {
      res.status(503).json({
        success: false,
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'Ollama AI service is not available',
          statusCode: 503,
        },
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'AI_SERVICE_ERROR',
        message: 'Error checking AI service health',
        statusCode: 503,
      },
    });
  }
});

export default router;
