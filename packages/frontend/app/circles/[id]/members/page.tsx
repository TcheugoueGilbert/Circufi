'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { UserPlus, Shield, Users, AlertCircle, CheckCircle } from 'lucide-react'

interface Member {
  userId: string
  displayName: string
  phoneNumber: string
  trustScore: number
  onTimeRate: number
  totalPayments: number
  joinedAt: number
  status: 'active' | 'inactive' | 'removed'
  role: 'member' | 'admin'
}

interface Group {
  id: string
  name: string
  admin: {
    userId: string
    name: string
  }
  members: {
    [userId: string]: {
      joinedAt: number
      status: string
      role: string
    }
  }
}

export default function CircleMembersPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addMemberPhone, setAddMemberPhone] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchGroupAndMembers()
  }, [groupId])

  const fetchGroupAndMembers = async () => {
    try {
      const [groupRes, membersRes] = await Promise.all([
        api.get(`/v1/groups/${groupId}`),
        api.get(`/v1/groups/${groupId}/members`),
      ])

      if (groupRes.data.success) {
        setGroup(groupRes.data.data)
      }

      if (membersRes.data.success) {
        setMembers(membersRes.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingMember(true)
    setError('')

    try {
      const response = await api.post(`/v1/groups/${groupId}/members`, {
        phoneNumber: addMemberPhone,
      })

      if (response.data.success) {
        setAddMemberPhone('')
        setShowAddForm(false)
        await fetchGroupAndMembers()
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      await api.delete(`/v1/groups/${groupId}/members/${userId}`)
      await fetchGroupAndMembers()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to remove member')
    }
  }

  const isAdmin = currentUser?.id === group?.admin.userId

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/circles/${groupId}`)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to circle
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group?.name} Members</h1>
              <p className="text-gray-600 mt-1">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Add Member Form */}
        {showAddForm && isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={addMemberPhone}
                  onChange={(e) => setAddMemberPhone(e.target.value)}
                  placeholder="+234701234567"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.userId} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{member.displayName}</h3>
                      {member.role === 'admin' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      )}
                      {member.status === 'active' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{member.phoneNumber}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Trust Score</p>
                        <div className="flex items-baseline space-x-1">
                          <span className={`text-lg font-semibold ${getTrustScoreColor(member.trustScore).split(' ')[0]}`}>
                            {member.trustScore}
                          </span>
                          <span className="text-xs text-gray-400">/100</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">On-Time Rate</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {member.onTimeRate.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Payments</p>
                        <p className="text-lg font-semibold text-gray-900">{member.totalPayments}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => router.push(`/profile/${member.userId}`)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    View Profile
                  </button>
                  {isAdmin && member.role !== 'admin' && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No members yet</p>
              {isAdmin && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Add your first member
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
