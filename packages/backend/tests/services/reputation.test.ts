/**
 * Unit tests for Reputation Service
 */

import { reputationService } from '../../src/services/reputationService';
import { User } from '../../src/types';

describe('ReputationService', () => {
  describe('calculateTrustScore', () => {
    it('should calculate correct trust score', () => {
      const user: User = {
        id: 'user1',
        phoneNumber: '+234701234567',
        displayName: 'Test User',
        verificationStatus: 'verified',
        joinedAt: Date.now(),
        lastActive: Date.now(),
        reputation: {
          totalPayments: 10,
          onTimeRate: 80,
          totalDisbursed: 2,
          trustScore: 50,
          flags: ['missed_1'],
        },
        groupIds: [],
        adminGroupIds: [],
      };

      const score = reputationService.calculateTrustScore(user);

      // Formula: 50 + (80 * 0.3) + (10 * 2) + (1 * -5)
      // 50 + 24 + 20 - 5 = 89
      expect(score).toBe(89);
    });

    it('should clamp score between 0 and 100', () => {
      const user: User = {
        id: 'user1',
        phoneNumber: '+234701234567',
        displayName: 'Test User',
        verificationStatus: 'verified',
        joinedAt: Date.now(),
        lastActive: Date.now(),
        reputation: {
          totalPayments: 0,
          onTimeRate: 0,
          totalDisbursed: 0,
          trustScore: 50,
          flags: ['missed_5', 'late_by_7_days', 'missed_payment', 'late_by_2_days'],
        },
        groupIds: [],
        adminGroupIds: [],
      };

      const score = reputationService.calculateTrustScore(user);

      // Should be clamped at 0
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give base score of 50 for new user', () => {
      const user: User = {
        id: 'user1',
        phoneNumber: '+234701234567',
        displayName: 'Test User',
        verificationStatus: 'verified',
        joinedAt: Date.now(),
        lastActive: Date.now(),
        reputation: {
          totalPayments: 0,
          onTimeRate: 0,
          totalDisbursed: 0,
          trustScore: 50,
          flags: [],
        },
        groupIds: [],
        adminGroupIds: [],
      };

      const score = reputationService.calculateTrustScore(user);

      expect(score).toBe(50);
    });
  });

  describe('isPaymentOnTime', () => {
    it('should return true if payment is on time', () => {
      const scheduled = new Date('2026-06-01').getTime();
      const actual = new Date('2026-05-31').getTime();

      const result = reputationService.isPaymentOnTime(scheduled, actual);

      expect(result).toBe(true);
    });

    it('should return true if payment is exactly on time', () => {
      const date = new Date('2026-06-01').getTime();

      const result = reputationService.isPaymentOnTime(date, date);

      expect(result).toBe(true);
    });

    it('should return false if payment is late', () => {
      const scheduled = new Date('2026-06-01').getTime();
      const actual = new Date('2026-06-03').getTime();

      const result = reputationService.isPaymentOnTime(scheduled, actual);

      expect(result).toBe(false);
    });
  });

  describe('getDaysLate', () => {
    it('should calculate days late correctly', () => {
      const scheduled = new Date('2026-06-01').getTime();
      const actual = new Date('2026-06-04').getTime();

      const days = reputationService.getDaysLate(scheduled, actual);

      expect(days).toBe(3);
    });

    it('should return 0 if payment is on time', () => {
      const scheduled = new Date('2026-06-01').getTime();
      const actual = new Date('2026-05-31').getTime();

      const days = reputationService.getDaysLate(scheduled, actual);

      expect(days).toBe(0);
    });
  });
});
