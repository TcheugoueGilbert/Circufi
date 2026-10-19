import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
    // Pages call versioned paths such as '/v1/groups', so the base URL ends at '/api'
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 second timeout
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
            useAuthStore.getState().logout()
            window.location.href = '/auth/login'
        }
        return Promise.reject(error)
    }
)

export default api