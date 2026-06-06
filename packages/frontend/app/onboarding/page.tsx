'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { Check, Users, TrendingUp, Home, BarChart3, ArrowLeft } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

const STEPS = ['Profile', 'Goal', 'Start']

function StepDots({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-2 justify-center mb-8">
            {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className={clsx(
                        'flex items-center gap-1.5',
                    )}>
                        <div className={clsx(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                            i < current  ? 'bg-[#00C896] text-white' :
                                i === current ? 'bg-[#0A1628] text-white' :
                                    'bg-[#E8EAF0] text-[#8A91A0]'
                        )}>
                            {i < current ? <Check size={10} /> : i + 1}
                        </div>
                        <span className={clsx(
                            'text-xs font-medium hidden sm:block',
                            i === current ? 'text-[#0A1628]' : 'text-[#8A91A0]'
                        )}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={clsx(
                            'w-8 h-px',
                            i < current ? 'bg-[#00C896]' : 'bg-[#E8EAF0]'
                        )} />
                    )}
                </div>
            ))}
        </div>
    )
}

const GOALS = [
    { id: 'save',   icon: <Users size={22} />,     title: 'Save with my group',  desc: 'Join or create an ajo circle'      },
    { id: 'goal',   icon: <Home size={22} />,       title: 'Save for a goal',     desc: 'Home, school fees, business'       },
    { id: 'manage', icon: <BarChart3 size={22} />,  title: 'Manage a circle',     desc: 'I organise savings for others'     },
    { id: 'rep',    icon: <TrendingUp size={22} />, title: 'Build my record',     desc: 'Establish my payment track record' },
]

type Step = 'profile' | 'goal' | 'join' | 'create' | 'welcome'

export default function OnboardingPage() {
    const router = useRouter()
    const [step,         setStep]   = useState<Step>('profile')
    const [name,         setName]   = useState('')
    const [bvn,          setBvn]    = useState('')
    const [selectedGoal, setGoal]   = useState('')
    const [circleCode,   setCode]   = useState('')
    const [loading,      setLoading]= useState(false)

    const advance = async (next: Step) => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 350))
        setLoading(false)
        setStep(next)
    }

    /* ── Step 1: Profile ── */
    if (step === 'profile') return (
        <AuthLayout>
            <StepDots current={0} />
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight text-center mb-1">
                Tell us about you
            </h1>
            <p className="text-sm text-[#8A91A0] text-center mb-6">
                Your info helps build your payment record from day one
            </p>
            <div className="flex flex-col gap-4">
                <Input
                    label="Full name"
                    placeholder="Adaeze Okonkwo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <Input
                    label="BVN"
                    placeholder="22xxxxxxxxx"
                    value={bvn}
                    onChange={e => setBvn(e.target.value)}
                    helper="Used for identity verification only. We never store your BVN."
                    maxLength={11}
                    inputMode="numeric"
                />
                <Button fullWidth size="lg" loading={loading} disabled={!name} onClick={() => advance('goal')}>
                    Continue
                </Button>
                <button
                    onClick={() => advance('goal')}
                    className="text-sm text-[#8A91A0] hover:text-[#0A1628] underline underline-offset-2 text-center transition-colors"
                >
                    Skip for now
                </button>
                <p className="text-[11px] text-[#8A91A0] text-center leading-relaxed">
                    By continuing, you agree to our{' '}
                    <Link href="#" className="text-[#00A07A]">Terms of Use</Link> and{' '}
                    <Link href="#" className="text-[#00A07A]">Privacy Policy</Link>
                </p>
            </div>
        </AuthLayout>
    )

    /* ── Step 2: Goal ── */
    if (step === 'goal') return (
        <AuthLayout>
            <StepDots current={1} />
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight text-center mb-1">
                What brings you to CircuFi?
            </h1>
            <p className="text-sm text-[#8A91A0] text-center mb-5">You can always change this later</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
                {GOALS.map(g => (
                    <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={clsx(
                            'text-left p-4 rounded-xl border transition-all',
                            selectedGoal === g.id
                                ? 'border-[#00C896] bg-[#E0FAF4]'
                                : 'border-[#E8EAF0] bg-white hover:border-[#00C896]/50'
                        )}
                    >
                        <div className={clsx('mb-2', selectedGoal === g.id ? 'text-[#00A07A]' : 'text-[#8A91A0]')}>
                            {g.icon}
                        </div>
                        <p className="text-xs font-semibold text-[#0A1628] mb-0.5">{g.title}</p>
                        <p className="text-[10px] text-[#8A91A0] leading-relaxed">{g.desc}</p>
                    </button>
                ))}
            </div>
            <div className="flex flex-col gap-2">
                <Button fullWidth size="lg" loading={loading} onClick={() => advance('join')}>
                    Join a circle
                </Button>
                <Button fullWidth size="lg" variant="secondary" onClick={() => advance('create')}>
                    Create a circle
                </Button>
            </div>
        </AuthLayout>
    )

    /* ── Step 3a: Join ── */
    if (step === 'join') return (
        <AuthLayout>
            <StepDots current={2} />
            <button
                onClick={() => setStep('goal')}
                className="flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-[#0A1628] mb-5 transition-colors"
            >
                <ArrowLeft size={14} /> Back
            </button>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight text-center mb-1">
                Join a circle
            </h1>
            <p className="text-sm text-[#8A91A0] text-center mb-6">
                Enter the 6-character code from your circle organiser
            </p>
            <div className="flex flex-col gap-4">
                <Input
                    label="Circle code"
                    placeholder="OSU-4X7K"
                    value={circleCode}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="text-center font-mono text-lg tracking-widest uppercase"
                    maxLength={8}
                />
                {circleCode.length >= 6 && (
                    <div className="bg-[#F7F8FA] rounded-xl border border-[#E8EAF0] p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00C896]" />
                            <p className="text-xs text-[#00A07A] font-semibold">Circle found</p>
                        </div>
                        <p className="text-sm font-semibold text-[#0A1628]">Ikeja Market Women</p>
                        <p className="text-xs text-[#8A91A0] mt-1">₦25,000 / month · 7 members · Round 5 of 8</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-[#8A91A0]">Admin: Mama Chisom</span>
                            <span className="ml-auto text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                ✓ Eligible
              </span>
                        </div>
                    </div>
                )}
                <Button
                    fullWidth size="lg" loading={loading}
                    disabled={circleCode.length < 6}
                    onClick={() => advance('welcome')}
                >
                    Request to join
                </Button>
                <button
                    onClick={() => setStep('goal')}
                    className="text-sm text-[#8A91A0] hover:text-[#0A1628] underline underline-offset-2 text-center"
                >
                    I'll do this later
                </button>
            </div>
        </AuthLayout>
    )

    /* ── Step 3b: Create ── */
    if (step === 'create') return (
        <AuthLayout>
            <StepDots current={2} />
            <button
                onClick={() => setStep('goal')}
                className="flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-[#0A1628] mb-5 transition-colors"
            >
                <ArrowLeft size={14} /> Back
            </button>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight text-center mb-1">
                Name your circle
            </h1>
            <p className="text-sm text-[#8A91A0] text-center mb-6">
                You can add members and set rules next
            </p>
            <div className="flex flex-col gap-4">
                <Input label="Circle name" placeholder="Ikeja Market Women" />
                <Input label="Contribution amount" placeholder="25,000" prefix="₦" inputMode="numeric" />
                <div>
                    <label className="text-xs font-medium text-[#0A1628] block mb-1.5">Frequency</label>
                    <div className="flex gap-2">
                        {['Weekly', 'Biweekly', 'Monthly'].map((f, i) => (
                            <button
                                key={f}
                                className={clsx(
                                    'flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-colors',
                                    i === 2
                                        ? 'bg-[#E0FAF4] text-[#065F46] border-[#00C896]'
                                        : 'bg-white text-[#8A91A0] border-[#E8EAF0] hover:border-[#00C896]/40'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <Button fullWidth size="lg" loading={loading} onClick={() => advance('welcome')}>
                    Continue to rules →
                </Button>
                <button
                    onClick={() => setStep('goal')}
                    className="text-sm text-[#8A91A0] hover:text-[#0A1628] underline underline-offset-2 text-center"
                >
                    I'll do this later
                </button>
            </div>
        </AuthLayout>
    )

    /* ── Step 4: Welcome ── */
    return (
        <AuthLayout>
            <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-[#00C896] flex items-center justify-center mx-auto mb-5">
                    <Check size={28} className="text-white" strokeWidth={3} />
                </div>
                <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight mb-2">
                    You're all set{name ? `, ${name.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-sm text-[#8A91A0] mb-7 max-w-[280px] mx-auto leading-relaxed">
                    Your payment history starts now. Every on-time contribution builds your record.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-7">
                    {[
                        { val: '0',   label: 'Payments made' },
                        { val: '—',   label: 'On-time rate'  },
                        { val: 'New', label: 'Member status'  },
                    ].map((s, i) => (
                        <div key={i} className="bg-[#F7F8FA] rounded-xl p-3 border border-[#E8EAF0]">
                            <p className="text-lg font-bold text-[#0A1628]">{s.val}</p>
                            <p className="text-[10px] text-[#8A91A0] mt-0.5 leading-tight">{s.label}</p>
                        </div>
                    ))}
                </div>
                <Button fullWidth size="lg" onClick={() => router.push('/dashboard')}>
                    Go to dashboard
                </Button>
            </div>
        </AuthLayout>
    )
}