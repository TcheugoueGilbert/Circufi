import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/lib/types'

interface AuthState {
    token: string | null
    user: AuthUser | null
    login: (token: string, user: AuthUser) => void
    setToken: (token: string) => void
    setUser: (user: AuthUser) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            login:    (token, user) => set({ token, user }),
            setToken: (token) => set({ token }),
            setUser:  (user)  => set({ user }),
            logout:   ()      => set({ token: null, user: null }),
        }),
        { name: 'circufi-auth' }
    )
)
