/* ─── Core domain types for CircuFi ─────────────────────────────── */

export interface User {
    id: string
    name: string
    phone: string
    createdAt: Date
    contributionHistory: ContributionEvent[]
    circlesCompleted: number
    onTimePayments: number
    totalPayments: number
    flags: string[]
}

export interface Member {
    userId: string
    name: string
    phone: string
    rotationOrder: number
    joinedAt: Date
    contributionHistory: ContributionEvent[]
    onTimeRate: number
    totalPayments: number
    flags: string[]
    hasPaidCurrentRound: boolean
}

export type CircleStatus = 'active' | 'complete' | 'pending' | 'paused'
export type CircleFrequency = 'weekly' | 'biweekly' | 'monthly'

export interface Circle {
    id: string
    name: string
    adminId: string
    adminName: string
    contributionAmount: number
    frequency: CircleFrequency
    currentRound: number
    totalRounds: number
    status: CircleStatus
    startDate: Date
    createdAt: Date
    inviteCode: string
    healthScore: number
    members: Member[]
}

export type PaymentStatus = 'on-time' | 'late' | 'pending' | 'disputed'
export type PaymentMethod = 'bank-transfer' | 'mobile-money' | 'cash'

export interface ContributionEvent {
    id: string
    circleId: string
    circleName: string
    memberId: string
    memberName: string
    beneficiaryId: string
    beneficiaryName: string
    amount: number
    scheduledDate: Date
    paidDate?: Date
    status: PaymentStatus
    paymentMethod: PaymentMethod
    reference?: string
    note?: string
    createdAt: Date
    onChainTxHash?: string
}

export type ReputationEventType =
    | 'on-time'
    | 'late'
    | 'circle-complete'
    | 'flag'
    | 'verified'

export interface ReputationEvent {
    id: string
    type: ReputationEventType
    description: string
    circleName: string
    scoreDelta: number
    createdAt: Date
}

export type NotificationType =
    | 'payment-due'
    | 'payment-verified'
    | 'payout-next'
    | 'late-flag'
    | 'member-joined'

export interface Notification {
    id: string
    type: NotificationType
    title: string
    body: string
    circleName: string
    read: boolean
    createdAt: Date
}