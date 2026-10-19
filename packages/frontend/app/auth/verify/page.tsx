'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export default function VerifyPage() {
  // useSearchParams() needs a Suspense boundary so the page can be prerendered
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  )
}

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get('phone')
  const { login } = useAuthStore()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (!phoneNumber) {
      router.push('/auth/signup')
    }
  }, [phoneNumber, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/v1/auth/verify', {
        phoneNumber,
        code,
      })

      if (response.data.success) {
        const { token, user } = response.data.data
        login(token, user)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    setError('')

    try {
      await api.post('/v1/auth/resend', { phoneNumber })
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Verify Your Phone
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the verification code sent to
            <br />
            <span className="font-semibold">{phoneNumber}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">Code resent successfully!</p>
            </div>
          )}

          <div>
            <label htmlFor="code" className="sr-only">
              Verification Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Enter the 6-digit code
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : "Didn't receive code? Resend"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/auth/signup')}
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to signup
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
