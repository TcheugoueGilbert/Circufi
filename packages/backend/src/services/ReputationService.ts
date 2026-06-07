/**
 * Reputation and Trust Scoring Service
 */

import { User, Group, Contribution, ReputationEvent } from '../types';
import { firebaseService } from './firebaseService';
import { generateId } from '../utils/helpers';

class ReputationService {
  /**
   * Calculate trust score for a user
   * Formula: 50 (base) + (onTimeRate * 0.3) + (paymentCount * 2) + (flags * -5)
   */
  calculateTrustScore(user: User): number {
    const { onTimeRate, totalPayments, flags } = user.reputation;

    const onTimePoints = onTimeRate * 0.3;
    const paymentPoints = Math.min(totalPayments, 20) * 2;
    const flagPenalty = flags.length * -5;

    let score = 50 + onTimePoints + paymentPoints + flagPenalty;

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate group health score
   * Formula: (memberAverageTrustScore * 0.6) + (paymentCompletionRate * 0.4)
   */
  async calculateGroupHealthScore(group: Group): Promise<number> {
    const members = Object.keys(group.members).filter(
      (userId) => group.members[userId].status === 'active'
    );

    if (members.length === 0) return 0;

    // Get average trust score of all members
    let totalTrustScore = 0;
    for (const userId of members) {
      const user = await firebaseService.getUser(userId);
      if (user) {
        totalTrustScore += user.reputation.trustScore;
      }
    }
    const memberAverageTrustScore = totalTrustScore / members.length;

    // Calculate payment completion rate
    const contributions = await firebaseService.getGroupContributions(group.id);
    const expectedContributions = members.length * group.stats.completedCycles;
    const completedContributions = contributions.filter(
      (c) => c.status === 'completed'
    ).length;
    const paymentCompletionRate =
      expectedContributions === 0
        ? 100
        : (completedContributions / expectedContributions) * 100;

    const healthScore =
      memberAverageTrustScore * 0.6 + Math.min(paymentCompletionRate, 100) * 0.4;

    return Math.round(healthScore);
  }

  /**
   * Record a reputation event and update user score
   */
  async recordReputationEvent(
    userId: string,
    eventType: ReputationEvent['eventType'],
    reason: string,
    groupId?: string
  ): Promise<void> {
    const user = await firebaseService.getUser(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Determine impact based on event type
    let impact = 0;
    let flagToAdd: string | null = null;

    switch (eventType) {
      case 'payment_on_time':
        impact = 5;
        break;
      case 'payment_late':
        impact = -3;
        flagToAdd = reason; // e.g., "late_by_3_days"
        break;
      case 'payment_missed':
        impact = -10;
        flagToAdd = 'missed_payment';
        break;
      case 'dispute_resolved':
        impact = 2;
        break;
      case 'verified':
        impact = 3;
        break;
      case 'flagged':
        impact = -5;
        flagToAdd = reason;
        break;
      default:
        impact = 0;
    }

    // Create reputation event
    const event: ReputationEvent = {
      id: generateId(),
      userId,
      groupId,
      eventType,
      impact,
      reason,
      timestamp: Date.now(),
    };

    await firebaseService.createReputationEvent(userId, event);

    // Update user reputation
    const updatedReputation = { ...user.reputation };
    updatedReputation.trustScore = this.calculateTrustScore(user);

    if (flagToAdd && !updatedReputation.flags.includes(flagToAdd)) {
      updatedReputation.flags.push(flagToAdd);
    }

    await firebaseService.updateUser(userId, {
      reputation: updatedReputation,
      lastActive: Date.now(),
    });
  }

  /**
   * Update contribution counts when a payment is completed
   */
  async updateContributionMetrics(userId: string, groupId: string): Promise<void> {
    const user = await firebaseService.getUser(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const contributions = await firebaseService.getUserContributions(groupId, userId);
    const completedContributions = contributions.filter(
      (c) => c.status === 'completed'
    );

    if (completedContributions.length === 0) return;

    const onTimeCount = completedContributions.filter((c) => c.isOnTime).length;
    const onTimeRate = (onTimeCount / completedContributions.length) * 100;

    // Check if user received disbursement
    const group = await firebaseService.getGroup(groupId);
    if (!group) return;

    let totalDisbursed = user.reputation.totalDisbursed;
    if (
      group.rotation.currentBeneficiary === userId &&
      completedContributions.length === Object.keys(group.members).length
    ) {
      totalDisbursed++;
    }

    await firebaseService.updateUser(userId, {
      reputation: {
        ...user.reputation,
        totalPayments: completedContributions.length,
        onTimeRate,
        totalDisbursed,
      },
    });
  }

  /**
   * Check if payment is on time
   */
  isPaymentOnTime(scheduledDate: number, actualDate: number): boolean {
    return actualDate <= scheduledDate;
  }

  /**
   * Check if payment is late and return days late
   */
  getDaysLate(scheduledDate: number, actualDate: number): number {
    const daysMs = actualDate - scheduledDate;
    const days = Math.floor(daysMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  /**
   * Get member reliability scores for a group
   */
  async getMemberReliability(
    groupId: string
  ): Promise<Record<string, number>> {
    const group = await firebaseService.getGroup(groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const reliability: Record<string, number> = {};
    const members = Object.keys(group.members).filter(
      (userId) => group.members[userId].status === 'active'
    );

    for (const userId of members) {
      const user = await firebaseService.getUser(userId);
      if (user) {
        reliability[userId] = user.reputation.trustScore;
      }
    }

    return reliability;
  }

  /**
   * Get risk flags for a group
   */
  async getGroupRiskFlags(groupId: string): Promise<string[]> {
    const group = await firebaseService.getGroup(groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const flags: string[] = [];
    const members = Object.keys(group.members).filter(
      (userId) => group.members[userId].status === 'active'
    );

    // Check for high variance in payments
    const contributions = await firebaseService.getGroupContributions(groupId);
    if (contributions.length > 0) {
      const amounts = contributions.map((c) => c.amount);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance =
        amounts.reduce((sum, amount) => sum + Math.pow(amount - avg, 2), 0) /
        amounts.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > avg * 0.2) {
        flags.push('high_variance_in_payments');
      }
    }

    // Check if admin is missing cycles
    const admin = group.members[group.admin.userId];
    if (admin && admin.status === 'active') {
      const adminContributions = await firebaseService.getUserContributions(
        groupId,
        group.admin.userId
      );
      const expectedCycles = group.stats.completedCycles;
      if (adminContributions.length < expectedCycles * 0.8) {
        flags.push('admin_missing_cycles');
      }
    }

    // Check for members with low trust scores
    const lowTrustMembers: string[] = [];
    for (const userId of members) {
      const user = await firebaseService.getUser(userId);
      if (user && user.reputation.trustScore < 50) {
        lowTrustMembers.push(userId);
      }
    }

    if (lowTrustMembers.length > members.length * 0.3) {
      flags.push('multiple_low_trust_members');
    }

    return flags;
  }
}

export const reputationService = new ReputationService();
