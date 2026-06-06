import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

/* ─── Card ─────────────────────────────────────────── */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
    padding?: 'sm' | 'md' | 'lg' | 'none'
}
export function Card({ padding = 'md', className, children, ...props }: CardProps) {
    const pads = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' }
    return (
        <div
            className={clsx('bg-white rounded-xl border border-[#E8EAF0]', pads[padding], className)}
            {...props}
        >
            {children}
        </div>
    )
}

/* ─── Badge ─────────────────────────────────────────── */
type BadgeVariant = 'ontime' | 'late' | 'pending' | 'disputed' | 'active' | 'complete' | 'new'

const badgeStyles: Record<BadgeVariant, string> = {
    ontime:   'bg-[#E0FAF4] text-[#065F46]',
    active:   'bg-[#E0FAF4] text-[#065F46]',
    complete: 'bg-green-50 text-green-700',
    late:     'bg-amber-50 text-amber-700',
    pending:  'bg-gray-100 text-gray-500',
    disputed: 'bg-red-50 text-red-600',
    new:      'bg-blue-50 text-blue-700',
}

interface BadgeProps {
    variant: BadgeVariant
    children: React.ReactNode
    className?: string
}
export function Badge({ variant, children, className }: BadgeProps) {
    return (
        <span className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
            badgeStyles[variant],
            className
        )}>
      {children}
    </span>
    )
}

/* ─── Avatar ────────────────────────────────────────── */
const AVATAR_COLORS = [
    'bg-violet-600', 'bg-[#00A07A]', 'bg-blue-600',
    'bg-rose-600',   'bg-amber-600', 'bg-emerald-600',
    'bg-indigo-600', 'bg-pink-600',
]

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const avatarSizes: Record<AvatarSize, string> = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
}

interface AvatarProps {
    name: string
    size?: AvatarSize
    className?: string
    /** Optional Unsplash/photo URL — shows image instead of initials */
    src?: string
}
export function Avatar({ name, size = 'md', className, src }: AvatarProps) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    const color    = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={clsx('rounded-full object-cover flex-shrink-0', avatarSizes[size], className)}
            />
        )
    }

    return (
        <div className={clsx(
            'rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0',
            color, avatarSizes[size], className
        )}>
            {initials}
        </div>
    )
}

/* ─── AvatarStack ───────────────────────────────────── */
interface AvatarStackProps {
    names: string[]
    srcs?: string[]
    max?: number
}
export function AvatarStack({ names, srcs, max = 4 }: AvatarStackProps) {
    const visible  = names.slice(0, max)
    const overflow = names.length - max

    return (
        <div className="flex items-center">
            {visible.map((name, i) => (
                <div key={i} className={clsx(i > 0 && '-ml-1.5', 'ring-2 ring-white rounded-full')}>
                    <Avatar name={name} size="xs" src={srcs?.[i]} />
                </div>
            ))}
            {overflow > 0 && (
                <div className="-ml-1.5 ring-2 ring-white w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[8px] font-semibold text-gray-600">
                    +{overflow}
                </div>
            )}
        </div>
    )
}

/* ─── ProgressBar ───────────────────────────────────── */
interface ProgressBarProps {
    value: number
    color?: 'teal' | 'amber' | 'red'
    showLabel?: boolean
    label?: string
    className?: string
}
export function ProgressBar({ value, color = 'teal', showLabel = false, label, className }: ProgressBarProps) {
    const fills = { teal: 'bg-[#00C896]', amber: 'bg-amber-400', red: 'bg-red-400' }
    const texts = { teal: 'text-[#00A07A]', amber: 'text-amber-600', red: 'text-red-500' }

    return (
        <div className={clsx('w-full', className)}>
            {(showLabel || label) && (
                <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#8A91A0]">{label}</span>
                    <span className={clsx('font-semibold', texts[color])}>{Math.round(value)}%</span>
                </div>
            )}
            <div className="h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div
                    className={clsx('h-full rounded-full transition-all duration-500', fills[color])}
                    style={{ width: `${Math.min(100, value)}%` }}
                />
            </div>
        </div>
    )
}

/* ─── Divider ───────────────────────────────────────── */
interface DividerProps { label?: string; className?: string }
export function Divider({ label, className }: DividerProps) {
    return (
        <div className={clsx('flex items-center gap-3', className)}>
            <div className="flex-1 h-px bg-[#E8EAF0]" />
            {label && <span className="text-xs text-[#8A91A0]">{label}</span>}
            <div className="flex-1 h-px bg-[#E8EAF0]" />
        </div>
    )
}

/* ─── SectionTitle ──────────────────────────────────── */
interface SectionTitleProps {
    title: string
    action?: React.ReactNode
    className?: string
}
export function SectionTitle({ title, action, className }: SectionTitleProps) {
    return (
        <div className={clsx('flex items-center justify-between mb-3', className)}>
            <span className="text-sm font-semibold text-[#0A1628]">{title}</span>
            {action}
        </div>
    )
}

/* ─── EmptyState ────────────────────────────────────── */
interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {icon && <div className="text-[#E8EAF0] mb-4">{icon}</div>}
            <p className="text-sm font-semibold text-[#0A1628] mb-1">{title}</p>
            {description && <p className="text-xs text-[#8A91A0] mb-4 max-w-[200px]">{description}</p>}
            {action}
        </div>
    )
}

/* ─── Modal ─────────────────────────────────────────── */
interface ModalProps {
    open: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    footer?: React.ReactNode
}
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null
    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-[#0A1628]/40 backdrop-blur-sm" />
            <div
                className={clsx(
                    'relative bg-white w-full md:max-w-md',
                    'rounded-t-2xl md:rounded-2xl',
                    'p-5 md:p-6 z-10 shadow-xl'
                )}
                onClick={e => e.stopPropagation()}
            >
                {title && (
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-[#0A1628]">{title}</h3>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[#8A91A0] hover:bg-gray-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {children}
                {footer && <div className="mt-4 flex flex-col gap-2">{footer}</div>}
            </div>
        </div>
    )
}