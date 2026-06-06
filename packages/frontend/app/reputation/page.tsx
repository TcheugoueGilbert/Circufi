'use client'
import { Check, Clock, Star, AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Avatar, SectionTitle } from '@/components/ui/index'
import { clsx } from 'clsx'
import { DEMO_REPUTATION, DEMO_USER } from '@/lib/data'

const eventIcon: Record<string, { bg: string; icon: React.ReactNode }> = {
    'on-time':       { bg: 'bg-teal-light',  icon: <Check size={10} className="text-teal-mid" /> },
    'circle-complete': { bg: 'bg-green-50', icon: <Star size={10} className="text-green-600" />  },
    'late':          { bg: 'bg-amber-50',    icon: <Clock size={10} className="text-amber-600" /> },
    'flag':          { bg: 'bg-red-50',      icon: <AlertTriangle size={10} className="text-red-500" /> },
    'verified':      { bg: 'bg-blue-50',     icon: <Check size={10} className="text-blue-600" />  },
}

export default function ReputationPage() {
    const user = DEMO_USER

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
                            Adaeze has completed 24 payments across 3 circles, with 23 paid on time — a 96% on-time rate.
                            She has completed 2 full circles with no flags on record. A strong, consistent payment history.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Stats card */}
            <Card className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                    <Avatar name={user.name} size="xl" />
                    <div>
                        <h2 className="text-base font-bold text-navy">{user.name}</h2>
                        <p className="text-xs text-[#8A91A0]">
                            Member since {user.createdAt.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
                        </p>
                        <span className="inline-flex items-center gap-1 bg-teal-light text-teal-dark text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1.5">
              <Check size={10} /> Reliable member
            </span>
                    </div>
                </div>

                {/* 4 stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total payments',  value: user.totalPayments },
                        { label: 'On-time rate',    value: `${Math.round((user.onTimePayments / user.totalPayments) * 100)}%` },
                        { label: 'Circles done',    value: user.circlesCompleted },
                        { label: 'Payouts received',value: 3 },
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
                    ].map((t, i) => (
                        <div
                            key={i}
                            className={clsx('rounded-lg p-2.5 text-center', t.bg, i === 3 && 'ring-1 ring-teal/30')}
                        >
                            <p className={clsx('text-xs font-bold', t.text)}>{t.label}</p>
                            <p className="text-[9px] text-[#8A91A0] mt-0.5 leading-tight">{t.range}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* History timeline */}
            <Card>
                <SectionTitle title="Payment history" />
                {DEMO_REPUTATION.map(event => {
                    const { bg, icon } = eventIcon[event.type] ?? eventIcon['verified']
                    const pos = event.scoreDelta > 0

                    return (
                        <div key={event.id} className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
                            <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
                                {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-navy">{event.description}</p>
                                <p className="text-[11px] text-[#8A91A0]">
                                    {event.circleName && `${event.circleName} · `}
                                    {event.createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <span className={clsx(
                                'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                                pos ? 'bg-teal-light text-teal-dark' : 'bg-red-50 text-red-600'
                            )}>
                {pos ? '+' : ''}{event.scoreDelta}
              </span>
                        </div>
                    )
                })}
            </Card>
        </AppShell>
    )
}