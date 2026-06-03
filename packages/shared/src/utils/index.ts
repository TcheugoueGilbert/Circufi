// packages/shared/src/utils/index.ts
import { TRUST_SCORE_CONFIG, REPUTATION_EVENT_IMPACTS, DEFAULT_TRUST_SCORE } from '../constants';
import { Reputation, TrustScoreComponents, User } from '../types';

export function calculateTrustScore(
  completionRate: number,
  onTimeRate: number,
  membershipDurationScore: number,
  penaltyScore: number
): number {
  const weights = TRUST_SCORE_CONFIG.weights;
  
  let score = 
    (completionRate * weights.completionRate) +
    (onTimeRate * weights.onTimeRate) +
    (membershipDurationScore * weights.membershipDuration) +
    (penaltyScore * weights.penalty);
  
  return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}

export function calculateMembershipDurationScore(joinedAt: number, currentTime: number): number {
  const daysAsMember = (currentTime - joinedAt) / (1000 * 60 * 60 * 24);
  
  if (daysAsMember >= 365) return 100;
  if (daysAsMember >= 180) return 80;
  if (daysAsMember >= 90) return 60;
  if (daysAsMember >= 30) return 40;
  if (daysAsMember >= 7) return 20;
  return 10;
}

export function calculatePenaltyScore(flags: string[], missedPayments: number, latePayments: number): number {
  let penalty = 100;
  
  // Each missed payment reduces score significantly
  penalty -= missedPayments * 15;
  
  // Each late payment reduces score
  penalty -= latePayments * 5;
  
  // Additional flags reduce score
  penalty -= flags.length * 3;
  
  return Math.max(0, Math.min(100, penalty));
}

export function calculateOnTimeRate(totalPayments: number, onTimePayments: number): number {
  if (totalPayments === 0) return 100;
  return (onTimePayments / totalPayments) * 100;
}

export function calculateCompletionRate(expectedPayments: number, actualPayments: number): number {
  if (expectedPayments === 0) return 100;
  return (actualPayments / expectedPayments) * 100;
}

export function getRiskCategory(trustScore: number): string {
  const categories = TRUST_SCORE_CONFIG.riskCategories;
  if (trustScore >= categories.excellent.min) return categories.excellent.label;
  if (trustScore >= categories.good.min) return categories.good.label;
  if (trustScore >= categories.fair.min) return categories.fair.label;
  if (trustScore >= categories.risky.min) return categories.risky.label;
  return categories.highRisk.label;
}

export function calculateGroupHealthScore(
  averageTrustScore: number,
  paymentCompletionRate: number
): number {
  return (averageTrustScore * 0.6) + (paymentCompletionRate * 0.4);
}

export function getGroupRiskLevel(healthScore: number): 'low' | 'medium' | 'high' {
  if (healthScore >= 70) return 'low';
  if (healthScore >= 50) return 'medium';
  return 'high';
}

export function calculateReputationFromUser(user: User, contributions: any[]): Reputation {
  const userContributions = contributions.filter(c => c.paidBy.userId === user.id);
  const totalExpected = contributions.length;
  const actualPayments = userContributions.filter(c => c.status === 'completed').length;
  const onTimePayments = userContributions.filter(c => c.isOnTime && c.status === 'completed').length;
  
  const completionRate = calculateCompletionRate(totalExpected, actualPayments);
  const onTimeRate = calculateOnTimeRate(actualPayments, onTimePayments);
  const membershipDurationScore = calculateMembershipDurationScore(user.joinedAt, Date.now());
  
  const missedPayments = userContributions.filter(c => c.status === 'failed').length;
  const latePayments = userContributions.filter(c => !c.isOnTime && c.status === 'completed').length;
  const penaltyScore = calculatePenaltyScore(user.reputation?.flags || [], missedPayments, latePayments);
  
  const trustScore = calculateTrustScore(completionRate, onTimeRate, membershipDurationScore, penaltyScore);
  
  return {
    totalPayments: actualPayments,
    onTimeRate,
    totalDisbursed: 0,
    trustScore,
    flags: user.reputation?.flags || [],
    completionRate,
    membershipDurationScore,
    penaltyScore
  };
}