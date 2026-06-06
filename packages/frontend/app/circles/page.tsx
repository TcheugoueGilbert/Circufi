'use client'
import Link from 'next/link'
import { Plus, UserPlus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, EmptyState, SectionTitle } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { CircleCard } from '@/components/circles/CircleCard'
import { DEMO_CIRCLES } from '@/lib/data'

export default function CirclesPage() {
    const active   = DEMO_CIRCLES.filter(c => c.status === 'active')
    const complete = DEMO_CIRCLES.filter(c => c.status === 'complete')

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

            {DEMO_CIRCLES.length === 0 ? (
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