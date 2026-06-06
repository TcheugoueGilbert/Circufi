'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { PhoneInput, OTPInput } from '@/components/ui/Input'
import { Divider } from '@/components/ui/index'

const LOGIN_IMAGE = 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&h=1600&fit=crop&crop=center'

function ImageCaption() {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-1 bg-[#00C896] rounded-full" />
                <span className="text-white/60 text-xs font-medium uppercase tracking-widest">Since generations</span>
            </div>
            <blockquote className="text-white text-lg font-bold leading-snug mb-4 tracking-tight">
                "Ajo has kept our community together for decades. Now it keeps our records too."
            </blockquote>
            <div className="flex items-center gap-3">
                <img
                    src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=60&h=60&fit=crop&crop=face"
                    alt="Mama Chisom"
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                />
                <div>
                    <p className="text-white text-sm font-semibold">Mama Chisom</p>
                    <p className="text-white/55 text-xs">Circle admin · Ikeja, Lagos</p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    const router = useRouter()
    const [step,    setStep]    = useState<'phone' | 'otp'>('phone')
    const [phone,   setPhone]   = useState('')
    const [otp,     setOtp]     = useState(Array(6).fill(''))
    const [loading, setLoading] = useState(false)

    const handleVerify = async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 800))
        router.push('/dashboard')
    }

    if (step === 'phone') return (
        <AuthLayout sideImage={LOGIN_IMAGE} imageSide="right" imageCaption={<ImageCaption />}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight mb-1">Welcome back</h1>
                <p className="text-sm text-[#8A91A0]">
                    New to CircuFi?{' '}
                    <Link href="/auth/signup" className="text-[#00A07A] font-semibold hover:underline">
                        Create account
                    </Link>
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <PhoneInput label="Phone number" value={phone} onChange={setPhone} />

                <Button fullWidth size="lg" disabled={phone.length < 7} onClick={() => setStep('otp')}>
                    Send verification code
                </Button>

                <Divider label="or sign in with" />

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" className="gap-2">
                        <GoogleIcon /> Google
                    </Button>
                    <Button variant="secondary" className="gap-2">
                        <AppleIcon /> Apple
                    </Button>
                </div>

                <p className="text-[11px] text-[#8A91A0] text-center">
                    By continuing, you agree to our{' '}
                    <Link href="#" className="text-[#00A07A]">Terms</Link> and{' '}
                    <Link href="#" className="text-[#00A07A]">Privacy Policy</Link>
                </p>
            </div>
        </AuthLayout>
    )

    return (
        <AuthLayout back="/auth/login" sideImage={LOGIN_IMAGE} imageSide="right" imageCaption={<ImageCaption />}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight mb-1">Enter the 6-digit code</h1>
                <p className="text-sm text-[#8A91A0]">
                    We sent it to{' '}
                    <strong className="text-[#0A1628]">+234 {phone}</strong>
                    {' · '}
                    <button onClick={() => setStep('phone')} className="text-[#00A07A] hover:underline">
                        change
                    </button>
                </p>
            </div>

            <div className="flex flex-col gap-5">
                <OTPInput value={otp} onChange={setOtp} />
                <button className="text-sm text-[#8A91A0] hover:text-[#0A1628] underline underline-offset-2 text-center">
                    I didn't receive a code
                </button>
                <Button fullWidth size="lg" loading={loading} disabled={otp.some(v => !v)} onClick={handleVerify}>
                    Verify
                </Button>
            </div>
        </AuthLayout>
    )
}

function GoogleIcon() {
    return (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
    )
}

function AppleIcon() {
    return (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
    )
}