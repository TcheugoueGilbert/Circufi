'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Check, Lock, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Badge, Avatar, ProgressBar, SectionTitle } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

type Tab = 'rotation' | 'members' | 'contributions' | 'audit'

const TABS: { id: Tab; label: string }[] = [
    { id: 'rotation',      label: 'Rotation'      },
    { id: 'members',       label: 'Members'       },
    { id: 'contributions', label: 'Contributions' },
    { id: 'audit',         label: 'Audit trail'   },
]

interface Group {
    id: string
    name: string
    admin: { userId: string; name: string }
    rules: {
        contributionAmount: number
        currency: string
        frequency: string
        nextPaymentDate: number
    }
    members: {
        [userId: string]: {
            joinedAt: number
            status: string
            role: string
        }
    }
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

interface Member {
    userId: string
    displayName: string
    reputation: {
        totalPayments: number
        onTimeRate: number
    }
}

interface Contribution {
    id: string
    paidBy: { userId: string; displayName: string }
    amount: number
    actualDate: number
    isOnTime: boolean
    paymentMethod: string
    status: string
}

function RotationRow({ member, position, current, done, isYou }: {
    member: Member
    position: number
    current: boolean
    done: boolean
    isYou: boolean
}) {
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
            <Avatar name={member.displayName} size="sm" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">
                    {member.displayName}
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
    member: Member
    isAdmin?: boolean
}) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
            <Avatar name={member.displayName} size="md" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-navy truncate">{member.displayName}</p>
                    {isAdmin && (
                        <span className="text-[10px] font-semibold text-teal-mid bg-teal-light px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                </div>
                <p className="text-[11px] text-[#8A91A0]">
                    {member.reputation.totalPayments} payments · {Math.round(member.reputation.onTimeRate)}% on time
                </p>
            </div>
            <div className={clsx(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                member.reputation.onTimeRate >= 90 ? 'bg-teal-light text-teal-dark'   :
                    member.reputation.onTimeRate >= 70 ? 'bg-amber-50 text-amber-700'     :
                        'bg-gray-100 text-gray-500'
            )}>
                {member.reputation.onTimeRate >= 90 ? 'Reliable' : member.reputation.onTimeRate >= 70 ? 'Good' : 'New'}
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
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string
    const { user } = useAuthStore()

    const [activeTab, setTab] = useState<Tab>('rotation')
    const [group, setGroup] = useState<Group | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [contributions, setContributions] = useState<Contribution[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!user) {
            router.push('/auth/login')
            return
        }
        if (id) {
            fetchData()
        }
    }, [id, user])

    const fetchData = async () => {
        try {
            const [groupRes, membersRes, contributionsRes] = await Promise.all([
                api.get(`/v1/groups/${id}`),
                api.get(`/v1/groups/${id}/members`),
                api.get(`/v1/contributions/${id}`)
            ])

            if (groupRes.data.success) {
                setGroup(groupRes.data.data)
            }
            if (membersRes.data.success) {
                setMembers(membersRes.data.data || [])
            }
            if (contributionsRes.data.success) {
                setContributions(contributionsRes.data.data || [])
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load circle data')
        } finally {
            setLoading(false)
        }
    }

    const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AppShell>
        )
    }

    if (error || !group) {
        return (
            <AppShell>
                <div className="text-center py-12">
                    <p className="text-red-600">{error || 'Circle not found'}</p>
                    <Link href="/dashboard">
                        <Button className="mt-4">Back to Dashboard</Button>
                    </Link>
                </div>
            </AppShell>
        )
    }

    const progress = group.rotation.cycle > 0
        ? (group.rotation.currentBeneficiaryIndex / Object.keys(group.members).length) * 100
        : 0

    return (
        <AppShell>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-navy transition-colors mb-4">
                <ArrowLeft size={14} /> Back
            </Link>

            {/* Header card */}
            <Card className="mb-4">
                <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1 mr-3">
                        <h1 className="text-lg font-bold text-navy tracking-tight">{group.name}</h1>
                        <p className="text-xs text-[#8A91A0] mt-0.5">
                            Admin: {group.admin.name} · {formatNaira(group.rules.contributionAmount)}/{group.rules.frequency} · {Object.keys(group.members).length} members
                        </p>
                    </div>
                    <Badge variant="active">Active</Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                        { label: 'Contribution', value: formatNaira(group.rules.contributionAmount) },
                        { label: 'Round',        value: `${group.rotation.cycle}` },
                        { label: 'Payout',       value: formatNaira(group.rules.contributionAmount * Object.keys(group.members).length) },
                        { label: 'Health',       value: `${group.stats.healthScore}%`, green: true },
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
                    label={`Cycle ${group.rotation.cycle}`}
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
                    <SectionTitle title={`Rotation order — Cycle ${group.rotation.cycle}`} />
                    {members.map((m, i) => (
                        <RotationRow
                            key={m.userId}
                            member={m}
                            position={i + 1}
                            done={i < group.rotation.currentBeneficiaryIndex}
                            current={i === group.rotation.currentBeneficiaryIndex}
                            isYou={m.userId === user?.id}
                        />
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
                    <SectionTitle title={`${members.length} members`} />
                    {members.map((m) => (
                        <MemberRow key={m.userId} member={m} isAdmin={m.userId === group.admin.userId} />
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
                    {contributions.map(c => (
                        <div key={c.id} className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
                            <Avatar name={c.paidBy.displayName} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-navy truncate">{c.paidBy.displayName}</p>
                                <p className="text-[11px] text-[#8A91A0]">
                                    {new Date(c.actualDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} · {c.paymentMethod.replace('_', ' ')}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-navy">{formatNaira(c.amount)}</p>
                                <Badge variant={c.isOnTime ? 'ontime' : 'late'}>
                                    {c.isOnTime ? 'On time' : 'Late'}
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
                        <AuditRow label="Circle created" sub={`${group.admin.name} · ${new Date().toLocaleDateString()} · Rules locked`} hash="0x3f1c...e8a4" />
                        <p className="text-xs text-[#8A91A0] text-center py-4">Audit trail in development</p>
                    </Card>
                </div>
            )}
        </AppShell>
    )
}
