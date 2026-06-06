'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/index'
import { clsx } from 'clsx'
import { formatNaira } from '@/lib/data'

const METHODS = ['Bank Transfer', 'Mobile Money', 'Cash']

export default function LogPaymentPage() {
    const [method, setMethod]   = useState('Bank Transfer')
    const [reference, setRef]   = useState('')
    const [note, setNote]       = useState('')
    const [date, setDate]       = useState(new Date().toISOString().split('T')[0])
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 1000))
        setLoading(false)
        setSubmitted(true)
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
                    Mama Chisom will confirm receipt. You'll be notified once verified.
                </p>
                <div className="flex items-center gap-1.5 bg-teal-light text-teal-dark text-xs font-medium px-3 py-1.5 rounded-full mb-8">
                    <Lock size={11} />
                    Permanently recorded on Base
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                    <Link href="/circles/circle-ikeja">
                        <Button fullWidth>Back to circle</Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button fullWidth variant="secondary">Go to dashboard</Button>
                    </Link>
                </div>
            </div>
        </AppShell>
    )

    /* ── Form ───────────────────────────────── */
    return (
        <AppShell>
            <Link href="/circles/circle-ikeja" className="inline-flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-navy transition-colors mb-5">
                <ArrowLeft size={14} /> Back to circle
            </Link>

            <h1 className="text-xl font-bold text-navy tracking-tight mb-5">Log contribution</h1>

            <div className="flex flex-col gap-4 max-w-lg">

                {/* Paying to card */}
                <Card padding="sm" className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#8A91A0]">You are paying →</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Avatar name="Mama Chisom" size="sm" />
                            <p className="text-sm font-semibold text-navy">Mama Chisom</p>
                        </div>
                        <p className="text-[11px] text-[#8A91A0] mt-1">Ikeja Market Women · Round 5</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-[#8A91A0]">Payment record</p>
                        <p className="text-xs font-semibold text-teal-mid">24 payments · 91% on time</p>
                    </div>
                </Card>

                {/* Amount — locked */}
                <Card className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Lock size={12} className="text-[#8A91A0]" />
                        <p className="text-xs text-[#8A91A0]">Fixed contribution — Ikeja Market Women</p>
                    </div>
                    <p className="text-4xl font-bold text-navy tracking-tight">{formatNaira(25000)}</p>
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
                                {m}
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