/* ─── API-shaped domain types for CircuFi (mirror packages/backend/src/types.ts) ─── */

export interface Reputation {
    totalPayments: number
    onTimeRate: number
    totalDisbursed: number
    trustScore: number
    flags?: string[]
}

/** The user returned by POST /auth/verify and kept in the auth store */
export interface AuthUser {
    id: string
    phoneNumber: string
    displayName: string
    email?: string
    verificationStatus?: 'pending' | 'verified' | 'failed'
    reputation?: Reputation
}

export type CircleFrequency = 'weekly' | 'biweekly' | 'monthly'

export interface Circle {
    id: string
    name: string
    description?: string
    inviteCode?: string
    admin: { userId: string; name: string }
    rules: {
        contributionAmount: number
        currency: string
        frequency: CircleFrequency | string
        nextPaymentDate: number
        maxMembers?: number
        minTrustScore?: number
    }
    members: Record<string, { joinedAt: number; status: string; role: string }>
    rotation: {
        cycle: number
        order: string[]
        currentBeneficiary: string
        currentBeneficiaryIndex: number
    }
    stats: {
        totalCollected: number
        totalDisbursed: number
        healthScore: number
        completedCycles: number
    }
}

export interface Contribution {
    id: string
    groupId: string
    groupName?: string
    paidBy: { userId: string; displayName: string }
    currentBeneficiary?: { userId: string; displayName: string }
    amount: number
    currency: string
    paymentMethod?: 'manual' | 'mobile_money' | 'bank_transfer'
    scheduledDate?: number
    actualDate: number
    isOnTime: boolean
    status: 'pending' | 'completed' | 'failed' | 'disputed'
    note?: string
}
