'use client'
import { useState, useEffect, useCallback } from 'react'
import { DEMO_USER, DEMO_CIRCLES, DEMO_NOTIFICATIONS } from '@/lib/data'
import type { Circle, User, Notification } from '@/types'

/* ─── useAuth ────────────────────────────── */
export function useAuth() {
    const [user,    setUser]    = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock: swap for real Firebase Auth
        const timer = setTimeout(() => {
            setUser(DEMO_USER)
            setLoading(false)
        }, 300)
        return () => clearTimeout(timer)
    }, [])

    const signOut = useCallback(() => {
        setUser(null)
        window.location.href = '/landing'
    }, [])

    return { user, loading, signOut, isAuthenticated: !!user }
}

/* ─── useCircles ─────────────────────────── */
export function useCircles() {
    const [circles, setCircles] = useState<Circle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock: swap for real Firestore query
        const timer = setTimeout(() => {
            setCircles(DEMO_CIRCLES)
            setLoading(false)
        }, 400)
        return () => clearTimeout(timer)
    }, [])

    return { circles, loading }
}

/* ─── useCircle ──────────────────────────── */
export function useCircle(id: string) {
    const [circle,  setCircle]  = useState<Circle | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        const timer = setTimeout(() => {
            const found = DEMO_CIRCLES.find(c => c.id === id) ?? DEMO_CIRCLES[0]
            setCircle(found)
            setLoading(false)
        }, 300)
        return () => clearTimeout(timer)
    }, [id])

    return { circle, loading }
}

/* ─── useNotifications ───────────────────── */
export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount,   setUnread]        = useState(0)

    useEffect(() => {
        setNotifications(DEMO_NOTIFICATIONS)
        setUnread(DEMO_NOTIFICATIONS.filter(n => !n.read).length)
    }, [])

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnread(0)
    }, [])

    const markRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
        setUnread(prev => Math.max(0, prev - 1))
    }, [])

    return { notifications, unreadCount, markAllRead, markRead }
}

/* ─── useLocalStorage ────────────────────── */
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue
        try {
            const stored = window.localStorage.getItem(key)
            return stored ? JSON.parse(stored) : initialValue
        } catch {
            return initialValue
        }
    })

    const set = useCallback((val: T | ((prev: T) => T)) => {
        try {
            const next = val instanceof Function ? val(value) : val
            setValue(next)
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(next))
            }
        } catch {
            // ignore
        }
    }, [key, value])

    return [value, set] as const
}

/* ─── useDisclosure ──────────────────────── */
export function useDisclosure(initial = false) {
    const [isOpen, setIsOpen] = useState(initial)

    const open  = useCallback(() => setIsOpen(true),  [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggle= useCallback(() => setIsOpen(v => !v), [])

    return { isOpen, open, close, toggle }
}

/* ─── usePaymentForm ─────────────────────── */
export function usePaymentForm() {
    const [method,    setMethod]    = useState('Bank Transfer')
    const [reference, setReference] = useState('')
    const [note,      setNote]      = useState('')
    const [date,      setDate]      = useState(new Date().toISOString().split('T')[0])
    const [loading,   setLoading]   = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const reset = useCallback(() => {
        setMethod('Bank Transfer')
        setReference('')
        setNote('')
        setDate(new Date().toISOString().split('T')[0])
        setSubmitted(false)
    }, [])

    const submit = useCallback(async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 1000))
        setLoading(false)
        setSubmitted(true)
    }, [])

    return {
        method, setMethod,
        reference, setReference,
        note, setNote,
        date, setDate,
        loading, submitted,
        submit, reset,
    }
}