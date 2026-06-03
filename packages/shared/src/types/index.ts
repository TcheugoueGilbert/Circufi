// packages/shared/src/types/index.ts
export interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
  email?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  referencePhone?: string;
  joinedAt: number;
  lastActive: number;
  reputation: Reputation;
  groupIds: string[];
  adminGroupIds: string[];
}

export interface Reputation {
  totalPayments: number;
  onTimeRate: number;
  totalDisbursed: number;
  trustScore: number;
  flags: string[];
  completionRate: number;
  membershipDurationScore: number;
  penaltyScore: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  admin: GroupAdmin;
  rules: GroupRules;
  members: Record<string, GroupMember>;
  rotation: Rotation;
  stats: GroupStats;
  createdAt: number;
  updatedAt: number;
}

export interface GroupAdmin {
  userId: string;
  name: string;
}

export interface GroupRules {
  contributionAmount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  nextPaymentDate: number;
  maxMembers?: number;
  minTrustScore?: number;
}

export interface GroupMember {
  joinedAt: number;
  status: 'active' | 'inactive' | 'removed';
  role: 'member' | 'admin';
}

export interface Rotation {
  cycle: number;
  order: string[];
  currentBeneficiary: string;
  currentBeneficiaryIndex: number;
  completedCycles: number;
}

export interface GroupStats {
  totalCollected: number;
  totalDisbursed: number;
  healthScore: number;
  completedCycles: number;
  memberAverageTrustScore: number;
  paymentCompletionRate: number;
}

export interface Contribution {
  id: string;
  groupId: string;
  paidBy: ContributionParty;
  amount: number;
  currency: string;
  currentBeneficiary: ContributionParty;
  paymentMethod: 'manual' | 'mobile_money' | 'bank_transfer';
  paymentReference?: string;
  scheduledDate: number;
  actualDate: number;
  isOnTime: boolean;
  status: 'pending' | 'completed' | 'failed' | 'disputed';
  note?: string;
  verifiedBy?: VerifiedBy;
  createdAt: number;
  updatedAt: number;
}

export interface ContributionParty {
  userId: string;
  displayName: string;
}

export interface VerifiedBy {
  userId: string;
  timestamp: number;
}

export interface ReputationEvent {
  id: string;
  userId: string;
  groupId?: string;
  eventType: 'payment_on_time' | 'payment_late' | 'payment_missed' | 'dispute_resolved' | 'verified' | 'flagged';
  impact: number;
  reason: string;
  oldScore?: number;
  newScore?: number;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  groupId: string;
  messages: ChatMessage[];
  context: ChatContext;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatContext {
  currentBeneficiary: string;
  nextPaymentDate: number;
  myPaymentStatus: string;
  myTrustScore: number;
  groupHealthScore: number;
}

export interface TrustScoreComponents {
  completionRate: number;
  onTimeRate: number;
  membershipDurationScore: number;
  penaltyScore: number;
}

export interface GroupHealthResponse {
  groupHealthScore: number;
  memberReliability: Record<string, number>;
  riskFlags: string[];
  verificationRate: number;
  averageTrustScore: number;
  groupRiskLevel: 'low' | 'medium' | 'high';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request/Response DTOs
export interface RegisterRequest {
  phoneNumber: string;
  displayName: string;
  email?: string;
}

export interface RegisterResponse {
  userId: string;
  verificationRequired: boolean;
}

export interface VerifyRequest {
  phoneNumber: string;
  verificationCode: string;
}

export interface VerifyResponse {
  token: string;
  user: User;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  contributionAmount: number;
  currency: string;
  frequency: GroupRules['frequency'];
  maxMembers?: number;
  minTrustScore?: number;
}

export interface CreateGroupResponse {
  groupId: string;
  group: Group;
}

export interface AddMemberRequest {
  phoneNumber: string;
}

export interface LogContributionRequest {
  groupId: string;
  amount: number;
  paymentMethod: Contribution['paymentMethod'];
  paymentReference?: string;
  scheduledDate: number;
  actualDate: number;
  note?: string;
}

export interface ChatRequest {
  groupId: string;
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  sessionId: string;
  messages: ChatMessage[];
  context: ChatContext;
}