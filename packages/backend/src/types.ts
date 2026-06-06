/**
 * Types and interfaces for Digital Osusu Backend
 */

// User/Member Profile
export interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
  email?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  referencePhone?: string;
  joinedAt: number; // timestamp
  lastActive: number; // timestamp

  // Reputation
  reputation: {
    totalPayments: number;
    onTimeRate: number; // 0-100
    totalDisbursed: number;
    trustScore: number; // 0-100
    flags: string[];
  };

  // Groups
  groupIds: string[];
  adminGroupIds: string[];
}

// Group/Circle/Osusu
export interface Group {
  id: string;
  name: string;
  description?: string;

  admin: {
    userId: string;
    name: string;
  };

  rules: {
    contributionAmount: number;
    currency: string; // "NGN", "KES", "USD"
    frequency: 'weekly' | 'biweekly' | 'monthly';
    nextPaymentDate: number; // timestamp
    maxMembers?: number;
    minTrustScore?: number;
  };

  members: {
    [userId: string]: {
      joinedAt: number;
      status: 'active' | 'inactive' | 'removed';
      role: 'member' | 'admin';
    };
  };

  rotation: {
    cycle: number;
    order: string[]; // ordered list of user IDs
    currentBeneficiary: string;
    currentBeneficiaryIndex: number;
  };

  stats: {
    totalCollected: number;
    totalDisbursed: number;
    healthScore: number; // 0-100
    completedCycles: number;
  };

  createdAt: number;
  updatedAt: number;
}

// Contribution/Payment Record
export interface Contribution {
  id: string;
  groupId: string;

  paidBy: {
    userId: string;
    displayName: string;
  };

  amount: number;
  currency: string;

  currentBeneficiary: {
    userId: string;
    displayName: string;
  };

  paymentMethod: 'manual' | 'mobile_money' | 'bank_transfer';
  paymentReference?: string;

  scheduledDate: number; // timestamp
  actualDate: number; // timestamp
  isOnTime: boolean;

  status: 'pending' | 'completed' | 'failed' | 'disputed';
  note?: string;

  verifiedBy?: {
    userId: string;
    timestamp: number;
  };
}

// Reputation Event (Audit Trail)
export interface ReputationEvent {
  id: string;
  userId: string;
  groupId?: string;

  eventType:
    | 'payment_on_time'
    | 'payment_late'
    | 'payment_missed'
    | 'dispute_resolved'
    | 'verified'
    | 'flagged';

  impact: number; // -10 to +10
  reason: string;

  timestamp: number;
}

// Chat Session
export interface ChatSession {
  id: string;
  userId: string;
  groupId: string;

  messages: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }[];

  context: {
    currentBeneficiary: string;
    nextPaymentDate: number;
    myPaymentStatus: string;
  };

  createdAt: number;
  updatedAt: number;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: 'payment_reminder' | 'payment_received' | 'member_joined' | 'payment_missed' | 'system';
  groupId?: string;
  message: string;
  read: boolean;
  createdAt: number;
}

// API Response Wrappers
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
