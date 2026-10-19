/**
 * Ollama AI Service
 * Handles AI-powered chat and context-aware responses
 * Uses Ollama as a local LLM provider
 */

import axios, { AxiosInstance } from 'axios';
import { ChatSession, User, Group } from '../types';
import { firebaseService } from './firebaseService';
import { generateId } from '../utils/helpers';

interface OllamaMessage {
  role: 'user' | 'assistant';
  content: string;
}

class OllamaAIService {
  private client: AxiosInstance;
  private modelName: string;
  private temperature: number;

  constructor() {
    const apiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.modelName = process.env.OLLAMA_MODEL || 'mistral';
    this.temperature = parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7');

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10), // local models can be slow
    });
  }

  /**
   * Process a user message and get AI response
   */
  async processMessage(
    userId: string,
    groupId: string,
    message: string,
    sessionId?: string
  ): Promise<ChatSession> {
    // Get or create session
    let session: ChatSession;
    const isNewSession = !sessionId;

    if (sessionId) {
      const existingSession = await firebaseService.getChatSession(userId, sessionId);
      if (!existingSession) {
        throw new Error('SESSION_NOT_FOUND');
      }
      session = existingSession;
    } else {
      session = this.createNewSession(userId, groupId);
    }

    // Get context
    const context = await this.buildContext(userId, groupId);

    // Add user message to session
    session.messages.push({
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    // Generate AI response using Ollama
    const systemPrompt = this.buildSystemPrompt(context);
    const response = await this.generateResponse(systemPrompt, session.messages);

    // Add assistant response to session
    session.messages.push({
      id: generateId(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    });

    // Save the session. A new session must be created in full (groupId, userId, ...),
    // otherwise a partial `update()` would leave an orphan node that cannot be continued.
    session.updatedAt = Date.now();
    session.context = {
      currentBeneficiary: context.currentBeneficiaryName,
      nextPaymentDate: context.nextPaymentDate,
      myPaymentStatus: context.myPaymentStatus,
    };
    if (isNewSession) {
      await firebaseService.createChatSession(userId, session);
    } else {
      await firebaseService.updateChatSession(userId, session.id, {
        messages: session.messages,
        context: session.context,
        updatedAt: session.updatedAt,
      });
    }

    return session;
  }

  /**
   * Generate response using Ollama
   */
  private async generateResponse(
    systemPrompt: string,
    conversationHistory: OllamaMessage[]
  ): Promise<string> {
    try {
      // `conversationHistory` already ends with the user's latest message, so it is
      // not appended a second time. The prompt goes in a real `system` message.
      const recentHistory = conversationHistory.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await this.client.post('/api/chat', {
        model: this.modelName,
        messages: [{ role: 'system', content: systemPrompt }, ...recentHistory],
        options: { temperature: this.temperature },
        stream: false,
      });

      const assistantMessage = response.data.message?.content;

      if (!assistantMessage) {
        throw new Error('No response from Ollama');
      }

      return assistantMessage;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error('AI_SERVICE_ERROR');
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context: any): string {
    return `You are a helpful assistant for CircuFi, a platform for rotating savings circles (ajo / osusu / esusu).

User Information:
- Trust Score: ${context.trustScore}/100
- Total Payments: ${context.totalPayments}
- On-Time Payment Rate: ${context.onTimeRate}%
- Total Disbursed: ${context.totalDisbursed}

Current Group:
- Name: ${context.groupName}
- Current Beneficiary: ${context.currentBeneficiaryName}
- Next Payment Date: ${new Date(context.nextPaymentDate).toLocaleDateString()}
- Your Payment Status: ${context.myPaymentStatus}
- Member Count: ${context.memberCount}
- Group Health Score: ${context.groupHealthScore}/100

Important Guidelines:
1. Provide friendly, clear responses
2. Be specific when answering about payment schedules
3. Do NOT provide financial advice or investment recommendations
4. Do NOT store or share sensitive financial data
5. Always encourage on-time payments and cooperation
6. If asked about untrusted members, focus on facts from their payment history
7. Suggest contacting the group admin for policy or rule changes

Respond naturally to questions about the group, payment status, member reliability, and general guidance.`;
  }

  /**
   * Build context from user and group data
   */
  private async buildContext(
    userId: string,
    groupId: string
  ): Promise<Record<string, any>> {
    const user = await firebaseService.getUser(userId);
    const group = await firebaseService.getGroup(groupId);

    if (!user || !group) {
      throw new Error('USER_OR_GROUP_NOT_FOUND');
    }

    // Get user's payment status
    const userContributions = await firebaseService.getUserContributions(
      groupId,
      userId
    );
    const hasContributedThisCycle = userContributions.some(
      (c) =>
        c.status === 'completed' &&
        c.actualDate > Date.now() - 7 * 24 * 60 * 60 * 1000
    ); // Last 7 days

    const myPaymentStatus = hasContributedThisCycle ? 'Paid' : 'Awaiting payment';

    // Get current beneficiary name
    const currentBeneficiary = await firebaseService.getUser(
      group.rotation.currentBeneficiary
    );

    return {
      trustScore: user.reputation.trustScore,
      totalPayments: user.reputation.totalPayments,
      onTimeRate: user.reputation.onTimeRate,
      totalDisbursed: user.reputation.totalDisbursed,
      groupName: group.name,
      currentBeneficiaryName: currentBeneficiary?.displayName || 'Unknown',
      nextPaymentDate: group.rules.nextPaymentDate,
      myPaymentStatus,
      memberCount: Object.keys(group.members).length,
      groupHealthScore: group.stats.healthScore,
    };
  }

  /**
   * Create a new chat session
   */
  private createNewSession(userId: string, groupId: string): ChatSession {
    return {
      id: generateId(),
      userId,
      groupId,
      messages: [],
      context: {
        currentBeneficiary: '',
        nextPaymentDate: 0,
        myPaymentStatus: '',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Check if Ollama service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      return models.map((m: any) => m.name);
    } catch (error) {
      console.error('Error fetching models from Ollama:', error);
      return [];
    }
  }

  /**
   * Generate response with conversation context
   */
  async chat(userId: string, groupId: string, message: string): Promise<ChatSession> {
    return this.processMessage(userId, groupId, message);
  }

  /**
   * Continue existing chat session
   */
  async continueChat(userId: string, sessionId: string, message: string): Promise<ChatSession> {
    const session = await firebaseService.getChatSession(userId, sessionId);
    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    return this.processMessage(userId, session.groupId, message, sessionId);
  }
}

export const ollamaAIService = new OllamaAIService();
