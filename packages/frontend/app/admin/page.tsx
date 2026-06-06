'use client'
import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Avatar, SectionTitle } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/index'
import { clsx } from 'clsx'
import { DEMO_CIRCLES, DEMO_ACTIVITY, formatNaira } from '@/lib/data'

type Tab = 'verify' | 'rotation' | 'members'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'verify',   label: 'Verify payments', icon: <CheckCircle size={14} /> },
    { id: 'rotation', label: 'Advance rotation', icon: <RotateCcw size={14} />  },
    { id: 'members',  label: 'Manage members',   icon: <Users size={14} />      },
]

export default function AdminPage() {
    const [activeTab, setTab]         = useState<Tab>('verify')
    const [advanceModal, setAdvance]  = useState(false)
    const [disputeModal, setDispute]  = useState(false)
    const [selectedMember, setMember] = useState('')
    const [disputeReason, setReason]  = useState('')
    const [loading, setLoading]       = useState(false)
    const [verified, setVerified]     = useState<string[]>([])
    const [disputed, setDisputed]     = useState<string[]>([])

    const circle = DEMO_CIRCLES[0]

    // ✅ Fix: was OR logic that made everything "pending" — now correctly
    // shows only events not yet actioned
    const pendingCount = DEMO_ACTIVITY.filter(
        e => !verified.includes(e.id) && !disputed.includes(e.id)
    ).length

    const handleVerify = async (id: string) => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 600))
        setLoading(false)
        setVerified(v => [...v, id])
    }

    const handleAdvance = async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 800))
        setLoading(false)
        setAdvance(false)
    }

    return (
        <AppShell>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <Link
                    href={`/circles/${circle.id}`}
                    className="text-sm text-[#8A91A0] hover:text-navy flex items-center gap-1 transition-colors"
                >
                    <ArrowLeft size={14} />
                    {circle.name}
                </Link>
            </div>

            <div className="flex items-start justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl font-bold text-[#0A1628] tracking-tight">Admin panel</h1>
                        <span className="text-[11px] font-semibold text-[#00A07A] bg-[#E0FAF4] px-2 py-0.5 rounded-full">
              Admin
            </span>
                    </div>
                    <p className="text-sm text-[#8A91A0]">{circle.name} · Round {circle.currentRound} of {circle.totalRounds}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'Pending verification', value: pendingCount,        color: 'text-amber-600' },
                    { label: 'Payments verified',    value: verified.length,     color: 'text-[#00A07A]' },
                    { label: 'Circle health',        value: `${circle.healthScore}%`, color: 'text-green-600' },
                ].map((s, i) => (
                    <Card key={i} padding="sm" className="text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-[#8A91A0] mt-0.5 leading-tight">{s.label}</p>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={clsx(
                            'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                            activeTab === t.id
                                ? 'bg-[#0A1628] text-white'
                                : 'bg-white text-[#8A91A0] border border-[#E8EAF0] hover:border-[#0A1628]/30'
                        )}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Verify payments ── */}
            {activeTab === 'verify' && (
                <div className="flex flex-col gap-3">
                    {DEMO_ACTIVITY.map(event => {
                        const isVerified = verified.includes(event.id)
                        const isDisputed = disputed.includes(event.id)

                        return (
                            <Card key={event.id} padding="sm">
                                <div className="flex items-start gap-3">
                                    <Avatar name={event.memberName} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-[#0A1628] truncate">{event.memberName}</p>
                                                <p className="text-[11px] text-[#8A91A0]">
                                                    {formatNaira(event.amount)} · {event.paymentMethod.replace('-', ' ')}
                                                </p>
                                                {event.reference && (
                                                    <p className="text-[10px] font-mono text-[#8A91A0] mt-0.5 truncate">
                                                        Ref: {event.reference}
                                                    </p>
                                                )}
                                            </div>
                                            {isVerified ? (
                                                <span className="chip-ontime flex-shrink-0">Verified ✓</span>
                                            ) : isDisputed ? (
                                                <span className="chip-disputed flex-shrink-0">Disputed</span>
                                            ) : (
                                                <span className="chip-pending flex-shrink-0">Pending</span>
                                            )}
                                        </div>

                                        {!isVerified && !isDisputed && (
                                            <div className="flex gap-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    loading={loading}
                                                    onClick={() => handleVerify(event.id)}
                                                    className="flex-1"
                                                >
                                                    <CheckCircle size={12} /> Verify
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    className="flex-1"
                                                    onClick={() => { setMember(event.id); setDispute(true) }}
                                                >
                                                    <XCircle size={12} /> Dispute
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}

                    {verified.length === DEMO_ACTIVITY.length && (
                        <Card className="text-center py-6">
                            <div className="w-10 h-10 rounded-full bg-[#E0FAF4] flex items-center justify-center mx-auto mb-3">
                                <CheckCircle size={20} className="text-[#00A07A]" />
                            </div>
                            <p className="text-sm font-semibold text-[#0A1628]">All payments verified</p>
                            <p className="text-xs text-[#8A91A0] mt-1 mb-4">You can now advance to the next round</p>
                            <Button onClick={() => setTab('rotation')}>Advance rotation →</Button>
                        </Card>
                    )}
                </div>
            )}

            {/* ── Tab: Advance rotation ── */}
            {activeTab === 'rotation' && (
                <div className="flex flex-col gap-4">
                    <Card>
                        <SectionTitle title="Current round status" />

                        <div className="bg-[#E0FAF4] rounded-xl p-4 mb-4">
                            <p className="text-xs text-[#00A07A] font-semibold mb-2">Current beneficiary</p>
                            <div className="flex items-center gap-3">
                                <Avatar name="Mama Chisom" size="md" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#0A1628]">Mama Chisom</p>
                                    <p className="text-xs text-[#8A91A0]">
                                        Round 5 · Receiving {formatNaira(circle.contributionAmount * circle.members.length)}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-[#00A07A] bg-white px-2 py-0.5 rounded-full">Active</span>
                            </div>
                        </div>

                        <div className="border border-[#E8EAF0] rounded-xl p-4 mb-4">
                            <p className="text-xs text-[#8A91A0] font-semibold mb-2">Next up — Round 6</p>
                            <div className="flex items-center gap-3">
                                <Avatar name="Adaeze Okonkwo" size="md" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#0A1628]">Adaeze Okonkwo</p>
                                    <p className="text-xs text-[#8A91A0]">
                                        Will receive {formatNaira(circle.contributionAmount * circle.members.length)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs font-semibold text-[#8A91A0] mb-2">Round {circle.currentRound} compliance</p>
                            <div className="flex flex-col gap-2">
                                {circle.members.slice(0, 4).map((m, i) => (
                                    <div key={m.userId} className="flex items-center gap-2">
                                        <Avatar name={m.name} size="xs" />
                                        <span className="text-xs text-[#0A1628] flex-1">{m.name}</span>
                                        {m.hasPaidCurrentRound || i < 2 ? (
                                            <span className="text-[10px] font-semibold text-[#00A07A]">✓ Paid</span>
                                        ) : (
                                            <span className="text-[10px] font-semibold text-amber-500">Pending</span>
                                        )}
                                    </div>
                                ))}
                                <p className="text-[11px] text-[#8A91A0]">+ {circle.members.length - 4} more members</p>
                            </div>
                        </div>

                        <Button fullWidth onClick={() => setAdvance(true)}>
                            <RotateCcw size={14} /> Close Round {circle.currentRound} & advance
                        </Button>
                    </Card>
                </div>
            )}

            {/* ── Tab: Manage members ── */}
            {activeTab === 'members' && (
                <Card>
                    <SectionTitle
                        title={`${circle.members.length} members`}
                        action={
                            <Link href={`/circles/${circle.id}?tab=members`} className="text-xs text-[#00A07A] hover:underline">
                                View circle
                            </Link>
                        }
                    />
                    {circle.members.map((m, i) => (
                        <div key={m.userId} className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
                            <Avatar name={m.name} size="md" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-[#0A1628] truncate">{m.name}</p>
                                    {i === 2 && (
                                        <span className="text-[9px] font-bold text-[#00A07A] bg-[#E0FAF4] px-1.5 py-0.5 rounded-full">You</span>
                                    )}
                                </div>
                                <p className="text-[11px] text-[#8A91A0]">
                                    {m.totalPayments} payments · {Math.round(m.onTimeRate)}% on time
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                <span className={clsx(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    m.onTimeRate >= 90 ? 'bg-[#E0FAF4] text-[#065F46]' :
                        m.onTimeRate >= 70 ? 'bg-amber-50 text-amber-700'   :
                            'bg-gray-100 text-gray-500'
                )}>
                  {m.onTimeRate >= 90 ? 'Reliable' : m.onTimeRate >= 70 ? 'Good' : 'New'}
                </span>
                                {i !== 2 && (
                                    <button className="text-[#8A91A0] hover:text-red-500 transition-colors p-1">
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            {/* Advance rotation modal */}
            <Modal
                open={advanceModal}
                onClose={() => setAdvance(false)}
                title="Advance rotation"
                footer={
                    <>
                        <Button fullWidth loading={loading} onClick={handleAdvance}>
                            Yes, close Round {circle.currentRound}
                        </Button>
                        <Button fullWidth variant="secondary" onClick={() => setAdvance(false)}>
                            Cancel
                        </Button>
                    </>
                }
            >
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                        This will close Round {circle.currentRound} and set Adaeze Okonkwo as the next beneficiary.
                        This action will be permanently recorded.
                    </p>
                </div>
                <p className="text-sm text-[#8A91A0] leading-relaxed">
                    Confirm that Mama Chisom has received her payout of{' '}
                    <strong className="text-[#0A1628]">
                        {formatNaira(circle.contributionAmount * circle.members.length)}
                    </strong>{' '}
                    before advancing.
                </p>
            </Modal>

            {/* Dispute modal */}
            <Modal
                open={disputeModal}
                onClose={() => setDispute(false)}
                title="Dispute payment"
                footer={
                    <>
                        <Button
                            fullWidth variant="danger"
                            onClick={() => { setDisputed(d => [...d, selectedMember]); setDispute(false) }}
                        >
                            Submit dispute
                        </Button>
                        <Button fullWidth variant="secondary" onClick={() => setDispute(false)}>Cancel</Button>
                    </>
                }
            >
                <p className="text-sm text-[#8A91A0] mb-3 leading-relaxed">
                    Explain why you're disputing this payment. The member will be notified.
                </p>
                <textarea
                    rows={3}
                    className="cf-input resize-none w-full"
                    placeholder="e.g. Payment reference not found in my account..."
                    value={disputeReason}
                    onChange={e => setReason(e.target.value)}
                />
            </Modal>
        </AppShell>
    )
}