'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CreditCard, UserPlus, TrendingUp, AlertTriangle, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, EmptyState } from '@/components/ui/index'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

interface Notification {
    id: string
    userId: string
    type: 'payment_reminder' | 'payment_received' | 'member_joined' | 'payment_missed' | 'system'
    groupId?: string
    message: string
    read: boolean
    createdAt: number
}

const notifIcon: Record<string, { bg: string; icon: React.ReactNode }> = {
    'payment_reminder':  { bg: 'bg-amber-50',  icon: <CreditCard size={14} className="text-amber-600" /> },
    'payment_received':  { bg: 'bg-teal-light',icon: <Check size={14} className="text-teal-mid" />      },
    'payment_missed':    { bg: 'bg-red-50',    icon: <AlertTriangle size={14} className="text-red-500" />},
    'member_joined':     { bg: 'bg-blue-50',   icon: <UserPlus size={14} className="text-blue-600" />   },
    'system':            { bg: 'bg-gray-50',   icon: <Bell size={14} className="text-gray-600" />       },
}

export default function NotificationsPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            router.push('/auth/login')
            return
        }
        fetchNotifications()
    }, [user])

    const fetchNotifications = async () => {
        try {
            const response = await api.get(`/v1/notifications/${user?.id}`)
            if (response.data.success) {
                setNotifications(response.data.data || [])
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err)
        } finally {
            setLoading(false)
        }
    }

    const markAllAsRead = async () => {
        try {
            await api.put(`/v1/notifications/${user?.id}/mark-read`)
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        } catch (err) {
            console.error('Failed to mark as read:', err)
        }
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

    const today = notifications.filter(n => !n.read)
    const earlier = notifications.filter(n => n.read)

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-navy tracking-tight">Notifications</h1>
                {today.length > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-teal-mid font-medium hover:underline">
                        Mark all read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
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
                                    const { bg, icon } = notifIcon[n.type] ?? notifIcon['system']
                                    return (
                                        <div key={n.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F7F8FA] last:border-0 bg-teal-light/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal mt-2 flex-shrink-0" />
                                            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-navy">{n.message}</p>
                                                <p className="text-xs text-[#8A91A0] mt-0.5">
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </p>
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
                                    const { bg, icon } = notifIcon[n.type] ?? notifIcon['system']
                                    return (
                                        <div key={n.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F7F8FA] last:border-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-transparent mt-2 flex-shrink-0" />
                                            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 opacity-70', bg)}>
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-navy">{n.message}</p>
                                                <p className="text-xs text-[#8A91A0] mt-0.5">
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </p>
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
