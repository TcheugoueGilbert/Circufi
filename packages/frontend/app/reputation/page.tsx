'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, Star, AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Avatar, SectionTitle } from '@/components/ui/index'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const eventIcon: Record<string, { bg: string; icon: React.ReactNode }> = {
    'payment_on_time':    { bg: 'bg-teal-light',  icon: <Check size={10} className="text-teal-mid" /> },
    'payment_late':       { bg: 'bg-amber-50',    icon: <Clock size={10} className="text-amber-600" /> },
    'payment_missed':     { bg: 'bg-red-50',      icon: <AlertTriangle size={10} className="text-red-500" /> },
    'dispute_resolved':   { bg: 'bg-green-50',    icon: <Star size={10} className="text-green-600" />  },
    'verified':           { bg: 'bg-blue-50',     icon: <Check size={10} className="text-blue-600" />  },
    'flagged':            { bg: 'bg-red-50',      icon: <AlertTriangle size={10} className="text-red-500" /> },
}

interface User {
    id: string
    displayName: string
    joinedAt: number
    reputation: {
        totalPayments: number
        onTimeRate: number
        totalDisbursed: number
        trustScore: number
    }
}

interface ReputationEvent {
    id: string
    eventType: string
    impact: number
    reason: string
    timestamp: number
    groupId?: string
}

export default function ReputationPage() {
    const router = useRouter()
    const { user: authUser } = useAuthStore()
    const [user, setUser] = useState<User | null>(null)
    const [events, setEvents] = useState<ReputationEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authUser) {
            router.push('/auth/login')
            return
        }
        fetchData()
    }, [authUser])

    const fetchData = async () => {
        try {
            const [userRes, eventsRes] = await Promise.all([
                api.get(`/v1/users/${authUser?.id}`),
                api.get(`/v1/reputation/${authUser?.id}`)
            ])

            if (userRes.data.success) {
                setUser(userRes.data.data)
            }
            if (eventsRes.data.success) {
                setEvents(eventsRes.data.data.recentEvents || [])
            }
        } catch (err) {
            console.error('Failed to load reputation:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AppShell>
        )
    }

    if (!user) {
        return (
            <AppShell>
                <p className="text-red-600">Failed to load user data</p>
            </AppShell>
        )
    }

    const onTimePayments = Math.round(user.reputation.totalPayments * (user.reputation.onTimeRate / 100))

    return (
        <AppShell>
            <h1 className="text-xl font-bold text-navy tracking-tight mb-5">My payment record</h1>

            {/* AI summary card */}
            <Card className="mb-4 border-teal/30 bg-teal-light/30">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-navy mb-1">Your record summary</p>
                        <p className="text-sm text-navy leading-relaxed">
                            {user.displayName} has completed {user.reputation.totalPayments} payments,
                            with {onTimePayments} paid on time — a {Math.round(user.reputation.onTimeRate)}% on-time rate.
                            {user.reputation.trustScore >= 90 && ' A strong, consistent payment history.'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Stats card */}
            <Card className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                    <Avatar name={user.displayName} size="xl" />
                    <div>
                        <h2 className="text-base font-bold text-navy">{user.displayName}</h2>
                        <p className="text-xs text-[#8A91A0]">
                            Member since {new Date(user.joinedAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
                        </p>
                        <span className="inline-flex items-center gap-1 bg-teal-light text-teal-dark text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1.5">
              <Check size={10} /> {user.reputation.onTimeRate >= 90 ? 'Reliable member' : 'Active member'}
            </span>
                    </div>
                </div>

                {/* 4 stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total payments',  value: user.reputation.totalPayments },
                        { label: 'On-time rate',    value: `${Math.round(user.reputation.onTimeRate)}%` },
                        { label: 'Trust score',     value: user.reputation.trustScore },
                        { label: 'Payouts received', value: user.reputation.totalDisbursed },
                    ].map((s, i) => (
                        <div key={i} className="bg-[#F7F8FA] rounded-xl p-3 text-center border border-[#E8EAF0]">
                            <p className="text-xl font-bold text-navy">{s.value}</p>
                            <p className="text-[10px] text-[#8A91A0] mt-0.5 leading-tight">{s.label}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Tier legend */}
            <Card className="mb-4">
                <SectionTitle title="Payment tiers" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { label: 'Flagged',  range: 'History of issues',   bg: 'bg-red-50',     text: 'text-red-600'   },
                        { label: 'New',      range: 'Just getting started',bg: 'bg-gray-100',   text: 'text-gray-500'  },
                        { label: 'Good',     range: 'Consistent payer',    bg: 'bg-amber-50',   text: 'text-amber-700' },
                        { label: 'Reliable', range: 'Excellent record',    bg: 'bg-teal-light', text: 'text-teal-dark' },
                    ].map((t, i) => {
                        const isCurrentTier =
                            (user.reputation.onTimeRate >= 90 && t.label === 'Reliable') ||
                            (user.reputation.onTimeRate >= 70 && user.reputation.onTimeRate < 90 && t.label === 'Good') ||
                            (user.reputation.totalPayments < 5 && t.label === 'New')
                        return (
                            <div
                                key={i}
                                className={clsx('rounded-lg p-2.5 text-center', t.bg, isCurrentTier && 'ring-1 ring-teal/30')}
                            >
                                <p className={clsx('text-xs font-bold', t.text)}>{t.label}</p>
                                <p className="text-[9px] text-[#8A91A0] mt-0.5 leading-tight">{t.range}</p>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* History timeline */}
            <Card>
                <SectionTitle title="Payment history" />
                {events.length === 0 ? (
                    <p className="text-sm text-[#8A91A0] text-center py-4">No events yet</p>
                ) : (
                    events.map(event => {
                        const { bg, icon } = eventIcon[event.eventType] ?? eventIcon['verified']
                        const pos = event.impact > 0

                        return (
                            <div key={event.id} className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
                                <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
                                    {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-navy">{event.reason}</p>
                                    <p className="text-[11px] text-[#8A91A0]">
                                        {new Date(event.timestamp).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <span className={clsx(
                                    'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                                    pos ? 'bg-teal-light text-teal-dark' : 'bg-red-50 text-red-600'
                                )}>
                {pos ? '+' : ''}{event.impact}
              </span>
                            </div>
                        )
                    })
                )}
            </Card>
        </AppShell>
    )
}
