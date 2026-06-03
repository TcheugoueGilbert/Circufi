// packages/shared/src/constants/index.ts
export const TRUST_SCORE_CONFIG = {
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

export const REPUTATION_EVENT_IMPACTS = {
  payment_on_time: 5,
  payment_late: -2,
  payment_missed: -10,
  dispute_resolved: 3,
  verified: 2,
  flagged: -5
};

export const GROUP_HEALTH_CONFIG = {
  riskThresholds: {
    low: 70,
    medium: 50,
    high: 0
  }
};

export const DEFAULT_TRUST_SCORE = 50;

export const CURRENCIES = ['NGN', 'KES', 'GHS', 'UGX', 'USD'] as const;
export const PAYMENT_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly'] as const;