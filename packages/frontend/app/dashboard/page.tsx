'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, UserPlus, CreditCard, ArrowUpRight, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Badge, Avatar, AvatarStack, ProgressBar, SectionTitle, EmptyState } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'

interface Circle {
    id: string
    name: string
    admin: { userId: string; name: string }
    rules: {
        contributionAmount: number
        currency: string
        frequency: string
        nextPaymentDate: number
    }
    members: any
    rotation: {
        cycle: number
        currentBeneficiary: string
    }
    stats: {
        healthScore: number
    }
}

interface Contribution {
    id: string
    groupId: string
    paidBy: { userId: string; displayName: string }
    amount: number
    currency: string
    status: string
    isOnTime: boolean
    actualDate: number
}

export default function DashboardPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [circles, setCircles] = useState<Circle[]>([])
    const [activity, setActivity] = useState<Contribution[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchData()
        } else {
            router.push('/auth/login')
        }
    }, [user])

    const fetchData = async () => {
        try {
            const [circlesRes, activityRes] = await Promise.all([
                api.get('/v1/groups'),
                api.get(`/v1/contributions/user/${user?.id}`)
            ])

            if (circlesRes.data.success) {
                setCircles(circlesRes.data.data || [])
            }
            if (activityRes.data.success) {
                setActivity((activityRes.data.data || []).slice(0, 5))
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`
    const getMemberCount = (members: any) => {
        if (!members) return 0
        return typeof members === 'object' ? Object.keys(members).length : 0
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
            {/* Greeting */}
            <div className="mb-5">
                <h1 className="text-xl font-bold text-navy tracking-tight">
                    Good morning, {user?.displayName || 'User'} 👋
                </h1>
                <p className="text-sm text-[#8A91A0] mt-0.5">
                    You have {circles.length} active {circles.length === 1 ? 'circle' : 'circles'}
                </p>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
                <Link href="/circles/create">
                    <Button size="sm" className="whitespace-nowrap">
                        <Plus size={13} /> Create circle
                    </Button>
                </Link>
                <Link href="/circles/join">
                    <Button size="sm" variant="secondary" className="whitespace-nowrap">
                        <UserPlus size={13} /> Join circle
                    </Button>
                </Link>
                <Link href="/log-payment">
                    <Button size="sm" variant="secondary" className="whitespace-nowrap">
                        <CreditCard size={13} /> Log payment
                    </Button>
                </Link>
            </div>

            {/* My circles */}
            <section className="mb-6">
                <SectionTitle
                    title="My circles"
                    action={circles.length > 2 && (
                        <Link href="/circles" className="text-xs text-teal-mid font-medium hover:underline">
                            See all
                        </Link>
                    )}
                />
                {circles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {circles.slice(0, 4).map(circle => (
                            <Link key={circle.id} href={`/circles/${circle.id}`}>
                                <Card className="hover:border-teal transition-colors cursor-pointer h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="min-w-0 flex-1 mr-2">
                                            <p className="text-sm font-semibold text-navy truncate">{circle.name}</p>
                                            <p className="text-[11px] text-[#8A91A0] mt-0.5">
                                                Admin: {circle.admin.name} · {getMemberCount(circle.members)} members
                                            </p>
                                        </div>
                                        <Badge variant="active">Active</Badge>
                                    </div>
                                    <p className="text-xl font-bold text-navy tracking-tight mb-3">
                                        {formatNaira(circle.rules.contributionAmount)}{' '}
                                        <span className="text-xs font-normal text-[#8A91A0]">/ {circle.rules.frequency}</span>
                                    </p>
                                    <ProgressBar
                                        value={Math.min(circle.rotation.cycle * 10, 100)}
                                        color="teal"
                                        showLabel
                                        label={`Cycle ${circle.rotation.cycle}`}
                                    />
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F7F8FA]">
                                        <p className="text-xs text-[#8A91A0]">Health: {circle.stats.healthScore}%</p>
                                        <p className="text-xs font-semibold text-navy">
                                            {new Date(circle.rules.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <EmptyState
                            title="No circles yet"
                            description="Create your first circle or join one with a code"
                            action={
                                <div className="flex gap-2 justify-center">
                                    <Link href="/circles/create"><Button size="sm">Create circle</Button></Link>
                                    <Link href="/circles/join"><Button size="sm" variant="secondary">Join circle</Button></Link>
                                </div>
                            }
                        />
                    </Card>
                )}
            </section>

            {/* Recent activity */}
            <section>
                <SectionTitle
                    title="Recent activity"
                    action={activity.length > 0 && (
                        <Link href="/payments/history">
                            <span className="text-xs text-teal-mid font-medium cursor-pointer hover:underline">View all</span>
                        </Link>
                    )}
                />
                {activity.length > 0 ? (
                    <Card padding="none">
                        <div className="px-5">
                            {activity.map(contrib => (
                                <div key={contrib.id} className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        contrib.isOnTime ? 'bg-teal-light' : 'bg-amber-50'
                                    }`}>
                                        {contrib.isOnTime ? (
                                            <ArrowUpRight size={15} className="text-teal-mid" />
                                        ) : (
                                            <Clock size={15} className="text-amber-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-navy truncate">
                                            {contrib.paidBy.displayName}
                                        </p>
                                        <p className="text-[11px] text-[#8A91A0]">
                                            {new Date(contrib.actualDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-semibold text-navy">
                                            {formatNaira(contrib.amount)}
                                        </p>
                                        <p className="text-[10px] text-[#8A91A0]">
                                            {contrib.isOnTime ? 'On time' : 'Late'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <EmptyState
                            title="No activity yet"
                            description="Your payment activity will appear here"
                        />
                    </Card>
                )}
            </section>
        </AppShell>
    )
}
