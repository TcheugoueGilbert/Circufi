import Link from 'next/link'
import { clsx } from 'clsx'
import { Users } from 'lucide-react'
import { Badge, ProgressBar } from '@/components/ui/index'
import type { Circle } from '@/lib/types'
import { formatNaira } from '@/lib/utils'

interface CircleCardProps {
    circle: Circle
    compact?: boolean
}

export function CircleCard({ circle, compact = false }: CircleCardProps) {
    const memberCount = Object.values(circle.members ?? {}).filter(m => m.status !== 'removed').length
    const total       = Math.max(circle.rotation.order.length, 1)
    const progress    = ((circle.rotation.currentBeneficiaryIndex + 1) / total) * 100
    const payoutPool  = circle.rules.contributionAmount * memberCount
    const nextPayment = new Date(circle.rules.nextPaymentDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <Link href={`/circles/${circle.id}`}>
            <div className={clsx(
                'bg-white rounded-xl border border-[#E8EAF0] transition-colors cursor-pointer hover:border-[#00C896]',
                compact ? 'p-3' : 'p-5'
            )}>
                <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1 mr-2">
                        <p className={clsx('font-semibold text-[#0A1628] truncate', compact ? 'text-sm' : 'text-base')}>
                            {circle.name}
                        </p>
                        <p className="text-[11px] text-[#8A91A0] mt-0.5">
                            Admin: {circle.admin.name} · {memberCount} members
                        </p>
                    </div>
                    <Badge variant="active">active</Badge>
                </div>

                {!compact && (
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-2xl font-bold text-[#0A1628] tracking-tight">
                                {formatNaira(circle.rules.contributionAmount)}
                            </p>
                            <p className="text-xs text-[#8A91A0]">/ {circle.rules.frequency}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-[#8A91A0]">Payout pool</p>
                            <p className="text-sm font-bold text-[#0A1628]">{formatNaira(payoutPool)}</p>
                        </div>
                    </div>
                )}

                <ProgressBar
                    value={progress}
                    color={progress >= 75 ? 'amber' : 'teal'}
                    showLabel
                    label={`Cycle ${circle.rotation.cycle} · payout ${circle.rotation.currentBeneficiaryIndex + 1} of ${total}`}
                />

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F7F8FA]">
                    <span className="flex items-center gap-1 text-xs text-[#8A91A0]"><Users size={12} /> {memberCount}</span>
                    <div className="flex items-center gap-3">
                        {!compact && (
                            <div className="text-right">
                                <p className="text-[10px] text-[#8A91A0]">Next payment</p>
                                <p className="text-xs font-semibold text-[#0A1628]">{nextPayment}</p>
                            </div>
                        )}
                        <div className="text-right">
                            <p className="text-[10px] text-[#8A91A0]">Health</p>
                            <p className="text-xs font-bold text-green-600">{circle.stats.healthScore}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
