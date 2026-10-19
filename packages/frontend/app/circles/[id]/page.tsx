'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Check, Lock, Copy, SkipForward, Users, RefreshCw, Activity, Bot } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Badge, Avatar, ProgressBar, SectionTitle } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { formatNaira } from '@/lib/utils'

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
    inviteCode?: string
    createdAt?: number
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
    trustScore: number
    totalPayments: number
    onTimeRate: number
    rotationPosition: number | null
}

interface Contribution {
    id: string
    paidBy: { userId: string; displayName: string }
    amount: number
    actualDate: number
    isOnTime: boolean
    paymentMethod: string
    status: 'pending' | 'completed' | 'failed' | 'disputed'
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
        {done ? '✓ Received' : current ? 'Active' : 'Waiting'}
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

function AuditRow({ label, sub, status }: { label: string; sub: string; status?: string }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
            <div className="w-5 h-5 rounded-full bg-teal-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock size={10} className="text-teal-mid" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy">{label}</p>
                <p className="text-[11px] text-[#8A91A0]">{sub}</p>
            </div>
            {status && (
                <span className="text-[10px] font-semibold text-teal-mid bg-teal-light px-1.5 py-0.5 rounded-full flex-shrink-0 capitalize">
                    {status}
                </span>
            )}
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
    const [filter, setFilter] = useState<'All' | 'On time' | 'Late' | 'Pending'>('All')
    const [copied, setCopied] = useState(false)
    const [busy, setBusy] = useState(false)

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
                setContributions(contributionsRes.data.data?.contributions || [])
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load circle data')
        } finally {
            setLoading(false)
        }
    }

    const isAdmin = !!group && user?.id === group.admin.userId

    const copyCode = () => {
        navigator.clipboard.writeText(group?.inviteCode ?? '').catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const confirmPayment = async (contributionId: string) => {
        setBusy(true)
        try {
            await api.post(`/v1/contributions/${contributionId}/verify`)
            await fetchData()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Could not confirm payment')
        } finally {
            setBusy(false)
        }
    }

    const advanceRotation = async () => {
        if (!confirm('Close this round and move the payout to the next member?')) return
        setBusy(true)
        try {
            await api.post(`/v1/groups/${id}/rotation/advance`)
            await fetchData()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Could not advance the rotation')
        } finally {
            setBusy(false)
        }
    }

    const visibleContributions = contributions.filter(c =>
        filter === 'All' ? true :
        filter === 'Pending' ? c.status === 'pending' :
        filter === 'On time' ? c.isOnTime && c.status !== 'pending' :
        !c.isOnTime && c.status !== 'pending'
    )

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AppShell>
        )
    }

    if (!group) {
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

    const progress = ((group.rotation.currentBeneficiaryIndex + 1) / Math.max(group.rotation.order.length, 1)) * 100

    return (
        <AppShell>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-navy transition-colors mb-4">
                <ArrowLeft size={14} /> Back
            </Link>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
            )}

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

                {group.inviteCode && (
                    <div className="flex items-center gap-2 bg-[#F7F8FA] rounded-lg px-3 py-2 mb-4">
                        <span className="text-[11px] text-[#8A91A0]">Invite code</span>
                        <span className="font-mono font-bold text-navy tracking-widest text-sm flex-1">{group.inviteCode}</span>
                        <button onClick={copyCode} className="flex items-center gap-1 text-xs font-medium text-teal-mid hover:text-teal-dark">
                            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                        { label: 'Contribution', value: formatNaira(group.rules.contributionAmount) },
                        { label: 'Cycle',        value: `${group.rotation.cycle}` },
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
                    label={`Cycle ${group.rotation.cycle} · payout ${group.rotation.currentBeneficiaryIndex + 1} of ${Math.max(group.rotation.order.length, 1)}`}
                />
            </Card>

            {/* Detail pages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                    { href: `/circles/${id}/members`,  label: 'Members',      icon: <Users size={14} /> },
                    { href: `/circles/${id}/rotation`, label: 'Rotation',     icon: <RefreshCw size={14} /> },
                    { href: `/circles/${id}/health`,   label: 'Health',       icon: <Activity size={14} /> },
                    { href: `/circles/${id}/chat`,     label: 'AI Assistant', icon: <Bot size={14} /> },
                ].map(l => (
                    <Link key={l.href} href={l.href}>
                        <div className="flex items-center justify-center gap-1.5 bg-white border border-[#E8EAF0] rounded-lg py-2.5 text-xs font-semibold text-navy hover:border-teal transition-colors">
                            {l.icon} {l.label}
                        </div>
                    </Link>
                ))}
            </div>

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
                        <Link href={`/log-payment?groupId=${id}`}>
                            <Button fullWidth>
                                <CreditCard size={14} /> Log my payment for this round
                            </Button>
                        </Link>
                        {isAdmin && (
                            <Button fullWidth variant="secondary" className="mt-2" disabled={busy} onClick={advanceRotation}>
                                <SkipForward size={14} /> Close round &amp; move to next payout
                            </Button>
                        )}
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
                        {(['All', 'On time', 'Late', 'Pending'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={clsx(
                                    'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                                    filter === f
                                        ? 'bg-navy text-white'
                                        : 'bg-[#F7F8FA] text-[#8A91A0] hover:bg-teal-light hover:text-teal-dark'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    {visibleContributions.length === 0 && (
                        <p className="text-xs text-[#8A91A0] text-center py-6">No contributions to show</p>
                    )}
                    {visibleContributions.map(c => (
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
                                {c.status === 'pending' ? (
                                    isAdmin ? (
                                        <Button size="sm" disabled={busy} onClick={() => confirmPayment(c.id)}>Confirm</Button>
                                    ) : (
                                        <Badge variant="pending">Awaiting confirmation</Badge>
                                    )
                                ) : (
                                    <Badge variant={c.isOnTime ? 'ontime' : 'late'}>
                                        {c.isOnTime ? 'On time' : 'Late'}
                                    </Badge>
                                )}
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
                            Every contribution is logged with its date, amount and confirmation status.
                        </p>
                    </div>
                    <Card>
                        {[...contributions].sort((a, b) => b.actualDate - a.actualDate).map(c => (
                            <AuditRow
                                key={c.id}
                                label={`${c.paidBy.displayName} · ${formatNaira(c.amount)}`}
                                sub={`${new Date(c.actualDate).toLocaleDateString()} · ${c.isOnTime ? 'on time' : 'late'}`}
                                status={c.status}
                            />
                        ))}
                        <AuditRow
                            label="Circle created"
                            sub={`${group.admin.name} · ${group.createdAt ? new Date(group.createdAt).toLocaleDateString() : ''}`}
                        />
                    </Card>
                </div>
            )}
        </AppShell>
    )
}
