"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_FREQUENCIES = exports.CURRENCIES = exports.DEFAULT_TRUST_SCORE = exports.GROUP_HEALTH_CONFIG = exports.REPUTATION_EVENT_IMPACTS = exports.TRUST_SCORE_CONFIG = void 0;
// packages/shared/src/constants/index.ts
exports.TRUST_SCORE_CONFIG = {
    weights: {
        completionRate: 0.40,
        onTimeRate: 0.35,
        membershipDuration: 0.15,
        penalty: 0.10
    },
    riskCategories: {
        excellent: { min: 90, max: 100, label: 'Excellent' },
        good: { min: 80, max: 89, label: 'Good' },
        fair: { min: 70, max: 79, label: 'Fair' },
        risky: { min: 60, max: 69, label: 'Risky' },
        highRisk: { min: 0, max: 59, label: 'High Risk' }
    }
};
exports.REPUTATION_EVENT_IMPACTS = {
    payment_on_time: 5,
    payment_late: -2,
    payment_missed: -10,
    dispute_resolved: 3,
    verified: 2,
    flagged: -5
};
exports.GROUP_HEALTH_CONFIG = {
    riskThresholds: {
        low: 70,
        medium: 50,
        high: 0
    }
};
exports.DEFAULT_TRUST_SCORE = 50;
exports.CURRENCIES = ['NGN', 'KES', 'GHS', 'UGX', 'USD'];
exports.PAYMENT_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly'];
