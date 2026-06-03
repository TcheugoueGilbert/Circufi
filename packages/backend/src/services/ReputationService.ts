// packages/backend/src/services/ReputationService.ts
import { db } from '../config/firebase';
import { 
  User, Reputation, ReputationEvent, Contribution,
  calculateTrustScore, calculateMembershipDurationScore,
  calculatePenaltyScore, calculateOnTimeRate, calculateCompletionRate
} from '@circufi/shared';
import { v4 as uuidv4 } from 'uuid';

export class ReputationService {
  
  static async calculateUserReputation(userId: string, groupId?: string): Promise<Reputation> {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    const user = userDoc.data() as User;
    
    // Get contributions
    let contributionsQuery = db.collection('contributions')
      .where('paidBy.userId', '==', userId);
    
    if (groupId) {
      contributionsQuery = contributionsQuery.where('groupId', '==', groupId);
    }
    
    const contributionsSnapshot = await contributionsQuery.get();
    const contributions = contributionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution));
    
    // Calculate metrics
    const totalExpected = contributions.length;
    const actualPayments = contributions.filter(c => c.status === 'completed').length;
    const onTimePayments = contributions.filter(c => c.isOnTime && c.status === 'completed').length;
    
    const completionRate = calculateCompletionRate(totalExpected, actualPayments);
    const onTimeRate = calculateOnTimeRate(actualPayments, onTimePayments);
    const membershipDurationScore = calculateMembershipDurationScore(user.joinedAt, Date.now());
    
    const missedPayments = contributions.filter(c => c.status === 'failed').length;
    const latePayments = contributions.filter(c => !c.isOnTime && c.status === 'completed').length;
    const penaltyScore = calculatePenaltyScore(user.reputation?.flags || [], missedPayments, latePayments);
    
    const trustScore = calculateTrustScore(completionRate, onTimeRate, membershipDurationScore, penaltyScore);
    
    return {
      totalPayments: actualPayments,
      onTimeRate,
      totalDisbursed: user.reputation?.totalDisbursed || 0,
      trustScore,
      flags: user.reputation?.flags || [],
      completionRate,
      membershipDurationScore,
      penaltyScore
    };
  }
  
  static async updateReputationFromContribution(
    contribution: Contribution, 
    oldStatus?: string
  ): Promise<void> {
    const userId = contribution.paidBy.userId;
    const groupId = contribution.groupId;
    
    // Get current reputation
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data() as User;
    
    // Determine event type based on status change
    let eventType: ReputationEvent['eventType'] = 'payment_on_time';
    let impact = 0;
    
    if (contribution.status === 'completed') {
      if (contribution.isOnTime) {
        eventType = 'payment_on_time';
        impact = 5;
      } else {
        eventType = 'payment_late';
        impact = -2;
      }
    } else if (contribution.status === 'failed') {
      eventType = 'payment_missed';
      impact = -10;
    }
    
    // Update flags
    const flags = [...(user.reputation?.flags || [])];
    if (!contribution.isOnTime && contribution.status === 'completed') {
      const lateDays = Math.floor((contribution.actualDate - contribution.scheduledDate) / (1000 * 60 * 60 * 24));
      if (!flags.includes(`late_by_${lateDays}_days`)) {
        flags.push(`late_by_${lateDays}_days`);
      }
    }
    
    // Recalculate full reputation
    const newReputation = await this.calculateUserReputation(userId);
    
    // Create reputation event
    const event: ReputationEvent = {
      id: uuidv4(),
      userId,
      groupId,
      eventType,
      impact,
      reason: `Contribution ${contribution.status} - ${contribution.isOnTime ? 'on time' : 'late'}`,
      oldScore: user.reputation?.trustScore,
      newScore: newReputation.trustScore,
      timestamp: Date.now()
    };
    
    // Save updates
    await db.collection('users').doc(userId).update({
      reputation: newReputation,
      lastActive: Date.now()
    });
    
    await db.collection('reputationEvents').doc(event.id).set(event);
    
    // Update group health score
    await this.updateGroupHealthScore(groupId);
  }
  
  static async updateGroupHealthScore(groupId: string): Promise<void> {
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) return;
    
    const group = groupDoc.data();
    const members = Object.keys(group.members);
    
    // Get all member reputations
    let totalTrustScore = 0;
    let totalMembers = 0;
    
    for (const memberId of members) {
      const userDoc = await db.collection('users').doc(memberId).get();
      if (userDoc.exists) {
        const user = userDoc.data() as User;
        totalTrustScore += user.reputation?.trustScore || 50;
        totalMembers++;
      }
    }
    
    const averageTrustScore = totalMembers > 0 ? totalTrustScore / totalMembers : 0;
    
    // Calculate payment completion rate
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', groupId)
      .get();
    
    const contributions = contributionsSnapshot.docs.map(doc => doc.data() as Contribution);
    const expectedContributions = members.length * (group.rotation.completedCycles + 1);
    const actualContributions = contributions.filter(c => c.status === 'completed').length;
    const paymentCompletionRate = expectedContributions > 0 ? (actualContributions / expectedContributions) * 100 : 100;
    
    const healthScore = (averageTrustScore * 0.6) + (paymentCompletionRate * 0.4);
    
    await db.collection('groups').doc(groupId).update({
      'stats.healthScore': healthScore,
      'stats.memberAverageTrustScore': averageTrustScore,
      'stats.paymentCompletionRate': paymentCompletionRate,
      updatedAt: Date.now()
    });
  }
  
  static async getReputationEvents(userId: string, limit = 20): Promise<ReputationEvent[]> {
    const eventsSnapshot = await db.collection('reputationEvents')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReputationEvent));
  }
}