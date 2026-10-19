/**
 * Server entry point
 */

import 'dotenv/config';
import app from './app';
import { ollamaAIService } from './services/ollamaAIService';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              CircuFi - Backend Server Started            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server is running on port ${PORT}
📡 Environment: ${NODE_ENV}
🔗 Base URL: http://localhost:${PORT}/api/v1

✅ Available Endpoints:
  - POST   /api/v1/auth/register          - Register new user
  - POST   /api/v1/auth/verify            - Verify phone with OTP
  - POST   /api/v1/auth/resend            - Resend verification code
  - GET    /api/v1/users/:userId          - Get user profile
  - PUT    /api/v1/users/:userId          - Update user profile
  - POST   /api/v1/groups                 - Create new group
  - GET    /api/v1/groups                 - List user's groups
  - GET    /api/v1/groups/:groupId        - Get group details
  - PUT    /api/v1/groups/:groupId        - Update group
  - POST   /api/v1/groups/:groupId/members         - Add member (admin)
  - POST   /api/v1/groups/:groupId/join            - Join a circle
  - GET    /api/v1/groups/:groupId/members         - List members
  - GET    /api/v1/groups/code/:code               - Look up circle by invite code
  - POST   /api/v1/groups/:groupId/rotation/advance - Advance rotation (admin)
  - DELETE /api/v1/groups/:groupId/members/:userId - Remove member
  - GET    /api/v1/groups/:groupId/health          - Group health score
  - GET    /api/v1/groups/:groupId/rotation        - Rotation details
  - POST   /api/v1/contributions                    - Log contribution
  - GET    /api/v1/contributions/:groupId           - Get contributions
  - PUT    /api/v1/contributions/:id                - Update contribution
  - POST   /api/v1/contributions/:id/verify         - Verify contribution
  - GET    /api/v1/reputation/:userId               - Get reputation
  - GET    /api/v1/reputation/:userId/events        - Get reputation events
  - GET    /api/v1/notifications/:userId            - List notifications
  - PUT    /api/v1/notifications/:userId/mark-read  - Mark notifications as read
  - POST   /api/v1/chat/message                      - Send chat message
  - GET    /api/v1/chat/sessions                     - List chat sessions
  - GET    /api/v1/chat/sessions/:id                 - Get chat session
  - GET    /api/v1/chat/health                       - Check AI service

🔌 AI Integration:
  - LLM Provider: Ollama (${process.env.OLLAMA_MODEL || 'mistral'})
  - API URL: ${process.env.OLLAMA_API_URL || 'http://localhost:11434'}
  
  `);

  // Check Ollama connection
  setTimeout(async () => {
    try {
      const isHealthy = await ollamaAIService.healthCheck();
      if (isHealthy) {
        console.log('✅ Ollama AI service is healthy');
        const models = await ollamaAIService.getAvailableModels();
        console.log(`📚 Available models: ${models.join(', ')}`);
      } else {
        console.warn('⚠️  Ollama AI service is not available yet');
        console.warn('   Make sure Ollama is running: ollama serve');
      }
    } catch (error) {
      console.warn('⚠️  Could not connect to Ollama');
      console.warn('   To use AI features, start Ollama with: ollama serve');
    }
  }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default server;
