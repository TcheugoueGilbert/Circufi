// packages/frontend/src/pages/GroupDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../packages/frontend/stores/authStore';
import api from '../services/api';
import { Group, Contribution, User } from '@circufi/shared';
import ChatAssistant from '../../packages/frontend/components/ChatAssistant';
import TrustScoreCard from '../../packages/frontend/components/TrustScoreCard';

const GroupDetail: React.FC = () => {
  const { groupId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [groupHealth, setGroupHealth] = useState<any>(null);
  const [rotation, setRotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [showLogPayment, setShowLogPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'contributions' | 'chat'>('overview');

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      const [groupRes, contributionsRes, healthRes, rotationRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/contributions/group/${groupId}`),
        api.get(`/groups/${groupId}/health`),
        api.get(`/groups/${groupId}/rotation`)
      ]);
      
      setGroup(groupRes.data.data);
      setContributions(contributionsRes.data.data);
      setGroupHealth(healthRes.data.data);
      setRotation(rotationRes.data.data);
    } catch (error) {
      console.error('Failed to fetch group data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${groupId}/members`, { phoneNumber: newMemberPhone });
      setShowAddMember(false);
      setNewMemberPhone('');
      fetchGroupData();
      alert('Member added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = group?.rules.contributionAmount || 0;
    const scheduledDate = group?.rules.nextPaymentDate || Date.now();
    const actualDate = new Date(paymentDate).getTime();
    
    try {
      await api.post('/contributions', {
        groupId,
        amount,
        paymentMethod: 'manual',
        paymentReference,
        scheduledDate,
        actualDate,
        note: 'Payment logged manually'
      });
      setShowLogPayment(false);
      setPaymentDate('');
      setPaymentReference('');
      fetchGroupData();
      alert('Payment logged! Waiting for admin verification.');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to log payment');
    }
  };

  const isAdmin = group?.admin.userId === user?.id;
  const isCurrentBeneficiary = group?.rotation.currentBeneficiary === user?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-600 mt-1">Admin: {group.admin.name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Group Health Score</div>
            <div className="text-2xl font-bold text-green-600">{Math.round(group.stats.healthScore)}/100</div>
          </div>
        </div>
      </div>

      {/* Current Payout Info */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-green-100 text-sm">Current Beneficiary</p>
            <p className="text-2xl font-bold mt-1">
              {rotation?.currentBeneficiary === user?.id ? 'You!' : rotation?.currentBeneficiary}
            </p>
            <p className="text-green-100 text-sm mt-2">
              Next payment: {new Date(group.rules.nextPaymentDate).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-sm">Your Contribution Status</p>
            <p className="text-xl font-semibold">
              {rotation?.paymentProgress?.[user?.id || '']?.paid ? '✓ Paid' : '⏳ Pending'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {!rotation?.paymentProgress?.[user?.id || '']?.paid && (
          <button
            onClick={() => setShowLogPayment(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Log Payment
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setShowAddMember(true)}
            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
          >
            Add Member
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {(['overview', 'members', 'contributions', 'chat'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 font-medium text-sm capitalize transition ${
                activeTab === tab
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Group Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Total Collected</p>
                <p className="text-2xl font-bold">
                  {group.stats.totalCollected} {group.rules.currency}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Active Members</p>
                <p className="text-2xl font-bold">{Object.keys(group.members).length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Completed Cycles</p>
                <p className="text-2xl font-bold">{group.stats.completedCycles}</p>
              </div>
            </div>

            {/* Trust Score Overview */}
            <TrustScoreCard trustScore={user?.reputation?.trustScore || 50} />

            {/* Risk Flags */}
            {groupHealth?.riskFlags?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Group Risk Flags</h3>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {groupHealth.riskFlags.map((flag: string, index: number) => (
                    <li key={index}>{flag.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(group.members).map(([memberId, member]) => (
                  <tr key={memberId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {memberId === user?.id ? `${memberId} (You)` : memberId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className={`font-medium ${
                        groupHealth?.memberReliability?.[memberId] >= 70 ? 'text-green-600' :
                        groupHealth?.memberReliability?.[memberId] >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Math.round(groupHealth?.memberReliability?.[memberId] || 50)}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="space-y-4">
            {contributions.map((contribution) => (
              <div key={contribution.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {contribution.paidBy.displayName} → {contribution.currentBeneficiary.displayName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(contribution.actualDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {contribution.amount} {contribution.currency}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      contribution.status === 'completed' ? 'bg-green-100 text-green-800' :
                      contribution.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {contribution.status}
                    </span>
                  </div>
                </div>
                {contribution.note && (
                  <p className="text-sm text-gray-600 mt-2">{contribution.note}</p>
                )}
              </div>
            ))}
            {contributions.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No contributions yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <ChatAssistant groupId={groupId!} />
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Add Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="+2347012345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {showLogPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Log Payment</h3>
            <form onSubmit={handleLogPayment}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Amount
                </label>
                <input
                  type="text"
                  value={`${group.rules.contributionAmount} ${group.rules.currency}`}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Transaction ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Log Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogPayment(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;