'use client'
import { Bell, CreditCard, UserPlus, TrendingUp, AlertTriangle, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, EmptyState } from '@/components/ui/index'
import { clsx } from 'clsx'
import { DEMO_NOTIFICATIONS } from '@/lib/data'

const notifIcon: Record<string, { bg: string; icon: React.ReactNode }> = {
    'payment-due':      { bg: 'bg-amber-50',  icon: <CreditCard size={14} className="text-amber-600" /> },
    'payment-verified': { bg: 'bg-teal-light',icon: <Check size={14} className="text-teal-mid" />      },
    'payout-next':      { bg: 'bg-green-50',  icon: <TrendingUp size={14} className="text-green-600" />},
    'late-flag':        { bg: 'bg-red-50',    icon: <AlertTriangle size={14} className="text-red-500" />},
    'member-joined':    { bg: 'bg-blue-50',   icon: <UserPlus size={14} className="text-blue-600" />   },
}

export default function NotificationsPage() {
    const today     = DEMO_NOTIFICATIONS.filter(n => !n.read)
    const earlier   = DEMO_NOTIFICATIONS.filter(n => n.read)

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-navy tracking-tight">Notifications</h1>
                <button className="text-xs text-teal-mid font-medium hover:underline">Mark all read</button>
            </div>

            {DEMO_NOTIFICATIONS.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Bell size={40} />}
                        title="All caught up"
                        description="No new notifications"
                    />
                </Card>
            ) : (
                <div className="flex flex-col gap-5">

                    {today.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-[#8A91A0] uppercase tracking-widest mb-2 px-1">New</p>
                            <Card padding="none">
                                {today.map(n => {
                                    const { bg, icon } = notifIcon[n.type] ?? notifIcon['payment-due']
                                    return (
                                        <div key={n.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F7F8FA] last:border-0 bg-teal-light/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal mt-2 flex-shrink-0" />
                                            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-navy">{n.title}</p>
                                                <p className="text-xs text-[#8A91A0] mt-0.5">{n.body}</p>
                                                <span className="inline-block mt-1 text-[10px] font-medium text-teal-mid bg-teal-light px-2 py-0.5 rounded-full">
                          {n.circleName}
                        </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </Card>
                        </div>
                    )}

                    {earlier.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-[#8A91A0] uppercase tracking-widest mb-2 px-1">Earlier</p>
                            <Card padding="none">
                                {earlier.map(n => {
                                    const { bg, icon } = notifIcon[n.type] ?? notifIcon['payment-due']
                                    return (
                                        <div key={n.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F7F8FA] last:border-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-transparent mt-2 flex-shrink-0" />
                                            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 opacity-70', bg)}>
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-navy">{n.title}</p>
                                                <p className="text-xs text-[#8A91A0] mt-0.5">{n.body}</p>
                                                <span className="inline-block mt-1 text-[10px] text-[#8A91A0] bg-[#F7F8FA] px-2 py-0.5 rounded-full">
                          {n.circleName}
                        </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    )
}