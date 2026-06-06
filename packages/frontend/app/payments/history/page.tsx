'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { DollarSign, CheckCircle, Clock, XCircle, Filter } from 'lucide-react'

interface Payment {
  id: string
  groupId: string
  groupName: string
  amount: number
  currency: string
  paymentMethod: string
  scheduledDate: number
  actualDate: number
  isOnTime: boolean
  status: 'pending' | 'completed' | 'failed' | 'disputed'
  currentBeneficiary: {
    userId: string
    displayName: string
  }
  note?: string
  verifiedBy?: {
    userId: string
    timestamp: number
  }
}

export default function PaymentHistoryPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  useEffect(() => {
    if (user) {
      fetchPaymentHistory()
    }
  }, [user])

  const fetchPaymentHistory = async () => {
    try {
      const response = await api.get(`/v1/contributions/user/${user?.id}`)
      if (response.data.success) {
        setPayments(response.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true
    return payment.status === filter
  })

  const stats = {
    total: payments.length,
    completed: payments.filter((p) => p.status === 'completed').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    failed: payments.filter((p) => p.status === 'failed').length,
    totalAmount: payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    onTimeRate:
      payments.length > 0
        ? (payments.filter((p) => p.isOnTime && p.status === 'completed').length / payments.length) * 100
        : 0,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">All your contributions across all circles</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Payments</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">On-Time Rate</p>
            <p className="text-3xl font-bold text-blue-600">{stats.onTimeRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex space-x-2">
              {(['all', 'completed', 'pending', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && (
                    <span className="ml-2">
                      ({f === 'completed' ? stats.completed : f === 'pending' ? stats.pending : stats.failed})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payments found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Show all payments
                </button>
              )}
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(payment.status)}
                      <h3 className="font-semibold text-gray-900">{payment.groupName}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                      {payment.isOnTime && payment.status === 'completed' && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          On Time
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-600">Amount</p>
                        <p className="font-semibold text-gray-900">
                          {payment.amount.toLocaleString()} {payment.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Beneficiary</p>
                        <p className="font-semibold text-gray-900">
                          {payment.currentBeneficiary.displayName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Payment Method</p>
                        <p className="font-semibold text-gray-900 capitalize">
                          {payment.paymentMethod.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(payment.actualDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {payment.note && (
                      <p className="text-sm text-gray-600 mt-3 italic">Note: {payment.note}</p>
                    )}

                    {payment.verifiedBy && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ Verified on {new Date(payment.verifiedBy.timestamp).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => router.push(`/circles/${payment.groupId}`)}
                    className="ml-4 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    View Circle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
