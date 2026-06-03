// packages/frontend/src/pages/Profile.tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../packages/frontend/stores/authStore';
import api from '../services/api';
import TrustScoreCard from '../../packages/frontend/components/TrustScoreCard';

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [reputationHistory, setReputationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReputationHistory();
  }, []);

  const fetchReputationHistory = async () => {
    try {
      const response = await api.get(`/reputation/${user?.id}/history`);
      setReputationHistory(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reputation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'payment_on_time':
        return '✓';
      case 'payment_late':
        return '⚠️';
      case 'payment_missed':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'payment_on_time':
        return 'text-green-600';
      case 'payment_late':
        return 'text-yellow-600';
      case 'payment_missed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.displayName}</h2>
              <p className="text-gray-600">{user?.phoneNumber}</p>
              {user?.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Trust Score */}
        <TrustScoreCard trustScore={user?.reputation?.trustScore || 50} />
        
        {/* Reputation History */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Reputation History</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          ) : reputationHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">No reputation events yet.</p>
          ) : (
            <div className="space-y-3">
              {reputationHistory.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getEventIcon(event.eventType)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.reason}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${getEventColor(event.eventType)}`}>
                    {event.impact > 0 ? `+${event.impact}` : event.impact}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Stats Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Total Payments</p>
              <p className="text-2xl font-bold">{user?.reputation?.totalPayments || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">On-Time Rate</p>
              <p className="text-2xl font-bold">{Math.round(user?.reputation?.onTimeRate || 100)}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold">{Math.round(user?.reputation?.completionRate || 100)}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Groups Joined</p>
              <p className="text-2xl font-bold">{user?.groupIds?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;