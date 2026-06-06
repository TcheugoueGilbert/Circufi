import { clsx, type ClassValue } from 'clsx'

/* ─── Tailwind class merge ───────────────── */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}

/* ─── Currency ───────────────────────────── */
export const formatNaira = (amount: number): string =>
    `₦${amount.toLocaleString('en-NG')}`

export const parseNaira = (value: string): number =>
    parseInt(value.replace(/[₦,]/g, ''), 10) || 0

/* ─── Dates ──────────────────────────────── */
export const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateShort = (date: Date): string =>
    date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })

export const formatTime = (date: Date): string =>
    date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

export const formatRelative = (date: Date): string => {
    const diff = Date.now() - date.getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)

    if (mins < 1)   return 'just now'
    if (mins < 60)  return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7)   return `${days}d ago`
    return formatDateShort(date)
}

/* ─── Strings ────────────────────────────── */
export const getInitials = (name: string): string =>
    name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()

export const truncate = (str: string, max: number): string =>
    str.length > max ? `${str.slice(0, max)}…` : str

/* ─── Circle code ────────────────────────── */
export const generateCircleCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `${part1}-${part2}`
}

/* ─── Health score color ─────────────────── */
export const healthColor = (score: number): string =>
    score >= 85 ? 'text-green-600'  :
        score >= 70 ? 'text-amber-500'  :
            'text-red-500'

/* ─── On-time rate label ─────────────────── */
export const onTimeLabel = (rate: number): string =>
    rate >= 90 ? 'Reliable' :
        rate >= 70 ? 'Good'     :
            rate >= 50 ? 'Fair'     :
                'Needs attention'

/* ─── Payout pool ────────────────────────── */
export const calcPayoutPool = (contribution: number, members: number): number =>
    contribution * members

/* ─── Percentage ─────────────────────────── */
export const toPercent = (value: number, total: number): number =>
    total === 0 ? 0 : Math.round((value / total) * 100)