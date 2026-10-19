'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { ArrowRight, CheckCircle, Clock, Circle } from 'lucide-react'

interface RotationMember {
  userId: string
  displayName: string
  position: number
  hasBenefited: boolean
  benefitDate?: number
  amount?: number
}

interface RotationData {
  cycle: number
  currentBeneficiary: { userId: string; displayName: string }
  currentBeneficiaryIndex: number
  order: string[]
  members: RotationMember[]
  nextPaymentDate: number
  contributionAmount: number
  currency: string
}

export default function CircleRotationPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [rotation, setRotation] = useState<RotationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRotation()
  }, [groupId])

  const fetchRotation = async () => {
    try {
      const response = await api.get(`/v1/groups/${groupId}/rotation`)
      if (response.data.success) {
        setRotation(response.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load rotation data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !rotation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'No rotation data available'}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Payout Rotation</h1>
          <p className="text-gray-600 mt-1">
            Track the beneficiary rotation order and cycle progress
          </p>
        </div>

        {/* Current Cycle Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Cycle</p>
              <p className="text-3xl font-bold text-gray-900">{rotation.cycle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Contribution Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {rotation.contributionAmount.toLocaleString()} {rotation.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Next Payment Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(rotation.nextPaymentDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Rotation Progress</p>
            <p className="text-sm text-gray-600">
              {rotation.currentBeneficiaryIndex + 1} of {rotation.members.length}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{
                width: `${((rotation.currentBeneficiaryIndex + 1) / rotation.members.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {rotation.members.filter((m) => m.hasBenefited).length} members have received their payout
          </p>
        </div>

        {/* Rotation Order */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Rotation Order</h2>
          <div className="space-y-3">
            {rotation.members.map((member, index) => {
              const isCurrent = member.userId === rotation.currentBeneficiary.userId
              const isPast = member.hasBenefited && !isCurrent
              const isFuture = !member.hasBenefited && !isCurrent

              return (
                <div
                  key={member.userId}
                  className={`relative flex items-center p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50'
                      : isPast
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Position Number */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Member Info */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900">{member.displayName}</p>
                      {isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Current Beneficiary
                        </span>
                      )}
                      {isPast && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Received
                        </span>
                      )}
                      {isFuture && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          <Circle className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                    {member.benefitDate && (
                      <p className="text-sm text-gray-600 mt-1">
                        Received on {new Date(member.benefitDate).toLocaleDateString()}
                        {member.amount && (
                          <span className="ml-2 font-medium">
                            {member.amount.toLocaleString()} {rotation.currency}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Arrow to next */}
                  {index < rotation.members.length - 1 && (
                    <div className="absolute -bottom-6 left-5 text-gray-400">
                      <ArrowRight className="w-5 h-5 rotate-90" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How Rotation Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Members contribute in each cycle</li>
            <li>• One member receives the full payout each cycle</li>
            <li>• Rotation follows a fixed order until everyone benefits</li>
            <li>• After all members benefit, a new round begins</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
