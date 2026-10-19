'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Avatar } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input, PhoneInput } from '@/components/ui/Input'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { isValidPhone, formatNaira } from '@/lib/utils'

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
    const [maxMembers, setMax] = useState(8)

    // Step 3 state: phone numbers (E.164) of people who already have a CircuFi account
    const [phoneInput, setPhoneInput] = useState('')
    const [members, setMembers] = useState<string[]>([])
    const [created, setCreated] = useState<{ id: string; inviteCode: string; notAdded: string[] } | null>(null)

    const addMember = () => {
        if (isValidPhone(phoneInput) && !members.includes(phoneInput)) {
            setMembers(prev => [...prev, phoneInput])
        }
        setPhoneInput('')
    }
    const removeMember = (phone: string) => setMembers(prev => prev.filter(p => p !== phone))

    const handleLaunch = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await api.post('/v1/groups', {
                name,
                description: desc || undefined,
                contributionAmount: parseInt(amount, 10),
                currency: 'NGN',
                frequency: freq.toLowerCase(),
                maxMembers,
            })

            if (response.data.success) {
                const { id, inviteCode } = response.data.data

                // Add the invited members; numbers without a CircuFi account are reported back
                const notAdded: string[] = []
                for (const phone of members) {
                    try {
                        await api.post(`/v1/groups/${id}/members`, { phoneNumber: phone })
                    } catch {
                        notAdded.push(phone)
                    }
                }
                setCreated({ id, inviteCode, notAdded })
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to create circle')
        } finally {
            setLoading(false)
        }
    }

    const copyCode = () => {
        navigator.clipboard.writeText(created?.inviteCode ?? '').catch(() => {})
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
            <p className="text-sm text-[#8A91A0] mb-5">The amount and frequency cannot be changed after launch</p>
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

                <p className="text-xs text-[#8A91A0]">
                    The first payment is due one {freq === 'Weekly' ? 'week' : freq === 'Biweekly' ? 'fortnight' : 'month'} after launch.
                    The rotation order follows the order in which members join.
                </p>

                <div className="flex gap-2">
                    <Button variant="secondary" size="lg" className="flex-1" onClick={back}>← Back</Button>
                    <Button size="lg" className="flex-1" onClick={next}>Continue →</Button>
                </div>
            </div>
        </>
    )

    /* ─── Step 3: Members ────────────────── */
    const step3 = (
        <>
            <h2 className="text-lg font-bold text-navy mb-1">Invite members</h2>
            <p className="text-sm text-[#8A91A0] mb-5">Add people by phone number, or share the invite code after launch</p>
            <div className="flex flex-col gap-4">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <PhoneInput label="Member phone number" value={phoneInput} onChange={setPhoneInput} />
                    </div>
                    <Button variant="secondary" disabled={!isValidPhone(phoneInput)} onClick={addMember}>
                        <Plus size={14} /> Add
                    </Button>
                </div>

                {members.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-[#8A91A0] mb-2">
                            {members.length} member{members.length !== 1 ? 's' : ''} added — they join the rotation in this order
                        </p>
                        <div className="flex flex-col gap-2">
                            {members.map((phone, i) => (
                                <div key={phone} className="flex items-center gap-3 bg-white border border-[#E8EAF0] rounded-lg px-3 py-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#F7F8FA] text-[10px] font-bold text-[#8A91A0] flex items-center justify-center flex-shrink-0">
                                        {i + 2}
                                    </span>
                                    <p className="flex-1 text-sm font-medium text-navy">{phone}</p>
                                    <button onClick={() => removeMember(phone)} className="text-[#8A91A0] hover:text-red-500 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-[11px] text-[#8A91A0]">
                    Only people who already have a CircuFi account can be added this way. Everyone else can join with the invite code you get after launching.
                </p>

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
            <p className="text-sm text-[#8A91A0] mb-5">The amount and frequency cannot be changed after launch</p>
            <div className="flex flex-col gap-4">

                {/* Summary card */}
                <Card className="bg-[#F7F8FA]">
                    {[
                        { label: 'Circle name',  value: name },
                        { label: 'Contribution', value: `${formatNaira(parseInt(amount || '0', 10))} / ${freq}` },
                        { label: 'Payout pool',  value: formatNaira(parseInt(amount || '0', 10) * maxMembers) },
                        { label: 'Max members',  value: maxMembers },
                        { label: 'Invited now',  value: members.length },
                    ].map((r, i) => (
                        <div key={i} className="flex justify-between py-2 border-b border-[#E8EAF0] last:border-0 text-sm">
                            <span className="text-[#8A91A0]">{r.label}</span>
                            <span className="font-semibold text-navy">{r.value}</span>
                        </div>
                    ))}
                </Card>

                <div className="flex gap-2">
                    <Button variant="secondary" size="lg" className="flex-1" onClick={back}>← Edit</Button>
                    <Button size="lg" className="flex-1" loading={loading} onClick={handleLaunch}>
                        🚀 Launch circle
                    </Button>
                </div>
                <p className="text-[11px] text-[#8A91A0] text-center">
                    Members join the rotation in the order they are added
                </p>
            </div>
        </>
    )

    const content = [step1, step2, step3, step4][step]

    if (created) return (
        <AppShell>
            <div className="max-w-lg">
                <h2 className="text-lg font-bold text-navy mb-1">Your circle is live 🎉</h2>
                <p className="text-sm text-[#8A91A0] mb-5">Share this code so people can join from the “Join circle” page</p>
                <div className="flex items-center gap-2 bg-[#F7F8FA] rounded-xl border border-[#E8EAF0] px-4 py-3 mb-4">
                    <span className="font-mono font-bold text-navy tracking-widest text-base flex-1">{created.inviteCode}</span>
                    <button onClick={copyCode} className="flex items-center gap-1.5 text-xs font-medium text-teal-mid hover:text-teal-dark transition-colors">
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                {created.notAdded.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm">
                        These numbers have no CircuFi account yet, so they were not added: {created.notAdded.join(', ')}. Send them the invite code instead.
                    </div>
                )}
                <Button fullWidth size="lg" onClick={() => router.push(`/circles/${created.id}`)}>Open circle</Button>
            </div>
        </AppShell>
    )

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