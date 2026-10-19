'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Lock, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/index'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { formatNaira } from '@/lib/utils'

const METHODS = ['bank_transfer', 'mobile_money', 'manual']

interface Group {
    id: string
    name: string
    rules: {
        contributionAmount: number
        currency: string
    }
    rotation: {
        cycle: number
        currentBeneficiary: string
    }
}

export default function LogPaymentPage() {
    // useSearchParams() needs a Suspense boundary for static rendering
    return (
        <Suspense fallback={null}>
            <LogPaymentForm />
        </Suspense>
    )
}

function LogPaymentForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [groupId, setGroupId] = useState<string | null>(searchParams?.get('groupId') ?? null)
    const [myGroups, setMyGroups] = useState<{ id: string; name: string; rules: { contributionAmount: number } }[] | null>(null)
    const { user } = useAuthStore()

    const [group, setGroup] = useState<Group | null>(null)
    const [beneficiary, setBeneficiary] = useState<any>(null)
    const [method, setMethod] = useState('bank_transfer')
    const [reference, setRef] = useState('')
    const [note, setNote] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!user) {
            router.push('/auth/login')
            return
        }
        if (groupId) {
            fetchGroupData()
        } else {
            fetchMyGroups()
        }
    }, [groupId, user])

    // No circle in the URL (e.g. opened from the dashboard): let the user pick one
    const fetchMyGroups = async () => {
        try {
            const response = await api.get('/v1/groups')
            const groups = response.data.data || []
            if (groups.length === 1) {
                setGroupId(groups[0].id)
            } else {
                setMyGroups(groups)
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load your circles')
            setMyGroups([])
        }
    }

    const fetchGroupData = async () => {
        try {
            const response = await api.get(`/v1/groups/${groupId}`)
            if (response.data.success) {
                setGroup(response.data.data)
                // Fetch beneficiary details
                if (response.data.data.rotation.currentBeneficiary) {
                    const userRes = await api.get(`/v1/users/${response.data.data.rotation.currentBeneficiary}`)
                    if (userRes.data.success) {
                        setBeneficiary(userRes.data.data)
                    }
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load group')
        }
    }

    const handleSubmit = async () => {
        if (!group || !user) return

        setLoading(true)
        setError('')
        try {
            const response = await api.post('/v1/contributions', {
                groupId: group.id,
                amount: group.rules.contributionAmount,
                currency: group.rules.currency,
                paymentMethod: method,
                paymentReference: reference || undefined,
                actualDate: new Date(date).getTime(),
                note: note || undefined
            })

            if (response.data.success) {
                setSubmitted(true)
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to log payment')
        } finally {
            setLoading(false)
        }
    }

    const getMethodLabel = (m: string) => {
        const labels: Record<string, string> = {
            'bank_transfer': 'Bank Transfer',
            'mobile_money': 'Mobile Money',
            'manual': 'Cash'
        }
        return labels[m] || m
    }

    /* ── Confirmation screen ────────────────── */
    if (submitted) return (
        <AppShell>
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-teal flex items-center justify-center mb-5">
                    <Check size={28} className="text-white" strokeWidth={3} />
                </div>
                <h2 className="text-xl font-bold text-navy mb-2">Contribution logged!</h2>
                <p className="text-sm text-[#8A91A0] mb-2 max-w-[260px] leading-relaxed">
                    {beneficiary?.displayName || 'The beneficiary'} will confirm receipt. You'll be notified once verified.
                </p>
                <div className="flex items-center gap-1.5 bg-teal-light text-teal-dark text-xs font-medium px-3 py-1.5 rounded-full mb-8">
                    <Lock size={11} />
                    Waiting for admin confirmation
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                    {groupId && (
                        <Link href={`/circles/${groupId}`}>
                            <Button fullWidth>Back to circle</Button>
                        </Link>
                    )}
                    <Link href="/dashboard">
                        <Button fullWidth variant="secondary">Go to dashboard</Button>
                    </Link>
                </div>
            </div>
        </AppShell>
    )

    if (!groupId && myGroups) {
        return (
            <AppShell>
                <h1 className="text-xl font-bold text-navy tracking-tight mb-5">Log contribution</h1>
                {myGroups.length === 0 ? (
                    <Card>
                        <p className="text-sm text-[#8A91A0] mb-3">You are not in any circle yet.</p>
                        <Link href="/circles/join"><Button size="sm">Join a circle</Button></Link>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-2 max-w-lg">
                        <p className="text-sm text-[#8A91A0] mb-1">Which circle is this payment for?</p>
                        {myGroups.map(g => (
                            <button key={g.id} onClick={() => setGroupId(g.id)} className="text-left">
                                <Card className="hover:border-teal transition-colors">
                                    <p className="text-sm font-semibold text-navy">{g.name}</p>
                                    <p className="text-xs text-[#8A91A0]">{formatNaira(g.rules.contributionAmount)} per round</p>
                                </Card>
                            </button>
                        ))}
                    </div>
                )}
            </AppShell>
        )
    }

    if (!group) {
        return (
            <AppShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AppShell>
        )
    }

    /* ── Form ───────────────────────────────── */
    return (
        <AppShell>
            <Link href={groupId ? `/circles/${groupId}` : '/dashboard'} className="inline-flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-navy transition-colors mb-5">
                <ArrowLeft size={14} /> Back to circle
            </Link>

            <h1 className="text-xl font-bold text-navy tracking-tight mb-5">Log contribution</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm max-w-lg">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4 max-w-lg">

                {/* Paying to card */}
                <Card padding="sm" className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#8A91A0]">You are paying →</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Avatar name={beneficiary?.displayName || 'Beneficiary'} size="sm" />
                            <p className="text-sm font-semibold text-navy">{beneficiary?.displayName || 'Loading...'}</p>
                        </div>
                        <p className="text-[11px] text-[#8A91A0] mt-1">{group.name} · Cycle {group.rotation.cycle}</p>
                    </div>
                    {beneficiary?.reputation && (
                        <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-[#8A91A0]">Payment record</p>
                            <p className="text-xs font-semibold text-teal-mid">
                                {beneficiary.reputation.totalPayments} payments · {Math.round(beneficiary.reputation.onTimeRate)}% on time
                            </p>
                        </div>
                    )}
                </Card>

                {/* Amount — locked */}
                <Card className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Lock size={12} className="text-[#8A91A0]" />
                        <p className="text-xs text-[#8A91A0]">Fixed contribution — {group.name}</p>
                    </div>
                    <p className="text-4xl font-bold text-navy tracking-tight">{formatNaira(group.rules.contributionAmount)}</p>
                </Card>

                {/* Payment method */}
                <div>
                    <label className="text-xs font-medium text-navy block mb-2">Payment method</label>
                    <div className="flex gap-2">
                        {METHODS.map(m => (
                            <button
                                key={m}
                                onClick={() => setMethod(m)}
                                className={clsx(
                                    'flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-colors',
                                    method === m
                                        ? 'bg-teal-light text-teal-dark border-teal'
                                        : 'bg-white text-[#8A91A0] border-[#E8EAF0] hover:border-teal/50'
                                )}
                            >
                                {getMethodLabel(m)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reference */}
                <Input
                    label="Transaction reference"
                    placeholder="e.g. TRF/2026/0602/..."
                    value={reference}
                    onChange={e => setRef(e.target.value)}
                    helper="Optional — helps admin verify faster"
                />

                {/* Date */}
                <Input
                    label="Date paid"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />

                {/* Note */}
                <div>
                    <label className="text-xs font-medium text-navy block mb-1.5">
                        Note <span className="text-[#8A91A0] font-normal">(optional)</span>
                    </label>
                    <textarea
                        rows={2}
                        placeholder="Add a note..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="cf-input resize-none"
                    />
                </div>

                <Button fullWidth size="lg" loading={loading} onClick={handleSubmit}>
                    Submit contribution
                </Button>

                <p className="text-[11px] text-[#8A91A0] text-center">
                    Your contribution will be verified by the circle admin
                </p>
            </div>
        </AppShell>
    )
}
