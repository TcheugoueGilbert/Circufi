'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Users, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Avatar, AvatarStack, ProgressBar, Badge } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

interface Group {
    id: string
    name: string
    admin: { userId: string; name: string }
    rules: {
        contributionAmount: number
        currency: string
        frequency: string
        maxMembers?: number
        minTrustScore?: number
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
    }
    stats: {
        healthScore: number
    }
}

export default function JoinCirclePage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [code, setCode] = useState('')
    const [group, setGroup] = useState<Group | null>(null)
    const [requested, setRequested] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleCodeChange = (val: string) => {
        const formatted = val.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8)
        setCode(formatted)
        setGroup(null)
        setError('')
    }

    const handleSearch = async () => {
        if (!code) return

        setLoading(true)
        setError('')
        try {
            // Search by invite code
            const response = await api.get(`/v1/groups/code/${code}`)
            if (response.data.success) {
                setGroup(response.data.data)
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Circle not found. Check the code and try again.')
            setGroup(null)
        } finally {
            setLoading(false)
        }
    }

    const handleRequest = async () => {
        if (!group || !user) return

        setLoading(true)
        setError('')
        try {
            const response = await api.post(`/v1/groups/${group.id}/members`, {
                userId: user.id
            })

            if (response.data.success) {
                setRequested(true)
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to join circle')
        } finally {
            setLoading(false)
        }
    }

    const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`

    /* ─── Requested state ─────────────────── */
    if (requested && group) return (
        <AppShell>
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-teal-light flex items-center justify-center mb-5">
                    <Clock size={28} className="text-teal-mid" />
                </div>
                <h2 className="text-xl font-bold text-navy mb-2">Request sent!</h2>
                <p className="text-sm text-[#8A91A0] mb-6 leading-relaxed">
                    {group.admin.name} has been notified. You'll receive a notification once approved.
                </p>
                <div className="bg-[#F7F8FA] rounded-xl border border-[#E8EAF0] px-5 py-4 w-full mb-6 text-left">
                    <p className="text-sm font-semibold text-navy">{group.name}</p>
                    <p className="text-xs text-[#8A91A0] mt-1">Waiting for admin approval</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-xs text-amber-600 font-medium">Pending</span>
                    </div>
                </div>
                <Button fullWidth variant="secondary" onClick={() => router.push('/dashboard')}>
                    Back to dashboard
                </Button>
            </div>
        </AppShell>
    )

    const memberCount = group ? Object.keys(group.members).length : 0
    const maxMembers = group?.rules.maxMembers || 8

    return (
        <AppShell>
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-sm text-[#8A91A0] hover:text-navy transition-colors mb-5"
            >
                <ArrowLeft size={14} /> Back
            </button>

            <h1 className="text-xl font-bold text-navy tracking-tight mb-1">Join a circle</h1>
            <p className="text-sm text-[#8A91A0] mb-6">
                Enter the 6-character code from your organiser
            </p>

            <div className="flex flex-col gap-4 max-w-md">

                {/* Code input */}
                <div>
                    <label className="text-xs font-medium text-navy block mb-1.5">Circle code</label>
                    <div className="flex gap-2">
                        <input
                            className={clsx(
                                'cf-input flex-1 text-center font-mono text-xl font-bold tracking-[0.3em] uppercase',
                                error && 'border-red-300',
                                group && 'border-teal bg-teal-light/30'
                            )}
                            placeholder="OSU-4X7K"
                            value={code}
                            onChange={e => handleCodeChange(e.target.value)}
                            maxLength={8}
                        />
                        <Button
                            loading={loading}
                            disabled={code.length < 6}
                            onClick={handleSearch}
                            className="flex-shrink-0"
                        >
                            Find
                        </Button>
                    </div>
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    {group && (
                        <p className="text-xs text-teal-mid mt-1 flex items-center gap-1">
                            <Check size={11} /> Circle found
                        </p>
                    )}
                </div>

                {/* Circle preview */}
                {group && (
                    <Card className="border-teal/30">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-navy">{group.name}</h3>
                                <p className="text-xs text-[#8A91A0] mt-0.5">Admin: {group.admin.name}</p>
                            </div>
                            <Badge variant="active">Active</Badge>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {[
                                { label: 'Contribution', value: `${formatNaira(group.rules.contributionAmount)} / ${group.rules.frequency}` },
                                { label: 'Members', value: `${memberCount} / ${maxMembers} spots` },
                                { label: 'Current cycle', value: `Cycle ${group.rotation.cycle}` },
                                { label: 'Circle health', value: `${group.stats.healthScore}%` },
                            ].map((s, i) => (
                                <div key={i} className="bg-[#F7F8FA] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#8A91A0]">{s.label}</p>
                                    <p className="text-sm font-semibold text-navy mt-0.5">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Eligibility */}
                        <div className="flex items-center gap-2 bg-teal-light rounded-lg px-3 py-2.5 mb-4">
                            <Check size={13} className="text-teal-mid flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-teal-dark">You're eligible to join</p>
                                {group.rules.minTrustScore && (
                                    <p className="text-[10px] text-teal-mid">Minimum trust score: {group.rules.minTrustScore}</p>
                                )}
                            </div>
                        </div>

                        <Button fullWidth size="lg" loading={loading} onClick={handleRequest}>
                            Request to join
                        </Button>
                    </Card>
                )}

                {/* Empty state hint */}
                {!group && !error && (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-[#F7F8FA] flex items-center justify-center mx-auto mb-3">
                            <Users size={20} className="text-[#8A91A0]" />
                        </div>
                        <p className="text-sm text-[#8A91A0]">Enter a code to find your circle</p>
                    </div>
                )}
            </div>
        </AppShell>
    )
}
