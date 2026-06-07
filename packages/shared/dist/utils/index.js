"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTrustScore = calculateTrustScore;
exports.calculateMembershipDurationScore = calculateMembershipDurationScore;
exports.calculatePenaltyScore = calculatePenaltyScore;
exports.calculateOnTimeRate = calculateOnTimeRate;
exports.calculateCompletionRate = calculateCompletionRate;
exports.getRiskCategory = getRiskCategory;
exports.calculateGroupHealthScore = calculateGroupHealthScore;
exports.getGroupRiskLevel = getGroupRiskLevel;
exports.calculateReputationFromUser = calculateReputationFromUser;
// packages/shared/src/utils/index.ts
const constants_1 = require("../constants");
function calculateTrustScore(completionRate, onTimeRate, membershipDurationScore, penaltyScore) {
    const weights = constants_1.TRUST_SCORE_CONFIG.weights;
    let score = (completionRate * weights.completionRate) +
        (onTimeRate * weights.onTimeRate) +
        (membershipDurationScore * weights.membershipDuration) +
        (penaltyScore * weights.penalty);
    return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}
function calculateMembershipDurationScore(joinedAt, currentTime) {
    const daysAsMember = (currentTime - joinedAt) / (1000 * 60 * 60 * 24);
    if (daysAsMember >= 365)
        return 100;
    if (daysAsMember >= 180)
        return 80;
    if (daysAsMember >= 90)
        return 60;
    if (daysAsMember >= 30)
        return 40;
    if (daysAsMember >= 7)
        return 20;
    return 10;
}
function calculatePenaltyScore(flags, missedPayments, latePayments) {
    let penalty = 100;
    // Each missed payment reduces score significantly
    penalty -= missedPayments * 15;
    // Each late payment reduces score
    penalty -= latePayments * 5;
    // Additional flags reduce score
    penalty -= flags.length * 3;
    return Math.max(0, Math.min(100, penalty));
}
function calculateOnTimeRate(totalPayments, onTimePayments) {
    if (totalPayments === 0)
        return 100;
    return (onTimePayments / totalPayments) * 100;
}
function calculateCompletionRate(expectedPayments, actualPayments) {
    if (expectedPayments === 0)
        return 100;
    return (actualPayments / expectedPayments) * 100;
}
function getRiskCategory(trustScore) {
    const categories = constants_1.TRUST_SCORE_CONFIG.riskCategories;
    if (trustScore >= categories.excellent.min)
        return categories.excellent.label;
    if (trustScore >= categories.good.min)
        return categories.good.label;
    if (trustScore >= categories.fair.min)
        return categories.fair.label;
    if (trustScore >= categories.risky.min)
        return categories.risky.label;
    return categories.highRisk.label;
}
function calculateGroupHealthScore(averageTrustScore, paymentCompletionRate) {
    return (averageTrustScore * 0.6) + (paymentCompletionRate * 0.4);
}
function getGroupRiskLevel(healthScore) {
    if (healthScore >= 70)
        return 'low';
    if (healthScore >= 50)
        return 'medium';
    return 'high';
}
function calculateReputationFromUser(user, contributions) {
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
