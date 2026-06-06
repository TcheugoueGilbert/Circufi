/**
 * Integration tests for Authentication API
 */

import request from 'supertest';
import app from '../../src/app';

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          phoneNumber: '+234701234567',
          displayName: 'Test User',
          email: 'test@example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.verificationRequired).toBe(true);
    });

    it('should reject registration with invalid phone number', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          phoneNumber: 'invalid-phone',
          displayName: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration without display name', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          phoneNumber: '+234701234567',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/verify', () => {
    it('should verify user with correct code', async () => {
      // First register
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          phoneNumber: '+234701234568',
          displayName: 'Test User 2',
        });

      const phoneNumber = '+234701234568';

      // Then verify with test code
      const verifyResponse = await request(app)
        .post('/api/v1/auth/verify')
        .send({
          phoneNumber,
          code: '1234', // Default test code
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.token).toBeDefined();
      expect(verifyResponse.body.data.user).toBeDefined();
    });

    it('should reject verification with wrong code', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({
          phoneNumber: '+234701234569',
          code: '9999',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Server is running');
    });

    it('should return API version', async () => {
      const response = await request(app)
        .get('/api/version');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBeDefined();
    });
  });
});
