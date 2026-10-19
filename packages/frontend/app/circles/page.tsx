'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, UserPlus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, EmptyState, SectionTitle } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { CircleCard } from '@/components/circles/CircleCard'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Circle } from '@/lib/types'

export default function CirclesPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [circles, setCircles] = useState<Circle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            router.push('/auth/login')
            return
        }
        fetchCircles()
    }, [user])

    const fetchCircles = async () => {
        try {
            const response = await api.get('/v1/groups')
            if (response.data.success) {
                setCircles(response.data.data || [])
            }
        } catch (err) {
            console.error('Failed to fetch circles:', err)
        } finally {
            setLoading(false)
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

    // For now, treat all circles as active since backend doesn't have status field
    const active = circles
    const complete: Circle[] = []

    return (
        <AppShell>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-navy tracking-tight">My circles</h1>
                <div className="flex gap-2">
                    <Link href="/circles/join">
                        <Button size="sm" variant="secondary">
                            <UserPlus size={13} /> Join
                        </Button>
                    </Link>
                    <Link href="/circles/create">
                        <Button size="sm">
                            <Plus size={13} /> Create
                        </Button>
                    </Link>
                </div>
            </div>

            {circles.length === 0 ? (
                <Card>
                    <EmptyState
                        title="No circles yet"
                        description="Create your first circle or join one with a code"
                        action={
                            <div className="flex gap-2 justify-center">
                                <Link href="/circles/create">
                                    <Button size="sm">Create circle</Button>
                                </Link>
                                <Link href="/circles/join">
                                    <Button size="sm" variant="secondary">Join circle</Button>
                                </Link>
                            </div>
                        }
                    />
                </Card>
            ) : (
                <div className="flex flex-col gap-6">
                    {active.length > 0 && (
                        <section>
                            <SectionTitle title={`Active (${active.length})`} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {active.map(c => <CircleCard key={c.id} circle={c} />)}
                            </div>
                        </section>
                    )}

                    {complete.length > 0 && (
                        <section>
                            <SectionTitle title={`Completed (${complete.length})`} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {complete.map(c => <CircleCard key={c.id} circle={c} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </AppShell>
    )
}
