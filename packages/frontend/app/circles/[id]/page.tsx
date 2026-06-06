'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, CreditCard, Check, Lock, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Badge, Avatar, ProgressBar, SectionTitle } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import { DEMO_CIRCLES, DEMO_ACTIVITY, formatNaira } from '@/lib/data'

type Tab = 'rotation' | 'members' | 'contributions' | 'audit'

const TABS: { id: Tab; label: string }[] = [
    { id: 'rotation',      label: 'Rotation'      },
    { id: 'members',       label: 'Members'       },
    { id: 'contributions', label: 'Contributions' },
    { id: 'audit',         label: 'Audit trail'   },
]

function RotationRow({ member, position, current, done }: {
    member: typeof DEMO_CIRCLES[0]['members'][0]
    position: number
    current: boolean
    done: boolean
}) {
    const isYou = member.userId === 'user-adaeze'
    return (
        <div className={clsx(
            'flex items-center gap-3 py-3 rounded-lg px-2 -mx-2 transition-colors',
            current && 'bg-teal-light',
            !current && 'border-b border-[#F7F8FA] last:border-0'
        )}>
            <div className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                done    && 'bg-teal-light text-teal-dark',
                current && 'bg-teal text-white',
                !done && !current && 'bg-[#F7F8FA] text-[#8A91A0]'
            )}>
                {position}
            </div>
            <Avatar name={member.name} size="sm" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">
                    {member.name}
                    {isYou && <span className="text-[11px] text-[#8A91A0] ml-1">(you)</span>}
                </p>
                <p className="text-[11px] text-[#8A91A0]">
                    {done    && `Received · Round ${position}`}
                    {current && 'Receiving this round'}
                    {!done && !current && `Round ${position}`}
                </p>
            </div>
            <span className={clsx(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                done    && 'bg-teal-light text-teal-dark',
                current && 'bg-teal text-white',
                !done && !current && 'bg-[#F7F8FA] text-[#8A91A0]'
            )}>
        {done ? '✓ Paid' : current ? 'Active' : 'Waiting'}
      </span>
        </div>
    )
}

function MemberRow({ member, isAdmin }: {
    member: typeof DEMO_CIRCLES[0]['members'][0]
    isAdmin?: boolean
}) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
            <Avatar name={member.name} size="md" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-navy truncate">{member.name}</p>
                    {isAdmin && (
                        <span className="text-[10px] font-semibold text-teal-mid bg-teal-light px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                </div>
                <p className="text-[11px] text-[#8A91A0]">
                    {member.totalPayments} payments · {Math.round(member.onTimeRate)}% on time
                </p>
            </div>
            <div className={clsx(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                member.onTimeRate >= 90 ? 'bg-teal-light text-teal-dark'   :
                    member.onTimeRate >= 70 ? 'bg-amber-50 text-amber-700'     :
                        'bg-gray-100 text-gray-500'
            )}>
                {member.onTimeRate >= 90 ? 'Reliable' : member.onTimeRate >= 70 ? 'Good' : 'New'}
            </div>
        </div>
    )
}

function AuditRow({ label, sub, hash }: { label: string; sub: string; hash?: string }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
            <div className="w-5 h-5 rounded-full bg-teal-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock size={10} className="text-teal-mid" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy">{label}</p>
                <p className="text-[11px] text-[#8A91A0]">{sub}</p>
                {hash && (
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-mono text-[#8A91A0] truncate">{hash}</span>
                        <ExternalLink size={10} className="text-teal-mid flex-shrink-0" />
                    </div>
                )}
            </div>
            <span className="text-[10px] font-semibold text-teal-mid bg-teal-light px-1.5 py-0.5 rounded-full flex-shrink-0">
        Verified
      </span>
        </div>
    )
}

export default function CircleDetailPage() {
    // ✅ Fix: useParams() instead of sync params prop (Next.js 15)
    const params = useParams()
    const id = params?.id as string

    const [activeTab, setTab] = useState<Tab>('rotation')
    const circle = DEMO_CIRCLES.find(c => c.id === id) ?? DEMO_CIRCLES[0]
    const progress = (circle.currentRound / circle.totalRounds) * 100

    return (
        <AppShell>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-navy transition-colors mb-4">
                <ArrowLeft size={14} /> Back
            </Link>

            {/* Header card */}
            <Card className="mb-4">
                <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1 mr-3">
                        <h1 className="text-lg font-bold text-navy tracking-tight">{circle.name}</h1>
                        <p className="text-xs text-[#8A91A0] mt-0.5">
                            Admin: {circle.adminName} · {formatNaira(circle.contributionAmount)}/{circle.frequency} · {circle.members.length} members
                        </p>
                    </div>
                    <Badge variant="active">Active</Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                        { label: 'Contribution', value: formatNaira(circle.contributionAmount) },
                        { label: 'Round',        value: `${circle.currentRound} / ${circle.totalRounds}` },
                        { label: 'Payout',       value: formatNaira(circle.contributionAmount * circle.members.length) },
                        { label: 'Health',       value: `${circle.healthScore}%`, green: true },
                    ].map((s, i) => (
                        <div key={i} className="bg-[#F7F8FA] rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-[#8A91A0] mb-1">{s.label}</p>
                            <p className={clsx('text-sm font-bold', s.green ? 'text-green-600' : 'text-navy')}>
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>

                <ProgressBar
                    value={progress}
                    color={progress >= 75 ? 'amber' : 'teal'}
                    showLabel
                    label={`Round ${circle.currentRound} of ${circle.totalRounds}`}
                />
            </Card>

            {/* Tabs */}
            <div className="flex border-b border-[#E8EAF0] mb-4 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={clsx(
                            'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
                            activeTab === t.id
                                ? 'border-teal text-navy'
                                : 'border-transparent text-[#8A91A0] hover:text-navy'
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'rotation' && (
                <Card>
                    <SectionTitle title={`Rotation order — Round ${circle.currentRound}`} />
                    {circle.members.map((m, i) => (
                        <RotationRow key={m.userId} member={m} position={i + 1} done={i < 2} current={i === 2} />
                    ))}
                    <div className="mt-4 pt-4 border-t border-[#F7F8FA]">
                        <Link href="/log-payment">
                            <Button fullWidth>
                                <CreditCard size={14} /> Log my payment for this round
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}

            {activeTab === 'members' && (
                <Card>
                    <SectionTitle title={`${circle.members.length} members`} />
                    {circle.members.map((m, i) => (
                        <MemberRow key={m.userId} member={m} isAdmin={i === 2} />
                    ))}
                </Card>
            )}

            {activeTab === 'contributions' && (
                <Card>
                    <div className="flex gap-2 mb-4 overflow-x-auto">
                        {['All', 'On time', 'Late', 'Pending'].map((f, i) => (
                            <button
                                key={f}
                                className={clsx(
                                    'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                                    i === 0
                                        ? 'bg-navy text-white'
                                        : 'bg-[#F7F8FA] text-[#8A91A0] hover:bg-teal-light hover:text-teal-dark'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    {DEMO_ACTIVITY.map(e => (
                        <div key={e.id} className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
                            <Avatar name={e.memberName} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-navy truncate">{e.memberName}</p>
                                <p className="text-[11px] text-[#8A91A0]">
                                    {new Date(e.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} · {e.paymentMethod.replace('-', ' ')}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-navy">{formatNaira(e.amount)}</p>
                                <Badge variant={e.status === 'on-time' ? 'ontime' : e.status as any}>
                                    {e.status === 'on-time' ? 'On time' : e.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            {activeTab === 'audit' && (
                <div className="flex flex-col gap-3">
                    <div className="bg-teal-light border border-teal/20 rounded-xl px-4 py-3 flex items-start gap-2">
                        <Lock size={14} className="text-teal-mid mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-teal-dark leading-relaxed">
                            This record cannot be edited by anyone, including CircuFi. Every verified event is permanently stored.
                        </p>
                    </div>
                    <Card>
                        <AuditRow label="Circle created" sub="Mama Chisom · Aug 20, 2025 · Rules locked" hash="0x3f1c...e8a4" />
                        <AuditRow label="Round 1 — Funke Coker received" sub="8/8 contributions verified · Sep 30, 2025" hash="0x7b2a...c1f0" />
                        <AuditRow label="Round 2 — Ngozi Kalu received" sub="8/8 contributions verified · Oct 31, 2025" hash="0x4e9d...b3c7" />
                        <AuditRow label="Round 3 — Mama Chisom received" sub="8/8 contributions verified · Nov 30, 2025" hash="0x1a5f...d2e9" />
                        <AuditRow label="Payment logged — Adaeze Okonkwo" sub="₦25,000 · Bank transfer · Jun 2, 2026" hash="0x7f3a...b4c2" />
                    </Card>
                </div>
            )}
        </AppShell>
    )
}