'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Avatar } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

/* ── Section heading ─────────────────────── */
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-bold text-[#8A91A0] uppercase tracking-widest mb-2 px-1">{title}</p>
            <Card padding="none">
                {children}
            </Card>
        </div>
    )
}

/* ── Row link ────────────────────────────── */
function SettingsRow({
                         icon, label, sub, right, onClick, danger
                     }: {
    icon: React.ReactNode
    label: string
    sub?: string
    right?: React.ReactNode
    onClick?: () => void
    danger?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#F7F8FA] last:border-0',
                'text-left transition-colors',
                danger ? 'hover:bg-red-50' : 'hover:bg-[#F7F8FA]'
            )}
        >
            <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                danger ? 'bg-red-50 text-red-500' : 'bg-[#F7F8FA] text-[#8A91A0]'
            )}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-medium', danger ? 'text-red-600' : 'text-navy')}>{label}</p>
                {sub && <p className="text-[11px] text-[#8A91A0] mt-0.5">{sub}</p>}
            </div>
            {right ?? <ChevronRight size={14} className="text-[#8A91A0] flex-shrink-0" />}
        </button>
    )
}

/* ── Main ────────────────────────────────── */
export default function SettingsPage() {
    const router = useRouter()
    const { user, setUser, logout } = useAuthStore()
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [verified, setVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

    useEffect(() => {
        if (!user) {
            router.push('/auth/login')
            return
        }
        fetchUserData()
    }, [user?.id])

    const fetchUserData = async () => {
        try {
            const response = await api.get(`/v1/users/${user?.id}`)
            if (response.data.success) {
                const u = response.data.data
                setDisplayName(u.displayName || '')
                setEmail(u.email || '')
                setPhoneNumber(u.phoneNumber || '')
                setVerified(u.verificationStatus === 'verified')
            }
        } catch (err) {
            console.error('Failed to fetch user data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        setMessage(null)
        try {
            const response = await api.put(`/v1/users/${user.id}`, {
                displayName,
                email: email || undefined,
            })
            if (response.data.success) {
                setUser({ ...user, displayName: response.data.data.displayName, email: response.data.data.email })
                setMessage({ type: 'ok', text: 'Profile updated' })
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Could not save your profile' })
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = () => {
        logout()
        router.push('/auth/login')
    }

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell>
            <h1 className="text-xl font-bold text-navy tracking-tight mb-5">Settings</h1>

            <div className="flex flex-col gap-5 max-w-lg">
                <Card>
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar name={displayName || 'User'} size="xl" />
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-navy">{displayName}</p>
                            <p className="text-xs text-[#8A91A0] mt-0.5">{phoneNumber}</p>
                            {verified && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                    ✓ Verified
                                </span>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div className={clsx(
                            'px-3 py-2 rounded-lg mb-3 text-sm border',
                            message.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                        )}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Input label="Full name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            helper="Optional"
                        />
                        <Button loading={saving} disabled={!displayName.trim()} onClick={handleSave}>
                            Save changes
                        </Button>
                    </div>
                </Card>

                <SettingsSection title="Account">
                    <SettingsRow icon={<LogOut size={15} />} label="Sign out" onClick={handleLogout} />
                </SettingsSection>
            </div>
        </AppShell>
    )
}
