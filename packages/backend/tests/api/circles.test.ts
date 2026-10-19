/**
 * Integration tests: circles (groups), membership, contributions, reputation, notifications.
 */
process.env.NODE_ENV = 'development';

import request from 'supertest';

jest.mock('../../src/services/firebaseService', () => {
  const { InMemoryFirebase } = require('../helpers/inMemoryFirebase');
  return { firebaseService: new InMemoryFirebase() };
});

import app from '../../src/app';
import { firebaseService } from '../../src/services/firebaseService';
import { registerAndLogin, bearer } from '../helpers/testApp';

const db = firebaseService as any;

const CIRCLE = { name: 'Ikeja Market Women', contributionAmount: 25000, currency: 'NGN', frequency: 'monthly', maxMembers: 3 };

let admin: { token: string; userId: string };
let ada: { token: string; userId: string };
let bola: { token: string; userId: string };
let outsider: { token: string; userId: string };

async function createCircle(body: object = CIRCLE) {
  const res = await request(app).post('/api/v1/groups').set(bearer(admin.token)).send(body);
  return res;
}

beforeEach(async () => {
  db.reset();
  admin = await registerAndLogin(app, '+2348010000001', 'Mama Chisom');
  ada = await registerAndLogin(app, '+2348010000002', 'Adaeze');
  bola = await registerAndLogin(app, '+2348010000003', 'Bola');
  outsider = await registerAndLogin(app, '+2348010000004', 'Outsider');
});

describe('Circles', () => {
  it('creates a circle with a flat payload and returns an invite code', async () => {
    const res = await createCircle();
    expect(res.status).toBe(201);
    expect(res.body.data.inviteCode).toMatch(/^OSU-[A-Z0-9]{4}$/);
    expect(res.body.data.memberCount).toBe(1);
  });

  it('also accepts the nested `rules` payload used by older clients', async () => {
    const res = await createCircle({
      name: 'Nested',
      rules: { contributionAmount: 10000, currency: 'NGN', frequency: 'weekly' },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.rules.contributionAmount).toBe(10000);
  });

  it('rejects an invalid frequency', async () => {
    const res = await createCircle({ ...CIRCLE, frequency: 'daily' });
    expect(res.status).toBe(400);
  });

  it('lists only the circles of the caller (works for a brand-new user with empty arrays)', async () => {
    await createCircle();
    const mine = await request(app).get('/api/v1/groups').set(bearer(admin.token));
    expect(mine.body.data).toHaveLength(1);
    const none = await request(app).get('/api/v1/groups').set(bearer(ada.token));
    expect(none.body.data).toHaveLength(0);
  });

  it('lets a user preview a circle by invite code and join it', async () => {
    const created = await createCircle();
    const { inviteCode, id } = created.body.data;

    const preview = await request(app).get(`/api/v1/groups/code/${inviteCode.toLowerCase()}`).set(bearer(ada.token));
    expect(preview.status).toBe(200);
    expect(preview.body.data.id).toBe(id);
    expect(preview.body.data.members).toBeUndefined(); // no member IDs before joining

    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(200);
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(409);

    const members = await request(app).get(`/api/v1/groups/${id}/members`).set(bearer(ada.token));
    expect(members.body.data.map((m: any) => m.displayName)).toEqual(['Mama Chisom', 'Adaeze']);
    expect(members.body.data[1].rotationPosition).toBe(2);

    const notes = await request(app).get(`/api/v1/notifications/${admin.userId}`).set(bearer(admin.token));
    expect(notes.body.data[0].type).toBe('member_joined');
  });

  it('returns 404 for an unknown invite code', async () => {
    const res = await request(app).get('/api/v1/groups/code/OSU-ZZZZ').set(bearer(ada.token));
    expect(res.status).toBe(404);
  });

  it('enforces the member limit', async () => {
    const { id } = (await createCircle()).body.data; // maxMembers = 3, admin is #1
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(200);
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(bola.token)).expect(200);
    const res = await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(outsider.token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('GROUP_FULL');
  });

  it('hides circle data from non-members', async () => {
    const { id } = (await createCircle()).body.data;
    for (const path of ['', '/members', '/rotation', '/health']) {
      const res = await request(app).get(`/api/v1/groups/${id}${path}`).set(bearer(outsider.token));
      expect(res.status).toBe(403);
    }
    await request(app).get(`/api/v1/groups/${id}`).expect(401);
  });

  it('lets only the admin add members by phone number', async () => {
    const { id } = (await createCircle()).body.data;
    await request(app).post(`/api/v1/groups/${id}/members`).set(bearer(ada.token)).send({ phoneNumber: '+2348010000003' }).expect(403);
    await request(app).post(`/api/v1/groups/${id}/members`).set(bearer(admin.token)).send({ phoneNumber: '+2348010000003' }).expect(200);
    await request(app).post(`/api/v1/groups/${id}/members`).set(bearer(admin.token)).send({ phoneNumber: '+2348019999999' }).expect(404);
  });

  it('removes a member from the rotation and protects the admin', async () => {
    const { id } = (await createCircle()).body.data;
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(200);
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(bola.token)).expect(200);

    await request(app).delete(`/api/v1/groups/${id}/members/${admin.userId}`).set(bearer(admin.token)).expect(400);
    await request(app).delete(`/api/v1/groups/${id}/members/${ada.userId}`).set(bearer(admin.token)).expect(200);

    const rotation = await request(app).get(`/api/v1/groups/${id}/rotation`).set(bearer(admin.token));
    expect(rotation.body.data.order).toEqual([admin.userId, bola.userId]);
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(403); // removed members cannot self-rejoin
  });

  it('advances the rotation and completes a cycle after the last member', async () => {
    const { id } = (await createCircle()).body.data;
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(200);

    await request(app).post(`/api/v1/groups/${id}/rotation/advance`).set(bearer(ada.token)).expect(403);

    const first = await request(app).post(`/api/v1/groups/${id}/rotation/advance`).set(bearer(admin.token));
    expect(first.body.data).toMatchObject({ cycle: 1, currentBeneficiary: ada.userId, cycleCompleted: false });

    const second = await request(app).post(`/api/v1/groups/${id}/rotation/advance`).set(bearer(admin.token));
    expect(second.body.data).toMatchObject({ cycle: 2, currentBeneficiary: admin.userId, cycleCompleted: true });
  });
});

describe('Contributions and reputation', () => {
  let groupId: string;

  beforeEach(async () => {
    groupId = (await createCircle()).body.data.id;
    await request(app).post(`/api/v1/groups/${groupId}/join`).set(bearer(ada.token)).expect(200);
  });

  const pay = (token: string, extra: object = {}) =>
    request(app)
      .post('/api/v1/contributions')
      .set(bearer(token))
      .send({ groupId, amount: 25000, paymentMethod: 'bank_transfer', actualDate: Date.now(), ...extra });

  it('records a contribution as pending and notifies the beneficiary', async () => {
    const res = await pay(ada.token);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    const notes = await request(app).get(`/api/v1/notifications/${admin.userId}`).set(bearer(admin.token));
    expect(notes.body.data.some((n: any) => n.type === 'payment_received')).toBe(true);
  });

  it('rejects a wrong amount and non-members', async () => {
    expect((await pay(ada.token, { amount: 100 })).status).toBe(400);
    expect((await pay(outsider.token)).status).toBe(403);
  });

  it('does not let a member verify their own payment', async () => {
    const { id } = (await pay(ada.token)).body.data;
    await request(app).put(`/api/v1/contributions/${id}`).set(bearer(ada.token)).send({ status: 'completed' }).expect(403);
    await request(app).post(`/api/v1/contributions/${id}/verify`).set(bearer(ada.token)).expect(403);
  });

  it('lets the admin verify a payment, which updates reputation', async () => {
    const { id, isOnTime } = (await pay(ada.token, { actualDate: Date.now() - 24 * 3600 * 1000 })).body.data;
    expect(isOnTime).toBe(true);

    await request(app).post(`/api/v1/contributions/${id}/verify`).set(bearer(admin.token)).expect(200);

    const rep = await request(app).get(`/api/v1/reputation/${ada.userId}`).set(bearer(ada.token));
    expect(rep.body.data.totalPayments).toBe(1);
    expect(rep.body.data.onTimeRate).toBe(100);
    expect(rep.body.data.trustScore).toBeGreaterThan(50);
    expect(rep.body.data.recentEvents[0].eventType).toBe('payment_on_time');
  });

  it('flags a late payment', async () => {
    const late = Date.now() + 45 * 24 * 3600 * 1000; // monthly circle: due date is ~30 days away
    const { id, isOnTime } = (await pay(ada.token, { actualDate: late })).body.data;
    expect(isOnTime).toBe(false);
    await request(app).post(`/api/v1/contributions/${id}/verify`).set(bearer(admin.token)).expect(200);
    const events = await request(app).get(`/api/v1/reputation/${ada.userId}/events`).set(bearer(ada.token));
    expect(events.body.data.events[0].eventType).toBe('payment_late');
  });

  it('returns group contributions to members only, and personal history only to the owner', async () => {
    await pay(ada.token);
    const group = await request(app).get(`/api/v1/contributions/${groupId}`).set(bearer(admin.token));
    expect(group.body.data.contributions).toHaveLength(1);
    await request(app).get(`/api/v1/contributions/${groupId}`).set(bearer(outsider.token)).expect(403);

    const mine = await request(app).get(`/api/v1/contributions/user/${ada.userId}`).set(bearer(ada.token));
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].groupName).toBe('Ikeja Market Women');
    await request(app).get(`/api/v1/contributions/user/${ada.userId}`).set(bearer(admin.token)).expect(403);
  });
});

describe('Health and rotation views', () => {
  it('exposes the metrics the circle health and rotation pages render', async () => {
    const { id } = (await createCircle()).body.data;
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(200);
    const paid = await request(app)
      .post('/api/v1/contributions')
      .set(bearer(ada.token))
      .send({ groupId: id, amount: 25000, paymentMethod: 'mobile_money', actualDate: Date.now() });
    await request(app).post(`/api/v1/contributions/${paid.body.data.id}/verify`).set(bearer(admin.token)).expect(200);

    const health = await request(app).get(`/api/v1/groups/${id}/health`).set(bearer(admin.token));
    expect(health.body.data).toMatchObject({
      groupName: 'Ikeja Market Women',
      totalMembers: 2,
      totalCollected: 25000,
      onTimePaymentRate: 100,
      trend: 'stable',
    });
    expect(health.body.data.recommendations.length).toBeGreaterThan(0);

    // the confirmed payment is persisted on the circle itself (used by the dashboard cards)
    const circle = await request(app).get(`/api/v1/groups/${id}`).set(bearer(admin.token));
    expect(circle.body.data.stats.totalCollected).toBe(25000);

    const rotation = await request(app).get(`/api/v1/groups/${id}/rotation`).set(bearer(admin.token));
    expect(rotation.body.data).toMatchObject({ contributionAmount: 25000, currency: 'NGN', currentBeneficiaryIndex: 0 });
    expect(rotation.body.data.members.map((m: any) => m.displayName)).toEqual(['Mama Chisom', 'Adaeze']);
    expect(rotation.body.data.currentBeneficiary.userId).toBe(admin.userId);
  });
});

describe('Notifications and profile', () => {
  it('marks notifications as read and blocks access to other users', async () => {
    const { id } = (await createCircle()).body.data;
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(200);

    await request(app).get(`/api/v1/notifications/${admin.userId}`).set(bearer(ada.token)).expect(403);
    await request(app).put(`/api/v1/notifications/${admin.userId}/mark-read`).set(bearer(admin.token)).expect(200);

    const res = await request(app).get(`/api/v1/notifications/${admin.userId}`).set(bearer(admin.token));
    expect(res.body.data.every((n: any) => n.read)).toBe(true);
  });

  it('hides phone number and email from users who share no circle', async () => {
    await request(app).put(`/api/v1/users/${ada.userId}`).set(bearer(ada.token)).send({ email: 'ada@example.com' }).expect(200);

    const stranger = await request(app).get(`/api/v1/users/${ada.userId}`).set(bearer(outsider.token));
    expect(stranger.status).toBe(200);
    expect(stranger.body.data.displayName).toBe('Adaeze');
    expect(stranger.body.data.phoneNumber).toBeUndefined();
    expect(stranger.body.data.email).toBeUndefined();

    const { id } = (await createCircle()).body.data;
    await request(app).post(`/api/v1/groups/${id}/join`).set(bearer(ada.token)).expect(200);
    const sameCircle = await request(app).get(`/api/v1/users/${ada.userId}`).set(bearer(admin.token));
    expect(sameCircle.body.data.phoneNumber).toBe('+2348010000002');

    const self = await request(app).get(`/api/v1/users/${ada.userId}`).set(bearer(ada.token));
    expect(self.body.data.email).toBe('ada@example.com');
  });

  it('lets a user update only their own profile', async () => {
    const ok = await request(app).put(`/api/v1/users/${ada.userId}`).set(bearer(ada.token)).send({ displayName: 'Adaeze O.', email: 'ada@example.com' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.displayName).toBe('Adaeze O.');
    await request(app).put(`/api/v1/users/${ada.userId}`).set(bearer(bola.token)).send({ displayName: 'Hacked' }).expect(403);
    await request(app).get(`/api/v1/users/${ada.userId}`).expect(401);
  });
});
