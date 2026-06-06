/**
 * Firebase initialization and database service
 */

import * as admin from 'firebase-admin';
import { User, Group, Contribution, ReputationEvent, ChatSession, Notification } from '../types';

class FirebaseService {
  private db: admin.database.Database;
  private realtimeDb: admin.database.Database;

  constructor() {
    // Initialize Firebase Admin
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }

    this.db = admin.database();
    this.realtimeDb = admin.database();
  }

  // ========== USER OPERATIONS ==========
  async getUser(userId: string): Promise<User | null> {
    const snapshot = await this.db.ref(`users/${userId}`).get();
    return snapshot.val();
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
    return users[userKeys[0]];
  }

  async getAllUsers(): Promise<User[]> {
    const snapshot = await this.db.ref('users').get();
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val() as Record<string, User>);
  }

  // ========== GROUP OPERATIONS ==========
  async getGroup(groupId: string): Promise<Group | null> {
    const snapshot = await this.db.ref(`groups/${groupId}`).get();
    return snapshot.val();
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
    return Object.values(snapshot.val() as Record<string, Group>);
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const groups: Group[] = [];
    for (const groupId of user.groupIds) {
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
    return snapshot.val();
  }

  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    const snapshot = await this.db.ref(`chatSessions/${userId}`).get();
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val() as Record<string, ChatSession>);
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

  // ========== BATCH OPERATIONS ==========
  async transaction<T>(callback: (ref: admin.database.Reference) => Promise<T>): Promise<T> {
    return callback(this.db.ref());
  }

  getDb(): admin.database.Database {
    return this.db;
  }
}

export const firebaseService = new FirebaseService();
