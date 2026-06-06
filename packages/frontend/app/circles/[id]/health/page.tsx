'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { TrendingUp, TrendingDown, Activity, Users, DollarSign, AlertTriangle } from 'lucide-react'

interface HealthData {
  groupId: string
  groupName: string
  healthScore: number
  averageTrustScore: number
  paymentCompletionRate: number
  totalMembers: number
  activeMembers: number
  totalCollected: number
  totalDisbursed: number
  onTimePaymentRate: number
  latePayments: number
  missedPayments: number
  flaggedMembers: number
  trend: 'improving' | 'stable' | 'declining'
  recommendations: string[]
}

export default function CircleHealthPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHealthData()
  }, [groupId])

  const fetchHealthData = async () => {
    try {
      const response = await api.get(`/v1/groups/${groupId}/health`)
      if (response.data.success) {
        setHealth(response.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load health data')
    } finally {
      setLoading(false)
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' }
    if (score >= 60) return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }
    if (score >= 40) return { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' }
    return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
  }

  const getHealthLabel = (score: number) => {
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

  if (error || !health) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'No health data available'}</p>
          <button
            onClick={() => router.push(`/circles/${groupId}`)}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to circle
          </button>
        </div>
      </div>
    )
  }

  const healthColor = getHealthScoreColor(health.healthScore)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/circles/${groupId}`)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to circle
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{health.groupName} Health</h1>
          <p className="text-gray-600 mt-1">Overall group performance and metrics</p>
        </div>

        {/* Overall Health Score */}
        <div className={`rounded-lg border-2 ${healthColor.border} ${healthColor.bg} p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Overall Health Score</p>
              <div className="flex items-baseline space-x-2">
                <span className={`text-6xl font-bold ${healthColor.text}`}>{health.healthScore}</span>
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <span className={`text-lg font-semibold ${healthColor.text}`}>
                  {getHealthLabel(health.healthScore)}
                </span>
                {health.trend === 'improving' && <TrendingUp className="w-5 h-5 text-green-600" />}
                {health.trend === 'declining' && <TrendingDown className="w-5 h-5 text-red-600" />}
                {health.trend === 'stable' && <Activity className="w-5 h-5 text-gray-600" />}
                <span className="text-sm text-gray-600 capitalize">{health.trend}</span>
              </div>
            </div>
            <div className="w-40 h-40">
              <svg className="transform -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={healthColor.text.replace('text-', '')}
                  strokeWidth="20"
                  strokeDasharray={`${(health.healthScore / 100) * 440} 440`}
                  strokeLinecap="round"
                  className={healthColor.text}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Average Trust Score</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{health.averageTrustScore.toFixed(1)}</p>
            <p className="text-sm text-gray-600 mt-1">Across all members</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Payment Completion</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{health.paymentCompletionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">On-time rate: {health.onTimePaymentRate.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Total Collected</h3>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {health.totalCollected.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Disbursed: {health.totalDisbursed.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Active Members</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {health.activeMembers}/{health.totalMembers}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {((health.activeMembers / health.totalMembers) * 100).toFixed(0)}% active
            </p>
          </div>
        </div>

        {/* Issues & Alerts */}
        {(health.latePayments > 0 || health.missedPayments > 0 || health.flaggedMembers > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              Issues & Alerts
            </h2>
            <div className="space-y-3">
              {health.latePayments > 0 && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">Late Payments</span>
                  <span className="font-semibold text-yellow-600">{health.latePayments}</span>
                </div>
              )}
              {health.missedPayments > 0 && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">Missed Payments</span>
                  <span className="font-semibold text-red-600">{health.missedPayments}</span>
                </div>
              )}
              {health.flaggedMembers > 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Flagged Members</span>
                  <span className="font-semibold text-red-600">{health.flaggedMembers}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {health.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Recommendations</h2>
            <ul className="space-y-2">
              {health.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start text-sm text-blue-800">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
