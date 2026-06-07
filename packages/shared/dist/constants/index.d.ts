export declare const TRUST_SCORE_CONFIG: {
    weights: {
        completionRate: number;
        onTimeRate: number;
        membershipDuration: number;
        penalty: number;
    };
    riskCategories: {
        excellent: {
            min: number;
            max: number;
            label: string;
        };
        good: {
            min: number;
            max: number;
            label: string;
        };
        fair: {
            min: number;
            max: number;
            label: string;
        };
        risky: {
            min: number;
            max: number;
            label: string;
        };
        highRisk: {
            min: number;
            max: number;
            label: string;
        };
    };
};
export declare const REPUTATION_EVENT_IMPACTS: {
    payment_on_time: number;
    payment_late: number;
    payment_missed: number;
    dispute_resolved: number;
    verified: number;
    flagged: number;
};
export declare const GROUP_HEALTH_CONFIG: {
    riskThresholds: {
        low: number;
        medium: number;
        high: number;
    };
};
export declare const DEFAULT_TRUST_SCORE = 50;
export declare const CURRENCIES: readonly ["NGN", "KES", "GHS", "UGX", "USD"];
export declare const PAYMENT_FREQUENCIES: readonly ["daily", "weekly", "biweekly", "monthly"];
