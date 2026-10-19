/**
 * Firebase initialization and database service
 */

import * as admin from 'firebase-admin';
import { User, Group, Contribution, ReputationEvent, ChatSession, Notification } from '../types';

/**
 * Firebase Realtime Database does not store empty arrays, so `[]` comes back as
 * `undefined`. These helpers restore the defaults the rest of the code relies on.
 */
function normalizeUser(user: User | null): User | null {
  if (!user) return null;
  return {
    ...user,
    groupIds: user.groupIds || [],
    adminGroupIds: user.adminGroupIds || [],
    reputation: { ...user.reputation, flags: user.reputation?.flags || [] },
  };
}

function normalizeGroup(group: Group | null): Group | null {
  if (!group) return null;
  return {
    ...group,
    members: group.members || {},
    rotation: { ...group.rotation, order: group.rotation?.order || [] },
  };
}

function normalizeSession(session: ChatSession | null): ChatSession | null {
  if (!session) return null;
  return { ...session, messages: session.messages || [] };
}

class FirebaseService {
  private database: admin.database.Database | null = null;

  /**
   * Lazily initialise the Firebase Admin SDK on first use so that importing
   * this module (unit tests, `tsc`, `next build`) never requires credentials.
   */
  private get db(): admin.database.Database {
    if (this.database) return this.database;

    const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_DATABASE_URL } =
      process.env;

    if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL || !FIREBASE_DATABASE_URL) {
      throw new Error(
        'Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, ' +
          'FIREBASE_CLIENT_EMAIL and FIREBASE_DATABASE_URL (see packages/backend/.env.example).'
      );
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: FIREBASE_DATABASE_URL,
      });
    }

    this.database = admin.database();
    return this.database;
  }

  // ========== USER OPERATIONS ==========
  async getUser(userId: string): Promise<User | null> {
    const snapshot = await this.db.ref(`users/${userId}`).get();
    return normalizeUser(snapshot.val());
  }

  async createUser(userId: string, user: User): Promise<void> {
    await this.db.ref(`users/${userId}`).set(user);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    await this.db.ref(`users/${userId}`).update(updates);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const snapshot = await this.db.ref('users').orderByChild('phoneNumber').equalTo(phoneNumber).get();
    const users = snapshot.val();
    if (!users) return null;

    const userKeys = Object.keys(users);
    return normalizeUser(users[userKeys[0]]);
  }

  async getAllUsers(): Promise<User[]> {
    const snapshot = await this.db.ref('users').get();
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val() as Record<string, User>).map((u) => normalizeUser(u)!);
  }

  // ========== GROUP OPERATIONS ==========
  async getGroup(groupId: string): Promise<Group | null> {
    const snapshot = await this.db.ref(`groups/${groupId}`).get();
    return normalizeGroup(snapshot.val());
  }

  async createGroup(groupId: string, group: Group): Promise<void> {
    await this.db.ref(`groups/${groupId}`).set(group);
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    await this.db.ref(`groups/${groupId}`).update(updates);
  }

  async getAllGroups(): Promise<Group[]> {
    const snapshot = await this.db.ref('groups').get();
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val() as Record<string, Group>).map((g) => normalizeGroup(g)!);
  }

  async getGroupByInviteCode(code: string): Promise<Group | null> {
    const snapshot = await this.db.ref('groups').orderByChild('inviteCode').equalTo(code).limitToFirst(1).get();
    const groups = snapshot.val() as Record<string, Group> | null;
    if (!groups) return null;
    return normalizeGroup(Object.values(groups)[0]);
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const groups: Group[] = [];
    for (const groupId of user.groupIds || []) {
      const group = await this.getGroup(groupId);
      if (group) groups.push(group);
    }
    return groups;
  }

  // ========== CONTRIBUTION OPERATIONS ==========
  async createContribution(groupId: string, contribution: Contribution): Promise<void> {
    await this.db.ref(`contributions/${groupId}/${contribution.id}`).set(contribution);
  }

  async getContribution(groupId: string, contributionId: string): Promise<Contribution | null> {
    const snapshot = await this.db.ref(`contributions/${groupId}/${contributionId}`).get();
    return snapshot.val();
  }

  async getGroupContributions(groupId: string): Promise<Contribution[]> {
    const snapshot = await this.db.ref(`contributions/${groupId}`).get();
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val() as Record<string, Contribution>);
  }

  async getUserContributions(groupId: string, userId: string): Promise<Contribution[]> {
    const contributions = await this.getGroupContributions(groupId);
    return contributions.filter((c) => c.paidBy.userId === userId);
  }

  async updateContribution(groupId: string, contributionId: string, updates: Partial<Contribution>): Promise<void> {
    await this.db.ref(`contributions/${groupId}/${contributionId}`).update(updates);
  }

  // ========== REPUTATION EVENTS ==========
  async createReputationEvent(userId: string, event: ReputationEvent): Promise<void> {
    await this.db.ref(`reputationEvents/${userId}/${event.id}`).set(event);
  }

  async getUserReputationEvents(userId: string): Promise<ReputationEvent[]> {
    const snapshot = await this.db.ref(`reputationEvents/${userId}`).get();
    if (!snapshot.exists()) return [];
    const events = Object.values(snapshot.val() as Record<string, ReputationEvent>);
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  // ========== CHAT SESSIONS ==========
  async createChatSession(userId: string, session: ChatSession): Promise<void> {
    await this.db.ref(`chatSessions/${userId}/${session.id}`).set(session);
  }

  async getChatSession(userId: string, sessionId: string): Promise<ChatSession | null> {
    const snapshot = await this.db.ref(`chatSessions/${userId}/${sessionId}`).get();
    return normalizeSession(snapshot.val());
  }

  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    const snapshot = await this.db.ref(`chatSessions/${userId}`).get();
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val() as Record<string, ChatSession>).map((c) => normalizeSession(c)!);
  }

  async updateChatSession(userId: string, sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    await this.db.ref(`chatSessions/${userId}/${sessionId}`).update(updates);
  }

  // ========== NOTIFICATIONS ==========
  async createNotification(userId: string, notification: Notification): Promise<void> {
    await this.db.ref(`notifications/${userId}/${notification.id}`).set(notification);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const snapshot = await this.db.ref(`notifications/${userId}`).get();
    if (!snapshot.exists()) return [];
    const notifications = Object.values(snapshot.val() as Record<string, Notification>);
    return notifications.sort((a, b) => b.createdAt - a.createdAt);
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    await this.db.ref(`notifications/${userId}/${notificationId}`).update({ read: true });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId);
    const updates: Record<string, boolean> = {};
    for (const n of notifications) {
      if (!n.read) updates[`notifications/${userId}/${n.id}/read`] = true;
    }
    if (Object.keys(updates).length > 0) {
      await this.db.ref().update(updates);
    }
  }

  // ========== BATCH OPERATIONS ==========
  async transaction<T>(callback: (ref: admin.database.Reference) => Promise<T>): Promise<T> {
    return callback(this.db.ref());
  }

  getDb(): admin.database.Database {
    return this.db;
  }
}

export const firebaseService = new FirebaseService();
