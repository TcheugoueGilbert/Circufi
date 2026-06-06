import { clsx } from 'clsx'
import { Lock, ExternalLink, Check } from 'lucide-react'
import { Avatar, Badge } from '@/components/ui/index'
import type { Member, ContributionEvent } from '@/types'
import { formatNaira } from '@/lib/data'

/* ─── RotationList ───────────────────────── */
interface RotationListProps {
    members: Member[]
    currentRound: number
    beneficiaryIndex?: number          // 0-based index of current beneficiary
}

export function RotationList({ members, currentRound, beneficiaryIndex = 2 }: RotationListProps) {
    return (
        <div>
            {members.map((member, i) => {
                const done    = i < beneficiaryIndex
                const current = i === beneficiaryIndex
                const isYou   = member.userId === 'user-adaeze'

                return (
                    <div
                        key={member.userId}
                        className={clsx(
                            'flex items-center gap-3 py-3 rounded-lg px-2 -mx-2 transition-colors',
                            current && 'bg-[#E0FAF4]',
                            !current && 'border-b border-[#F7F8FA] last:border-0'
                        )}
                    >
                        {/* Position circle */}
                        <div className={clsx(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                            done    && 'bg-[#E0FAF4] text-[#065F46]',
                            current && 'bg-[#00C896] text-white',
                            !done && !current && 'bg-[#F7F8FA] text-[#8A91A0]'
                        )}>
                            {done ? <Check size={10} /> : i + 1}
                        </div>

                        <Avatar name={member.name} size="sm" />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0A1628] truncate">
                                {member.name}
                                {isYou && <span className="text-[11px] text-[#8A91A0] ml-1">(you)</span>}
                            </p>
                            <p className="text-[11px] text-[#8A91A0]">
                                {done    && `Received · Round ${i + 1}`}
                                {current && 'Receiving this round'}
                                {!done && !current && `Round ${i + 1}`}
                            </p>
                        </div>

                        <span className={clsx(
                            'text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                            done    && 'bg-[#E0FAF4] text-[#065F46]',
                            current && 'bg-[#00C896] text-white',
                            !done && !current && 'bg-[#F7F8FA] text-[#8A91A0]'
                        )}>
              {done ? '✓ Done' : current ? 'Active' : 'Waiting'}
            </span>
                    </div>
                )
            })}
        </div>
    )
}

/* ─── MemberRow ──────────────────────────── */
interface MemberRowProps {
    member: Member
    isAdmin?: boolean
    showActions?: boolean
    onRemove?: (id: string) => void
}

export function MemberRow({ member, isAdmin, showActions, onRemove }: MemberRowProps) {
    const reliability =
        member.onTimeRate >= 90 ? { label: 'Reliable', className: 'bg-[#E0FAF4] text-[#065F46]'  } :
            member.onTimeRate >= 70 ? { label: 'Good',     className: 'bg-amber-50 text-amber-700'    } :
                { label: 'New',       className: 'bg-gray-100 text-gray-500'     }

    return (
        <div className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
            <Avatar name={member.name} size="md" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-[#0A1628] truncate">{member.name}</p>
                    {isAdmin && (
                        <span className="text-[9px] font-bold text-[#00A07A] bg-[#E0FAF4] px-1.5 py-0.5 rounded-full flex-shrink-0">
              Admin
            </span>
                    )}
                </div>
                <p className="text-[11px] text-[#8A91A0]">
                    {member.totalPayments} payments · {Math.round(member.onTimeRate)}% on time
                </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
        <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', reliability.className)}>
          {reliability.label}
        </span>
                {showActions && onRemove && (
                    <button
                        onClick={() => onRemove(member.userId)}
                        className="text-[#8A91A0] hover:text-red-500 transition-colors text-xs font-medium underline underline-offset-2"
                    >
                        Remove
                    </button>
                )}
            </div>
        </div>
    )
}

/* ─── ContributionRow ────────────────────── */
interface ContributionRowProps {
    event: ContributionEvent
    showVerify?: boolean
    onVerify?: (id: string) => void
    onDispute?: (id: string) => void
}

export function ContributionRow({ event, showVerify, onVerify, onDispute }: ContributionRowProps) {
    const statusVariant =
        event.status === 'on-time'  ? 'ontime'   :
            event.status === 'late'     ? 'late'     :
                event.status === 'disputed' ? 'disputed' : 'pending'

    const statusLabel =
        event.status === 'on-time' ? 'On time' :
            event.status === 'late'    ? 'Late'    :
                event.status === 'disputed'? 'Disputed': 'Pending'

    return (
        <div className="flex items-center gap-3 py-3 border-b border-[#F7F8FA] last:border-0">
            <Avatar name={event.memberName} size="sm" />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0A1628] truncate">{event.memberName}</p>
                <p className="text-[11px] text-[#8A91A0]">
                    {new Date(event.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    {' · '}{event.paymentMethod.replace(/-/g, ' ')}
                    {event.reference && ` · ${event.reference}`}
                </p>
            </div>

            <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-[#0A1628]">{formatNaira(event.amount)}</p>
                <Badge variant={statusVariant as any}>{statusLabel}</Badge>
            </div>

            {showVerify && event.status === 'pending' && (
                <div className="flex gap-1.5 flex-shrink-0">
                    {onVerify && (
                        <button
                            onClick={() => onVerify(event.id)}
                            className="text-xs font-semibold text-[#00A07A] bg-[#E0FAF4] px-2 py-1 rounded-lg hover:bg-[#00C896] hover:text-white transition-colors"
                        >
                            Verify
                        </button>
                    )}
                    {onDispute && (
                        <button
                            onClick={() => onDispute(event.id)}
                            className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                            Dispute
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

/* ─── AuditTrail ─────────────────────────── */
export interface AuditEvent {
    id: string
    label: string
    sub: string
    hash?: string
}

interface AuditTrailProps {
    events: AuditEvent[]
}

export function AuditTrail({ events }: AuditTrailProps) {
    return (
        <div>
            {/* Notice */}
            <div className="bg-[#E0FAF4] border border-[#00C896]/20 rounded-xl px-4 py-3 flex items-start gap-2 mb-4">
                <Lock size={13} className="text-[#00A07A] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#065F46] leading-relaxed">
                    This record cannot be edited by anyone, including CircuFi.
                    Every verified event is permanently stored on Base.
                </p>
            </div>

            {/* Events */}
            {events.map(event => (
                <div
                    key={event.id}
                    className="flex items-start gap-3 py-3 border-b border-[#F7F8FA] last:border-0"
                >
                    <div className="w-6 h-6 rounded-full bg-[#E0FAF4] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lock size={10} className="text-[#00A07A]" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0A1628]">{event.label}</p>
                        <p className="text-[11px] text-[#8A91A0]">{event.sub}</p>
                        {event.hash && (
                            <button className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#8A91A0] hover:text-[#00A07A] transition-colors group">
                                <span className="truncate max-w-[160px]">{event.hash}</span>
                                <ExternalLink size={9} className="flex-shrink-0 group-hover:text-[#00A07A]" />
                            </button>
                        )}
                    </div>

                    <span className="text-[10px] font-semibold text-[#00A07A] bg-[#E0FAF4] px-1.5 py-0.5 rounded-full flex-shrink-0">
            Verified
          </span>
                </div>
            ))}
        </div>
    )
}