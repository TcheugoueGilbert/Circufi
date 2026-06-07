// packages/backend/src/services/GroupService.ts
import { db } from '../config/firebase';
import { Group, CreateGroupRequest, GroupMember, Rotation, GroupStats, User } from '@circufi/shared';
import { v4 as uuidv4 } from 'uuid';
import { reputationService } from './reputationService';

export class GroupService {
  
  static async createGroup(
    adminUserId: string,
    request: CreateGroupRequest
  ): Promise<Group> {
    const groupId = uuidv4();
    const now = Date.now();
    
    // Get admin user info
    const adminDoc = await db.collection('users').doc(adminUserId).get();
    const admin = adminDoc.data() as User;
    
    const group: Group = {
      id: groupId,
      name: request.name,
      description: request.description,
      admin: {
        userId: adminUserId,
        name: admin.displayName
      },
      rules: {
        contributionAmount: request.contributionAmount,
        currency: request.currency,
        frequency: request.frequency,
        nextPaymentDate: now + this.getFrequencyMilliseconds(request.frequency),
        maxMembers: request.maxMembers,
        minTrustScore: request.minTrustScore
      },
      members: {
        [adminUserId]: {
          joinedAt: now,
          status: 'active',
          role: 'admin'
        }
      },
      rotation: {
        cycle: 1,
        order: [adminUserId],
        currentBeneficiary: adminUserId,
        currentBeneficiaryIndex: 0,
        completedCycles: 0
      },
      stats: {
        totalCollected: 0,
        totalDisbursed: 0,
        healthScore: 50,
        completedCycles: 0,
        memberAverageTrustScore: admin.reputation?.trustScore || 50,
        paymentCompletionRate: 100
      },
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('groups').doc(groupId).set(group);
    
    // Update user's groups
    await db.collection('users').doc(adminUserId).update({
      groupIds: (admin.groupIds || []).concat([groupId]),
      adminGroupIds: (admin.adminGroupIds || []).concat([groupId])
    });
    
    return group;
  }
  
  static async addMember(groupId: string, adminUserId: string, phoneNumber: string): Promise<User> {
    // Find user by phone number
    const usersSnapshot = await db.collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      throw new Error('User not found with this phone number');
    }
    
    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data() as User;
    const userId = userDoc.id;
    
    // Check if already a member
    const groupDoc = await db.collection('groups').doc(groupId).get();
    const group = groupDoc.data() as Group;
    
    if (group.members[userId]) {
      throw new Error('User is already a member of this group');
    }
    
    // Check min trust score requirement
    if (group.rules.minTrustScore && (user.reputation?.trustScore || 50) < group.rules.minTrustScore) {
      throw new Error(`User does not meet minimum trust score requirement of ${group.rules.minTrustScore}`);
    }
    
    // Check max members limit
    if (group.rules.maxMembers && Object.keys(group.members).length >= group.rules.maxMembers) {
      throw new Error('Group has reached maximum member limit');
    }
    
    // Add member
    const now = Date.now();
    group.members[userId] = {
      joinedAt: now,
      status: 'active',
      role: 'member'
    };
    
    // Update rotation order
    group.rotation.order.push(userId);
    
    await db.collection('groups').doc(groupId).update({
      members: group.members,
      rotation: group.rotation,
      updatedAt: now
    });
    
    // Update user's groups
    await db.collection('users').doc(userId).update({
      groupIds: [...(user.groupIds || []), groupId],
      lastActive: now
    });
    
    // Update group health score
    await reputationService.updateGroupHealthScore(groupId);
    
    return user;
  }
  
  static async getGroupHealth(groupId: string): Promise<any> {
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }
    
    const group = groupDoc.data() as Group;
    const members = Object.keys(group.members);
    
    // Get member reliability scores
    const memberReliability: Record<string, number> = {};
    let totalTrustScore = 0;
    
    for (const memberId of members) {
      const userDoc = await db.collection('users').doc(memberId).get();
      if (userDoc.exists) {
        const user = userDoc.data() as User;
        const trustScore = user.reputation?.trustScore || 50;
        memberReliability[memberId] = trustScore;
        totalTrustScore += trustScore;
      }
    }
    
    const averageTrustScore = members.length > 0 ? totalTrustScore / members.length : 0;
    
    // Identify risk flags
    const riskFlags: string[] = [];
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', groupId)
      .where('status', '==', 'failed')
      .get();
    
    if (contributionsSnapshot.size > members.length * 0.2) {
      riskFlags.push('high_missed_payment_rate');
    }
    
    // Check for members with low trust scores
    const lowTrustMembers = Object.values(memberReliability).filter(score => score < 60).length;
    if (lowTrustMembers > members.length * 0.3) {
      riskFlags.push('high_percentage_low_trust_members');
    }
    
    const verificationRate = 100; // Mock for MVP
    
    return {
      groupHealthScore: group.stats.healthScore,
      memberReliability,
      riskFlags,
      verificationRate,
      averageTrustScore,
      groupRiskLevel: group.stats.healthScore >= 70 ? 'low' : group.stats.healthScore >= 50 ? 'medium' : 'high'
    };
  }
  
  private static getFrequencyMilliseconds(frequency: string): number {
    const multipliers: Record<string, number> = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      biweekly: 14 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };
    return multipliers[frequency] || multipliers.weekly;
  }
}