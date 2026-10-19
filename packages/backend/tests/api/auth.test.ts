/**
 * Integration tests for the authentication API (in-memory database).
 */
process.env.NODE_ENV = 'development'; // fixed OTP (123456) and no SMS gateway

import request from 'supertest';

jest.mock('../../src/services/firebaseService', () => {
  const { InMemoryFirebase } = require('../helpers/inMemoryFirebase');
  return { firebaseService: new InMemoryFirebase() };
});

import app from '../../src/app';
import { firebaseService } from '../../src/services/firebaseService';
import { OTP } from '../helpers/testApp';

const db = firebaseService as any;

beforeEach(() => db.reset());

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registers a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ phoneNumber: '+2347012345670', displayName: 'Test User', email: 'test@example.com' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBeDefined();
      expect(res.body.data.verificationRequired).toBe(true);
    });

    it('rejects a phone number that is not in international format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ phoneNumber: '0812 345 6789', displayName: 'Test User' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PHONE_NUMBER');
    });

    it('rejects registration without display name', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ phoneNumber: '+2347012345670' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a duplicate phone number', async () => {
      const body = { phoneNumber: '+2347012345670', displayName: 'Test User' };
      await request(app).post('/api/v1/auth/register').send(body).expect(201);
      const res = await request(app).post('/api/v1/auth/register').send(body);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/verify', () => {
    it('verifies the user with the correct code and returns a JWT', async () => {
      const phoneNumber = '+2347012345671';
      await request(app).post('/api/v1/auth/register').send({ phoneNumber, displayName: 'Test User 2' });

      const res = await request(app).post('/api/v1/auth/verify').send({ phoneNumber, code: OTP });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user.displayName).toBe('Test User 2');
      expect((await db.getUserByPhone(phoneNumber)).verificationStatus).toBe('verified');
    });

    it('rejects a wrong code and locks out after three attempts', async () => {
      const phoneNumber = '+2347012345672';
      await request(app).post('/api/v1/auth/register').send({ phoneNumber, displayName: 'Test' });

      for (let i = 0; i < 3; i++) {
        const res = await request(app).post('/api/v1/auth/verify').send({ phoneNumber, code: '000000' });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_VERIFICATION_CODE');
      }
      const locked = await request(app).post('/api/v1/auth/verify').send({ phoneNumber, code: OTP });
      expect(locked.status).toBe(429);
    });

    it('rejects verification when no code was requested', async () => {
      const res = await request(app).post('/api/v1/auth/verify').send({ phoneNumber: '+2347012345679', code: OTP });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('NO_VERIFICATION_CODE_SENT');
    });
  });

  describe('POST /api/v1/auth/resend (login flow)', () => {
    it('sends a new code to an existing user, who can then log in', async () => {
      const phoneNumber = '+2347012345673';
      await request(app).post('/api/v1/auth/register').send({ phoneNumber, displayName: 'Returning' });
      await request(app).post('/api/v1/auth/verify').send({ phoneNumber, code: OTP }).expect(200);

      await request(app).post('/api/v1/auth/resend').send({ phoneNumber }).expect(200);
      const login = await request(app).post('/api/v1/auth/verify').send({ phoneNumber, code: OTP });
      expect(login.status).toBe(200);
    });

    it('returns 404 for an unknown user', async () => {
      const res = await request(app).post('/api/v1/auth/resend').send({ phoneNumber: '+2347099999999' });
      expect(res.status).toBe(404);
    });
  });

  describe('Protected routes', () => {
    it('rejects requests without a token', async () => {
      const res = await request(app).get('/api/v1/groups');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('MISSING_TOKEN');
    });

    it('rejects an invalid token', async () => {
      const res = await request(app).get('/api/v1/groups').set('Authorization', 'Bearer nope');
      expect(res.status).toBe(401);
    });
  });

  describe('Health Check', () => {
    it('returns health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Server is running');
    });

    it('returns API version', async () => {
      const res = await request(app).get('/api/version');
      expect(res.status).toBe(200);
      expect(res.body.data.version).toBeDefined();
    });
  });
});
