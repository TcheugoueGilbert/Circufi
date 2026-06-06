import type { Circle, User, ContributionEvent, ReputationEvent, Notification } from '@/types'

export const DEMO_USER: User = {
    id: 'user-adaeze',
    name: 'Adaeze Okonkwo',
    phone: '+234 812 345 6789',
    createdAt: new Date('2025-03-01'),
    contributionHistory: [],
    circlesCompleted: 2,
    onTimePayments: 23,
    totalPayments: 24,
    flags: [],
}

export const DEMO_CIRCLES: Circle[] = [
    {
        id: 'circle-ikeja',
        name: 'Ikeja Market Women',
        adminId: 'user-mama-chisom',
        adminName: 'Mama Chisom',
        contributionAmount: 25000,
        frequency: 'monthly',
        currentRound: 5,
        totalRounds: 8,
        status: 'active',
        startDate: new Date('2025-09-01'),
        createdAt: new Date('2025-08-20'),
        inviteCode: 'OSU-4X7K',
        healthScore: 92,
        members: [
            { userId: 'u1', name: 'Funke Coker',    phone: '+234 801 111 0001', rotationOrder: 1, joinedAt: new Date('2025-08-20'), contributionHistory: [], onTimeRate: 100, totalPayments: 5, flags: [], hasPaidCurrentRound: true  },
            { userId: 'u2', name: 'Ngozi Kalu',      phone: '+234 802 111 0002', rotationOrder: 2, joinedAt: new Date('2025-08-20'), contributionHistory: [], onTimeRate: 100, totalPayments: 5, flags: [], hasPaidCurrentRound: true  },
            { userId: 'u3', name: 'Mama Chisom',     phone: '+234 803 111 0003', rotationOrder: 3, joinedAt: new Date('2025-08-20'), contributionHistory: [], onTimeRate: 100, totalPayments: 5, flags: [], hasPaidCurrentRound: false },
            { userId: 'user-adaeze', name: 'Adaeze Okonkwo', phone: '+234 812 345 6789', rotationOrder: 4, joinedAt: new Date('2025-08-20'), contributionHistory: [], onTimeRate: 96, totalPayments: 5, flags: [], hasPaidCurrentRound: false },
            { userId: 'u5', name: 'Fatima Nwosu',    phone: '+234 805 111 0005', rotationOrder: 5, joinedAt: new Date('2025-08-20'), contributionHistory: [], onTimeRate: 80, totalPayments: 4, flags: [], hasPaidCurrentRound: false },
            { userId: 'u6', name: 'Ibrahim Salami',  phone: '+234 806 111 0006', rotationOrder: 6, joinedAt: new Date('2025-08-20'), contributionHistory: [], onTimeRate: 75, totalPayments: 4, flags: [], hasPaidCurrentRound: false },
            { userId: 'u7', name: 'Chidinma Eze',    phone: '+234 807 111 0007', rotationOrder: 7, joinedAt: new Date('2025-08-20'), contributionHistory: [], onTimeRate: 95, totalPayments: 5, flags: [], hasPaidCurrentRound: false },
            { userId: 'u8', name: 'Emeka Obi',       phone: '+234 808 111 0008', rotationOrder: 8, joinedAt: new Date('2025-08-20'), contributionHistory: [], onTimeRate: 60, totalPayments: 3, flags: [], hasPaidCurrentRound: false },
        ],
    },
    {
        id: 'circle-campus',
        name: 'CampusSave Unilag',
        adminId: 'u-tunde',
        adminName: 'Tunde B.',
        contributionAmount: 10000,
        frequency: 'weekly',
        currentRound: 9,
        totalRounds: 12,
        status: 'active',
        startDate: new Date('2025-10-01'),
        createdAt: new Date('2025-09-25'),
        inviteCode: 'CSU-9MKP',
        healthScore: 78,
        members: [
            { userId: 'user-adaeze', name: 'Adaeze Okonkwo', phone: '+234 812 345 6789', rotationOrder: 2, joinedAt: new Date('2025-09-25'), contributionHistory: [], onTimeRate: 96, totalPayments: 9, flags: [], hasPaidCurrentRound: true },
            { userId: 'ut', name: 'Tunde B.', phone: '+234 810 222 0001', rotationOrder: 1, joinedAt: new Date('2025-09-25'), contributionHistory: [], onTimeRate: 88, totalPayments: 9, flags: [], hasPaidCurrentRound: true },
        ],
    },
]

export const DEMO_ACTIVITY: ContributionEvent[] = [
    {
        id: 'ev-1', circleId: 'circle-ikeja', circleName: 'Ikeja Market Women',
        memberId: 'user-adaeze', memberName: 'Adaeze Okonkwo',
        beneficiaryId: 'u3', beneficiaryName: 'Mama Chisom',
        amount: 25000, scheduledDate: new Date('2026-06-02'), paidDate: new Date('2026-06-02'),
        status: 'on-time', paymentMethod: 'bank-transfer', reference: 'TRF/2026/0602/91823',
        createdAt: new Date('2026-06-02T09:14:00'), onChainTxHash: '0x7f3a...b4c2',
    },
    {
        id: 'ev-2', circleId: 'circle-campus', circleName: 'CampusSave Unilag',
        memberId: 'user-adaeze', memberName: 'Adaeze Okonkwo',
        beneficiaryId: 'u-kelechi', beneficiaryName: 'Kelechi A.',
        amount: 120000, scheduledDate: new Date('2026-05-28'), paidDate: new Date('2026-05-28'),
        status: 'on-time', paymentMethod: 'bank-transfer',
        createdAt: new Date('2026-05-28T14:00:00'), onChainTxHash: '0x2e1b...a7f9',
    },
    {
        id: 'ev-3', circleId: 'circle-campus', circleName: 'CampusSave Unilag',
        memberId: 'u-kelechi', memberName: 'Kelechi A.',
        beneficiaryId: 'u3', beneficiaryName: 'Mama Chisom',
        amount: 10000, scheduledDate: new Date('2026-05-22'), paidDate: new Date('2026-05-25'),
        status: 'late', paymentMethod: 'mobile-money',
        createdAt: new Date('2026-05-25T16:32:00'),
    },
]

export const DEMO_REPUTATION: ReputationEvent[] = [
    { id: 'r1', type: 'on-time',         description: 'On-time payment',       circleName: 'Ikeja Market Women', scoreDelta: 2,  createdAt: new Date('2026-06-02') },
    { id: 'r2', type: 'circle-complete', description: 'Circle completed',      circleName: 'Abuja Traders',      scoreDelta: 5,  createdAt: new Date('2026-05-15') },
    { id: 'r3', type: 'late',            description: 'Late payment (2 days)', circleName: 'CampusSave Unilag',  scoreDelta: -3, createdAt: new Date('2026-04-03') },
    { id: 'r4', type: 'on-time',         description: 'On-time payment',       circleName: 'CampusSave Unilag',  scoreDelta: 2,  createdAt: new Date('2026-03-20') },
    { id: 'r5', type: 'verified',        description: 'Account verified',      circleName: '',                   scoreDelta: 5,  createdAt: new Date('2026-03-01') },
]

export const DEMO_NOTIFICATIONS: Notification[] = [
    { id: 'n1', type: 'payment-due',      title: 'Payment due in 2 days',             body: '₦25,000 due Jun 7 — Ikeja Market Women',        circleName: 'Ikeja Market Women', read: false, createdAt: new Date('2026-06-05') },
    { id: 'n2', type: 'payment-verified', title: 'Mama Chisom confirmed your payment', body: '₦25,000 verified for Round 5',                  circleName: 'Ikeja Market Women', read: false, createdAt: new Date('2026-06-02') },
    { id: 'n3', type: 'payout-next',      title: "You're next to receive!",            body: 'You receive ₦200,000 in Round 6',               circleName: 'Ikeja Market Women', read: true,  createdAt: new Date('2026-06-01') },
    { id: 'n4', type: 'late-flag',        title: 'Late payment in your circle',        body: 'Fatima N. is 3 days late — Ikeja Market Women', circleName: 'Ikeja Market Women', read: true,  createdAt: new Date('2026-05-28') },
    { id: 'n5', type: 'member-joined',    title: 'New member joined',                  body: 'Emeka Obi joined CampusSave Unilag',            circleName: 'CampusSave Unilag',  read: true,  createdAt: new Date('2026-05-20') },
]

export const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`
export const formatDate  = (d: Date)   => d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
export const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()