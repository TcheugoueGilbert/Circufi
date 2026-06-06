'use client'
import { useState, useEffect } from 'react'

export function useTheme() {
    const [dark, setDark] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('cf-theme')
        if (stored) {
            setDark(stored === 'dark')
        } else {
            setDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
        }
    }, [])

    const toggle = () => {
        setDark(v => {
            const next = !v
            localStorage.setItem('cf-theme', next ? 'dark' : 'light')
            return next
        })
    }

    return { dark, toggle }
}