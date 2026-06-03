// packages/backend/src/services/AIAssistantService.ts
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../config/firebase';
import { ChatSession, ChatMessage, Group, User, Contribution } from '@circufi/shared';
import { v4 as uuidv4 } from 'uuid';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export class AIAssistantService {
  
  static async processMessage(
    userId: string,
    groupId: string,
    message: string,
    sessionId?: string
  ): Promise<{ sessionId: string; messages: ChatMessage[]; context: any }> {
    
    // Get or create session
    let session: ChatSession;
    if (sessionId) {
      const sessionDoc = await db.collection('chatSessions').doc(sessionId).get();
      if (sessionDoc.exists) {
        session = { id: sessionDoc.id, ...sessionDoc.data() } as ChatSession;
      } else {
        session = await this.createSession(userId, groupId);
      }
    } else {
      session = await this.createSession(userId, groupId);
    }
    
    // Get context data
    const context = await this.getChatContext(userId, groupId);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    session.messages.push(userMessage);
    
    // Get AI response
    const aiResponse = await this.getAIResponse(message, context, session.messages);
    
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    };
    
    session.messages.push(assistantMessage);
    session.updatedAt = Date.now();
    session.context = context;
    
    // Save session
    await db.collection('chatSessions').doc(session.id).set(session);
    
    return {
      sessionId: session.id,
      messages: session.messages,
      context
    };
  }
  
  private static async createSession(userId: string, groupId: string): Promise<ChatSession> {
    const sessionId = uuidv4();
    const now = Date.now();
    const context = await this.getChatContext(userId, groupId);
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      groupId,
      messages: [],
      context,
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('chatSessions').doc(sessionId).set(session);
    return session;
  }
  
  private static async getChatContext(userId: string, groupId: string) {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data() as User;
    
    // Get group data
    const groupDoc = await db.collection('groups').doc(groupId).get();
    const group = groupDoc.data() as Group;
    
    // Get user's payment status
    const userContributions = await db.collection('contributions')
      .where('groupId', '==', groupId)
      .where('paidBy.userId', '==', userId)
      .get();
    
    const lastContribution = userContributions.docs
      .map(doc => doc.data() as Contribution)
      .sort((a, b) => b.scheduledDate - a.scheduledDate)[0];
    
    return {
      currentBeneficiary: group.rotation.currentBeneficiary,
      nextPaymentDate: group.rules.nextPaymentDate,
      myPaymentStatus: lastContribution?.status || 'pending',
      myTrustScore: user.reputation?.trustScore || 50,
      groupHealthScore: group.stats.healthScore
    };
  }
  
  private static async getAIResponse(
    message: string,
    context: any,
    history: ChatMessage[]
  ): Promise<string> {
    const systemPrompt = `You are CircuFi Assistant, an AI helper for cooperative savings groups (Osusu, Ajo, Esusu). 
    
Current Context:
- User's Trust Score: ${context.myTrustScore}/100
- Group Health Score: ${context.groupHealthScore}/100
- Current Beneficiary: ${context.currentBeneficiary}
- Next Payment Date: ${new Date(context.nextPaymentDate).toLocaleDateString()}
- User's Payment Status: ${context.myPaymentStatus}

Your role:
1. Explain trust scores and group health in simple terms
2. Answer questions about contributions and payouts
3. Provide trust and reliability insights about members
4. Help users understand group rules and rotation

Guidelines:
- Keep responses concise and friendly (max 150 words)
- Use simple language suitable for all education levels
- Never give financial advice beyond explaining group mechanics
- If asked about specific members, explain you can only share general reputation info
- Be supportive and encouraging about saving habits
- Respond in the same language as the user's question

Remember: You're helping build trust in cooperative finance. Be helpful, accurate, and transparent.`;

    const messages = [
      { role: 'user', content: message }
    ];
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages as any
      });
      
      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      return "I understand you're asking about your savings group. Could you please rephrase your question? I'm here to help with trust scores, contributions, and group health.";
    } catch (error) {
      console.error('Claude API error:', error);
      return this.getFallbackResponse(message, context);
    }
  }
  
  private static getFallbackResponse(message: string, context: any): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('trust') || lowerMessage.includes('reliable')) {
      return `Your current trust score is ${context.myTrustScore}/100. This is based on your payment history, timeliness, and group participation. A score above 70 is considered good. Keep making on-time payments to improve your score!`;
    }
    
    if (lowerMessage.includes('payout') || lowerMessage.includes('receive')) {
      return `Based on the current rotation, the next payout goes to ${context.currentBeneficiary}. Your position in the rotation depends on when you joined and the group's payout order. You can check the full rotation list in the group dashboard.`;
    }
    
    if (lowerMessage.includes('health') || lowerMessage.includes('group status')) {
      return `Your group's health score is ${context.groupHealthScore}/100. ${context.groupHealthScore >= 70 ? "This is great! The group is very healthy." : context.groupHealthScore >= 50 ? "The group is doing okay but could improve." : "The group needs attention to improve reliability."} Keep encouraging members to pay on time!`;
    }
    
    if (lowerMessage.includes('payment') || lowerMessage.includes('contribute')) {
      return `Your next payment is due on ${new Date(context.nextPaymentDate).toLocaleDateString()}. Current payment status: ${context.myPaymentStatus}. Remember that on-time payments boost your trust score!`;
    }
    
    return "I'm here to help with your savings group! You can ask me about trust scores, payment schedules, group health, or how the rotation works. What would you like to know?";
  }
}