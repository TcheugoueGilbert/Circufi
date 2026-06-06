import Link from 'next/link'
import { clsx } from 'clsx'
import { Badge, Avatar, AvatarStack, ProgressBar } from '@/components/ui/index'
import type { Circle } from '@/types'
import { formatNaira } from '@/lib/data'

interface CircleCardProps {
    circle: Circle
    compact?: boolean
}

export function CircleCard({ circle, compact = false }: CircleCardProps) {
    const progress     = (circle.currentRound / circle.totalRounds) * 100
    const barColor     = progress >= 75 ? 'amber' : 'teal'
    const memberNames  = circle.members.map(m => m.name)
    const payoutPool   = circle.contributionAmount * Math.max(circle.members.length, 8)

    return (
        <Link href={`/circles/${circle.id}`}>
            <div className={clsx(
                'bg-white rounded-xl border border-[#E8EAF0] transition-colors cursor-pointer hover:border-[#00C896]',
                compact ? 'p-3' : 'p-5'
            )}>
                {/* Top */}
                <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1 mr-2">
                        <p className={clsx('font-semibold text-[#0A1628] truncate', compact ? 'text-sm' : 'text-base')}>
                            {circle.name}
                        </p>
                        <p className="text-[11px] text-[#8A91A0] mt-0.5">
                            Admin: {circle.adminName} · {circle.members.length} members
                        </p>
                    </div>
                    <Badge variant={circle.status === 'active' ? 'active' : circle.status === 'complete' ? 'complete' : 'pending'}>
                        {circle.status}
                    </Badge>
                </div>

                {/* Amount */}
                {!compact && (
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-2xl font-bold text-[#0A1628] tracking-tight">
                                {formatNaira(circle.contributionAmount)}
                            </p>
                            <p className="text-xs text-[#8A91A0]">/ {circle.frequency}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-[#8A91A0]">Payout pool</p>
                            <p className="text-sm font-bold text-[#0A1628]">{formatNaira(payoutPool)}</p>
                        </div>
                    </div>
                )}

                {compact && (
                    <p className="text-lg font-bold text-[#0A1628] tracking-tight mb-3">
                        {formatNaira(circle.contributionAmount)}{' '}
                        <span className="text-xs font-normal text-[#8A91A0]">/ {circle.frequency}</span>
                    </p>
                )}

                {/* Progress */}
                <ProgressBar
                    value={progress}
                    color={barColor}
                    showLabel
                    label={`Round ${circle.currentRound} of ${circle.totalRounds}`}
                />

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F7F8FA]">
                    <AvatarStack names={memberNames} max={4} />
                    <div className="flex items-center gap-3">
                        {!compact && (
                            <div className="text-right">
                                <p className="text-[10px] text-[#8A91A0]">Next payment</p>
                                <p className="text-xs font-semibold text-[#0A1628]">Jun 7, 2026</p>
                            </div>
                        )}
                        <div className="text-right">
                            <p className="text-[10px] text-[#8A91A0]">Health</p>
                            <p className="text-xs font-bold text-green-600">{circle.healthScore}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}