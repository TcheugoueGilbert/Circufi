'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, GripVertical, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Avatar } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const STEPS = ['Details', 'Rules', 'Members', 'Launch']

function StepBar({ current }: { current: number }) {
    return (
        <div className="flex mb-6">
            {STEPS.map((label, i) => (
                <div key={i} className={clsx(
                    'flex-1 text-center py-2 text-[11px] font-medium border-b-2 transition-colors',
                    i < current  && 'border-teal text-teal-mid',
                    i === current && 'border-navy text-navy font-semibold',
                    i > current  && 'border-[#E8EAF0] text-[#8A91A0]'
                )}>
                    {label}
                </div>
            ))}
        </div>
    )
}

const FREQUENCIES = ['Weekly', 'Biweekly', 'Monthly']
const PAYOUT_OPTS  = ['Admin decides', 'Random draw', 'Set manually']

const MOCK_MEMBERS = [
    { id: 'u1', name: 'Funke Coker',    phone: '+234 801 111 0001' },
    { id: 'u2', name: 'Ngozi Kalu',     phone: '+234 802 111 0002' },
    { id: 'u3', name: 'Fatima Nwosu',   phone: '+234 805 111 0005' },
]

export default function CreateCirclePage() {
    const router  = useRouter()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied]   = useState(false)

    // Step 1 state
    const [name,   setName]   = useState('')
    const [desc,   setDesc]   = useState('')
    const [amount, setAmount] = useState('')
    const [freq,   setFreq]   = useState('Monthly')

    // Step 2 state
    const [maxMembers, setMax]    = useState(8)
    const [startDate,  setStart]  = useState('')
    const [payout,     setPayout] = useState('Set manually')

    // Step 3 state
    const [search,   setSearch]  = useState('')
    const [members,  setMembers] = useState<typeof MOCK_MEMBERS>([])

    const addMember = (m: typeof MOCK_MEMBERS[0]) => {
        if (!members.find(x => x.id === m.id)) setMembers(prev => [...prev, m])
        setSearch('')
    }
    const removeMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id))

    const handleLaunch = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await api.post('/v1/groups', {
                name: name,
                description: desc,
                rules: {
                    contributionAmount: parseInt(amount),
                    currency: 'NGN',
                    frequency: freq.toLowerCase(),
                    nextPaymentDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 1 week from now
                    maxMembers: maxMembers,
                    minTrustScore: 50
                }
            })

            if (response.data.success) {
                const groupId = response.data.data.id

                // Add members if any
                if (members.length > 0) {
                    await Promise.all(members.map(member =>
                        api.post(`/v1/groups/${groupId}/members`, {
                            phoneNumber: member.phone
                        }).catch(err => console.error('Failed to add member:', err))
                    ))
                }

                router.push(`/circles/${groupId}`)
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to create circle')
            setLoading(false)
        }
    }

    const copyCode = () => {
        navigator.clipboard.writeText('OSU-4X7K').catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const next = () => setStep(s => s + 1)
    const back = () => step > 0 ? setStep(s => s - 1) : router.back()

    /* ─── Step 1: Details ────────────────── */
    const step1 = (
        <>
            <h2 className="text-lg font-bold text-navy mb-1">Name your circle</h2>
            <p className="text-sm text-[#8A91A0] mb-5">Basic info about your savings group</p>
            <div className="flex flex-col gap-4">
                <Input label="Circle name" placeholder="Ikeja Market Women" value={name} onChange={e => setName(e.target.value)} />
                <div>
                    <label className="text-xs font-medium text-navy block mb-1.5">Description <span className="text-[#8A91A0] font-normal">(optional)</span></label>
                    <textarea
                        rows={2}
                        className="cf-input resize-none"
                        placeholder="What's this circle for?"
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                    />
                </div>
                <Input
                    label="Contribution amount"
                    placeholder="25,000"
                    prefix="₦"
                    inputMode="numeric"
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                    helper={amount ? `Payout pool: ₦${(parseInt(amount || '0') * maxMembers).toLocaleString()}` : undefined}
                />
                <div>
                    <label className="text-xs font-medium text-navy block mb-1.5">Frequency</label>
                    <div className="flex gap-2">
                        {FREQUENCIES.map(f => (
                            <button
                                key={f}
                                onClick={() => setFreq(f)}
                                className={clsx(
                                    'flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-colors',
                                    freq === f
                                        ? 'bg-teal-light text-teal-dark border-teal'
                                        : 'bg-white text-[#8A91A0] border-[#E8EAF0] hover:border-teal/40'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <Button fullWidth size="lg" disabled={!name || !amount} onClick={next}>
                    Continue →
                </Button>
            </div>
        </>
    )

    /* ─── Step 2: Rules ──────────────────── */
    const step2 = (
        <>
            <h2 className="text-lg font-bold text-navy mb-1">Set the rules</h2>
            <p className="text-sm text-[#8A91A0] mb-5">These are locked when the circle launches</p>
            <div className="flex flex-col gap-5">

                {/* Max members stepper */}
                <div>
                    <label className="text-xs font-medium text-navy block mb-2">Maximum members</label>
                    <div className="flex items-center gap-4 bg-[#F7F8FA] rounded-xl p-3 w-fit">
                        <button
                            onClick={() => setMax(m => Math.max(2, m - 1))}
                            className="w-8 h-8 rounded-full border border-[#E8EAF0] bg-white text-navy font-bold hover:border-teal transition-colors"
                        >
                            −
                        </button>
                        <span className="text-xl font-bold text-navy w-6 text-center">{maxMembers}</span>
                        <button
                            onClick={() => setMax(m => Math.min(20, m + 1))}
                            className="w-8 h-8 rounded-full border border-[#E8EAF0] bg-white text-navy font-bold hover:border-teal transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Start date */}
                <Input
                    label="Start date"
                    type="date"
                    value={startDate}
                    onChange={e => setStart(e.target.value)}
                    helper="The first contribution round begins on this date"
                />

                {/* First payout */}
                <div>
                    <label className="text-xs font-medium text-navy block mb-2">First payout goes to</label>
                    <div className="flex flex-col gap-2">
                        {PAYOUT_OPTS.map(o => (
                            <button
                                key={o}
                                onClick={() => setPayout(o)}
                                className={clsx(
                                    'flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-colors',
                                    payout === o
                                        ? 'border-teal bg-teal-light text-teal-dark font-medium'
                                        : 'border-[#E8EAF0] bg-white text-navy hover:border-teal/40'
                                )}
                            >
                                <div className={clsx(
                                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                    payout === o ? 'border-teal' : 'border-[#E8EAF0]'
                                )}>
                                    {payout === o && <div className="w-2 h-2 rounded-full bg-teal" />}
                                </div>
                                {o}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" size="lg" className="flex-1" onClick={back}>← Back</Button>
                    <Button size="lg" className="flex-1" onClick={next}>Continue →</Button>
                </div>
            </div>
        </>
    )

    /* ─── Step 3: Members ────────────────── */
    const filtered = MOCK_MEMBERS.filter(m =>
        !members.find(x => x.id === m.id) &&
        (m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search))
    )

    const step3 = (
        <>
            <h2 className="text-lg font-bold text-navy mb-1">Invite members</h2>
            <p className="text-sm text-[#8A91A0] mb-5">Search by name or phone number</p>
            <div className="flex flex-col gap-4">

                {/* Search */}
                <div className="relative">
                    <Input
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && filtered.length > 0 && (
                        <div className="absolute z-10 top-full left-0 right-0 bg-white border border-[#E8EAF0] rounded-xl shadow-lg mt-1 overflow-hidden">
                            {filtered.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => addMember(m)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors border-b border-[#F7F8FA] last:border-0"
                                >
                                    <Avatar name={m.name} size="sm" />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-navy">{m.name}</p>
                                        <p className="text-xs text-[#8A91A0]">{m.phone}</p>
                                    </div>
                                    <Plus size={14} className="text-teal" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Added members */}
                {members.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-[#8A91A0] mb-2">
                            {members.length} member{members.length !== 1 ? 's' : ''} added — drag to set rotation order
                        </p>
                        <div className="flex flex-col gap-2">
                            {members.map((m, i) => (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-3 bg-white border border-[#E8EAF0] rounded-lg px-3 py-2.5"
                                >
                                    <GripVertical size={14} className="text-[#8A91A0] cursor-grab flex-shrink-0" />
                                    <span className="w-5 h-5 rounded-full bg-[#F7F8FA] text-[10px] font-bold text-[#8A91A0] flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                                    <Avatar name={m.name} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-navy truncate">{m.name}</p>
                                        <p className="text-[11px] text-[#8A91A0]">{m.phone}</p>
                                    </div>
                                    <button onClick={() => removeMember(m.id)} className="text-[#8A91A0] hover:text-red-500 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Share code */}
                <div>
                    <p className="text-xs font-medium text-[#8A91A0] mb-2">Or share your circle code</p>
                    <div className="flex items-center gap-2 bg-[#F7F8FA] rounded-xl border border-[#E8EAF0] px-4 py-3">
                        <span className="font-mono font-bold text-navy tracking-widest text-base flex-1">OSU-4X7K</span>
                        <button
                            onClick={copyCode}
                            className="flex items-center gap-1.5 text-xs font-medium text-teal-mid hover:text-teal-dark transition-colors"
                        >
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" size="lg" className="flex-1" onClick={back}>← Back</Button>
                    <Button size="lg" className="flex-1" onClick={next}>Review →</Button>
                </div>
            </div>
        </>
    )

    /* ─── Step 4: Launch ─────────────────── */
    const step4 = (
        <>
            <h2 className="text-lg font-bold text-navy mb-1">Review & launch</h2>
            <p className="text-sm text-[#8A91A0] mb-5">Rules are locked once the circle launches</p>
            <div className="flex flex-col gap-4">

                {/* Summary card */}
                <Card className="bg-[#F7F8FA]">
                    {[
                        { label: 'Circle name',  value: name || 'Ikeja Market Women' },
                        { label: 'Contribution', value: `₦${parseInt(amount || '25000').toLocaleString()} / ${freq}` },
                        { label: 'Payout pool',  value: `₦${(parseInt(amount || '25000') * maxMembers).toLocaleString()}` },
                        { label: 'Max members',  value: maxMembers },
                        { label: 'Start date',   value: startDate || 'Jul 1, 2026' },
                        { label: 'First payout', value: payout },
                    ].map((r, i) => (
                        <div key={i} className="flex justify-between py-2 border-b border-[#E8EAF0] last:border-0 text-sm">
                            <span className="text-[#8A91A0]">{r.label}</span>
                            <span className="font-semibold text-navy">{r.value}</span>
                        </div>
                    ))}
                </Card>

                {/* Members preview */}
                {members.length > 0 && (
                    <Card>
                        <p className="text-xs font-semibold text-[#8A91A0] mb-3">Rotation order</p>
                        {members.map((m, i) => (
                            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-[#F7F8FA] last:border-0">
                                <span className="text-xs font-bold text-[#8A91A0] w-4">{i + 1}</span>
                                <Avatar name={m.name} size="xs" />
                                <span className="text-sm text-navy">{m.name}</span>
                            </div>
                        ))}
                    </Card>
                )}

                <div className="flex gap-2">
                    <Button variant="secondary" size="lg" className="flex-1" onClick={back}>← Edit</Button>
                    <Button size="lg" className="flex-1" loading={loading} onClick={handleLaunch}>
                        🚀 Launch circle
                    </Button>
                </div>
                <p className="text-[11px] text-[#8A91A0] text-center">
                    Circle rules and rotation order will be permanently recorded
                </p>
            </div>
        </>
    )

    const content = [step1, step2, step3, step4][step]

    return (
        <AppShell>
            <button
                onClick={back}
                className="inline-flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-navy transition-colors mb-4"
            >
                <ArrowLeft size={14} /> {step === 0 ? 'Back' : 'Previous step'}
            </button>

            <div className="max-w-lg">
                <StepBar current={step} />
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}
                {content}
            </div>
        </AppShell>
    )
}