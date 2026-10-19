/**
 * In-memory stand-in for FirebaseService, used by the API tests so they run
 * without Firebase credentials or network access. It mirrors the public API of
 * src/services/firebaseService.ts (including the "empty arrays come back as []" normalisation).
 */
import { User, Group, Contribution, ReputationEvent, ChatSession, Notification } from '../../src/types';

const clone = <T>(v: T): T => (v === undefined || v === null ? v : JSON.parse(JSON.stringify(v)));

export class InMemoryFirebase {
  users = new Map<string, User>();
  groups = new Map<string, Group>();
  contributions = new Map<string, Map<string, Contribution>>();
  reputationEvents = new Map<string, ReputationEvent[]>();
  chatSessions = new Map<string, Map<string, ChatSession>>();
  notifications = new Map<string, Map<string, Notification>>();

  reset() {
    this.users.clear();
    this.groups.clear();
    this.contributions.clear();
    this.reputationEvents.clear();
    this.chatSessions.clear();
    this.notifications.clear();
  }

  // users
  async getUser(id: string) { return clone(this.users.get(id) ?? null); }
  async createUser(id: string, user: User) { this.users.set(id, clone(user)); }
  async updateUser(id: string, updates: Partial<User>) {
    const cur = this.users.get(id);
    if (cur) this.users.set(id, { ...cur, ...clone(updates) } as User);
  }
  async getUserByPhone(phone: string) {
    return clone([...this.users.values()].find((u) => u.phoneNumber === phone) ?? null);
  }
  async getAllUsers() { return clone([...this.users.values()]); }

  // groups
  async getGroup(id: string) { return clone(this.groups.get(id) ?? null); }
  async createGroup(id: string, group: Group) { this.groups.set(id, clone(group)); }
  async updateGroup(id: string, updates: Partial<Group>) {
    const cur = this.groups.get(id);
    if (cur) this.groups.set(id, { ...cur, ...clone(updates) } as Group);
  }
  async getAllGroups() { return clone([...this.groups.values()]); }
  async getGroupByInviteCode(code: string) {
    return clone([...this.groups.values()].find((g) => g.inviteCode === code) ?? null);
  }
  async getUserGroups(userId: string) {
    const user = this.users.get(userId);
    if (!user) return [];
    return clone(user.groupIds.map((id) => this.groups.get(id)).filter(Boolean) as Group[]);
  }

  // contributions
  async createContribution(groupId: string, c: Contribution) {
    if (!this.contributions.has(groupId)) this.contributions.set(groupId, new Map());
    this.contributions.get(groupId)!.set(c.id, clone(c));
  }
  async getContribution(groupId: string, id: string) {
    return clone(this.contributions.get(groupId)?.get(id) ?? null);
  }
  async getGroupContributions(groupId: string) {
    return clone([...(this.contributions.get(groupId)?.values() ?? [])]);
  }
  async getUserContributions(groupId: string, userId: string) {
    return (await this.getGroupContributions(groupId)).filter((c) => c.paidBy.userId === userId);
  }
  async updateContribution(groupId: string, id: string, updates: Partial<Contribution>) {
    const cur = this.contributions.get(groupId)?.get(id);
    if (cur) this.contributions.get(groupId)!.set(id, { ...cur, ...clone(updates) } as Contribution);
  }

  // reputation events
  async createReputationEvent(userId: string, event: ReputationEvent) {
    const list = this.reputationEvents.get(userId) ?? [];
    list.push(clone(event));
    this.reputationEvents.set(userId, list);
  }
  async getUserReputationEvents(userId: string) {
    return clone([...(this.reputationEvents.get(userId) ?? [])].sort((a, b) => b.timestamp - a.timestamp));
  }

  // chat
  async createChatSession(userId: string, s: ChatSession) {
    if (!this.chatSessions.has(userId)) this.chatSessions.set(userId, new Map());
    this.chatSessions.get(userId)!.set(s.id, clone(s));
  }
  async getChatSession(userId: string, id: string) { return clone(this.chatSessions.get(userId)?.get(id) ?? null); }
  async getUserChatSessions(userId: string) { return clone([...(this.chatSessions.get(userId)?.values() ?? [])]); }
  async updateChatSession(userId: string, id: string, updates: Partial<ChatSession>) {
    const cur = this.chatSessions.get(userId)?.get(id);
    if (cur) this.chatSessions.get(userId)!.set(id, { ...cur, ...clone(updates) } as ChatSession);
  }

  // notifications
  async createNotification(userId: string, n: Notification) {
    if (!this.notifications.has(userId)) this.notifications.set(userId, new Map());
    this.notifications.get(userId)!.set(n.id, clone(n));
  }
  async getUserNotifications(userId: string) {
    return clone([...(this.notifications.get(userId)?.values() ?? [])].sort((a, b) => b.createdAt - a.createdAt));
  }
  async markNotificationAsRead(userId: string, id: string) {
    const n = this.notifications.get(userId)?.get(id);
    if (n) n.read = true;
  }
  async markAllNotificationsAsRead(userId: string) {
    this.notifications.get(userId)?.forEach((n) => { n.read = true; });
  }
}
