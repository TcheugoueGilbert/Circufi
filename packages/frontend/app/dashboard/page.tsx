'use client'
import Link from 'next/link'
import { Plus, UserPlus, CreditCard, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Badge, Avatar, AvatarStack, ProgressBar, SectionTitle, EmptyState } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { DEMO_CIRCLES, DEMO_ACTIVITY, formatNaira, formatDate } from '@/lib/data'

/* ── Circle card ────────────────────────────── */
function CircleCard({ circle }: { circle: typeof DEMO_CIRCLES[0] }) {
    const progress = (circle.currentRound / circle.totalRounds) * 100
    const color    = progress >= 75 ? 'amber' : 'teal'
    const memberNames = circle.members.map(m => m.name)

    return (
        <Link href={`/circles/${circle.id}`}>
            <Card className="hover:border-teal transition-colors cursor-pointer h-full">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1 mr-2">
                        <p className="text-sm font-semibold text-navy truncate">{circle.name}</p>
                        <p className="text-[11px] text-[#8A91A0] mt-0.5">
                            Admin: {circle.adminName} · {circle.members.length} members
                        </p>
                    </div>
                    <Badge variant={circle.status === 'active' ? 'active' : 'complete'}>
                        {circle.status === 'active' ? 'Active' : 'Complete'}
                    </Badge>
                </div>

                {/* Amount */}
                <p className="text-xl font-bold text-navy tracking-tight mb-3">
                    {formatNaira(circle.contributionAmount)}{' '}
                    <span className="text-xs font-normal text-[#8A91A0]">/ {circle.frequency}</span>
                </p>

                {/* Progress */}
                <ProgressBar
                    value={progress}
                    color={color}
                    showLabel
                    label={`Round ${circle.currentRound} of ${circle.totalRounds}`}
                />

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F7F8FA]">
                    <AvatarStack names={memberNames} max={4} />
                    <div className="text-right">
                        <p className="text-[10px] text-[#8A91A0]">Next payment</p>
                        <p className="text-xs font-semibold text-navy">Jun 7, 2026</p>
                    </div>
                </div>
            </Card>
        </Link>
    )
}

/* ── Activity item ──────────────────────────── */
const activityIcon = {
    'on-time': { bg: 'bg-teal-light', color: 'text-teal-mid', Icon: ArrowUpRight },
    'late':    { bg: 'bg-amber-50',   color: 'text-amber-600', Icon: Clock       },
    'pending': { bg: 'bg-gray-100',   color: 'text-gray-400',  Icon: Clock       },
    'disputed':{ bg: 'bg-red-50',     color: 'text-red-500',   Icon: Clock       },
}

function ActivityItem({ event }: { event: typeof DEMO_ACTIVITY[0] }) {
    const { bg, color, Icon } = activityIcon[event.status] ?? activityIcon['pending']
    const isCredit = event.memberName !== 'Adaeze Okonkwo'

    return (
        <div className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon size={15} className={color} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">
                    {isCredit ? 'Payout received' : 'Payment confirmed'}
                </p>
                <p className="text-[11px] text-[#8A91A0]">
                    {event.circleName} · Round {event.circleId === 'circle-ikeja' ? 5 : 9}
                </p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-navy'}`}>
                    {isCredit ? '+' : '−'}{formatNaira(event.amount)}
                </p>
                <p className="text-[10px] text-[#8A91A0]">Today</p>
            </div>
        </div>
    )
}

/* ── Dashboard page ─────────────────────────── */
export default function DashboardPage() {
    return (
        <AppShell>
            {/* Greeting */}
            <div className="mb-5">
                <h1 className="text-xl font-bold text-navy tracking-tight">Good morning, Adaeze 👋</h1>
                <p className="text-sm text-[#8A91A0] mt-0.5">You have 2 upcoming payments this week</p>
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
                    action={
                        <Link href="/circles" className="text-xs text-teal-mid font-medium hover:underline">
                            See all
                        </Link>
                    }
                />
                {DEMO_CIRCLES.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DEMO_CIRCLES.map(c => <CircleCard key={c.id} circle={c} />)}
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

            {/* Upcoming payments */}
            <section className="mb-6">
                <SectionTitle title="Upcoming payments" />
                <div className="flex flex-col gap-2">
                    {[
                        { circle: 'Ikeja Market Women', amount: 25000, due: 'Jun 7, 2026', urgent: true  },
                        { circle: 'CampusSave Unilag',  amount: 10000, due: 'Jun 5, 2026', urgent: true  },
                    ].map((p, i) => (
                        <Card key={i} padding="sm" className="flex items-center gap-3">
                            <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${p.urgent ? 'bg-amber-400' : 'bg-teal'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-navy truncate">{p.circle}</p>
                                <p className="text-[11px] text-[#8A91A0]">Due {p.due}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-navy">{formatNaira(p.amount)}</p>
                                <Link href="/log-payment">
                                    <span className="text-[11px] text-teal-mid font-medium hover:underline">Log payment</span>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Recent activity */}
            <section>
                <SectionTitle
                    title="Recent activity"
                    action={<span className="text-xs text-teal-mid font-medium cursor-pointer hover:underline">View all</span>}
                />
                <Card padding="none">
                    <div className="px-5">
                        {DEMO_ACTIVITY.map(e => <ActivityItem key={e.id} event={e} />)}
                    </div>
                </Card>
            </section>
        </AppShell>
    )
}