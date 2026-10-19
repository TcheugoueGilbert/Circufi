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

  /**
   * Detailed health metrics for the circle health page / dashboard.
   */
  async getGroupHealthDetails(group: Group) {
    const activeIds = Object.keys(group.members).filter((id) => group.members[id].status === 'active');
    const users = (await Promise.all(activeIds.map((id) => firebaseService.getUser(id)))).filter(
      (u): u is User => u !== null
    );

    const contributions = await firebaseService.getGroupContributions(group.id);
    const completed = contributions.filter((c) => c.status === 'completed');
    const onTimeCount = completed.filter((c) => c.isOnTime).length;

    const healthScore = await this.calculateGroupHealthScore(group);
    const averageTrustScore =
      users.length === 0
        ? 0
        : Math.round(users.reduce((sum, u) => sum + this.calculateTrustScore(u), 0) / users.length);
    const paymentCompletionRate =
      contributions.length === 0 ? 100 : Math.round((completed.length / contributions.length) * 100);
    const onTimePaymentRate = completed.length === 0 ? 100 : Math.round((onTimeCount / completed.length) * 100);
    const flaggedMembers = users.filter((u) => u.reputation.flags.length > 0).length;

    // Trend: on-time rate of the last 30 days compared with the 30 days before
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const rate = (from: number, to: number): number | null => {
      const window = completed.filter((c) => c.actualDate >= from && c.actualDate < to);
      return window.length === 0 ? null : window.filter((c) => c.isOnTime).length / window.length;
    };
    const recent = rate(now - 30 * DAY, now + DAY);
    const previous = rate(now - 60 * DAY, now - 30 * DAY);
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recent !== null && previous !== null) {
      if (recent - previous > 0.05) trend = 'improving';
      else if (previous - recent > 0.05) trend = 'declining';
    }

    const riskFlags = await this.getGroupRiskFlags(group.id);
    const recommendations: string[] = [];
    if (onTimePaymentRate < 80) recommendations.push('Send a reminder a few days before each due date to lift the on-time rate.');
    if (flaggedMembers > 0) recommendations.push(`${flaggedMembers} member(s) carry reputation flags - review their payment history.`);
    if (riskFlags.includes('multiple_low_trust_members')) recommendations.push('Several members have a low trust score; consider raising the minimum trust score for new members.');
    if (riskFlags.includes('admin_missing_cycles')) recommendations.push('The admin has missed contributions in recent cycles.');
    if (contributions.some((c) => c.status === 'pending')) recommendations.push('Some contributions are still waiting for admin confirmation.');
    if (recommendations.length === 0) recommendations.push('Everything looks healthy. Keep confirming payments promptly.');

    return {
      groupId: group.id,
      groupName: group.name,
      healthScore,
      averageTrustScore,
      paymentCompletionRate,
      totalMembers: Object.keys(group.members).length,
      activeMembers: users.length,
      totalCollected: completed.reduce((sum, c) => sum + c.amount, 0),
      totalDisbursed: group.stats.totalDisbursed,
      onTimePaymentRate,
      latePayments: completed.length - onTimeCount,
      missedPayments: contributions.filter((c) => c.status === 'failed').length,
      flaggedMembers,
      trend,
      recommendations,
      riskFlags,
    };
  }

  /**
   * Persist the derived group statistics (collected total + health score) after a payment is confirmed.
   */
  async refreshGroupStats(groupId: string): Promise<void> {
    const group = await firebaseService.getGroup(groupId);
    if (!group) return;

    const contributions = await firebaseService.getGroupContributions(groupId);
    const totalCollected = contributions
      .filter((c) => c.status === 'completed')
      .reduce((sum, c) => sum + c.amount, 0);
    const healthScore = await this.calculateGroupHealthScore(group);

    await firebaseService.updateGroup(groupId, {
      stats: { ...group.stats, totalCollected, healthScore },
      updatedAt: Date.now(),
    });
  }
}

export const reputationService = new ReputationService();
