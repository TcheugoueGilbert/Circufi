'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

interface User {
  id: string
  phoneNumber?: string
  displayName: string
  email?: string
  verificationStatus: string
  joinedAt: number
  reputation: {
    totalPayments: number
    onTimeRate: number
    totalDisbursed: number
    trustScore: number
    flags: string[]
  }
  groupIds: string[]
  adminGroupIds: string[]
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const userId = params.userId as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/v1/users/${userId}`)
      if (response.data.success) {
        setUser(response.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getTrustScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === userId

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                {user.phoneNumber && <p className="text-gray-600">{user.phoneNumber}</p>}
                {user.email && <p className="text-gray-500 text-sm">{user.email}</p>}
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.verificationStatus === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user.verificationStatus === 'verified' ? '✓ Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Trust Score */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Trust Score</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-bold text-gray-900">{user.reputation.trustScore}</span>
                <span className="text-gray-500">/100</span>
              </div>
              <p className={`mt-2 text-sm font-medium ${getTrustScoreColor(user.reputation.trustScore).split(' ')[0]}`}>
                {getTrustScoreLabel(user.reputation.trustScore)} Rating
              </p>
            </div>
            <div className="w-32 h-32">
              <svg className="transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={
                    user.reputation.trustScore >= 80
                      ? '#10b981'
                      : user.reputation.trustScore >= 60
                      ? '#3b82f6'
                      : user.reputation.trustScore >= 40
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                  strokeWidth="10"
                  strokeDasharray={`${(user.reputation.trustScore / 100) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Reputation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Payments</p>
            <p className="text-3xl font-bold text-gray-900">{user.reputation.totalPayments}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">On-Time Rate</p>
            <p className="text-3xl font-bold text-gray-900">{user.reputation.onTimeRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Payouts Received</p>
            <p className="text-3xl font-bold text-gray-900">
              {user.reputation.totalDisbursed}
            </p>
          </div>
        </div>

        {/* Flags */}
        {user.reputation.flags.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Flags</h2>
            <div className="space-y-2">
              {user.reputation.flags.map((flag, index) => (
                <div key={index} className="flex items-center text-sm text-red-600">
                  <span className="mr-2">⚠</span>
                  {flag}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Memberships */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Group Memberships</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Member of</span>
              <span className="font-semibold text-gray-900">{user.groupIds.length} groups</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Admin of</span>
              <span className="font-semibold text-gray-900">{user.adminGroupIds.length} groups</span>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Member since {new Date(user.joinedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  )
}
