/**
 * Shared helpers for API tests: boots the Express app against the in-memory
 * database and provides a tiny "sign up + log in" helper.
 */
import request from 'supertest';

export const OTP = '123456'; // fixed code used when NODE_ENV === 'development'

export async function registerAndLogin(
  app: any,
  phoneNumber: string,
  displayName: string
): Promise<{ token: string; userId: string }> {
  await request(app).post('/api/v1/auth/register').send({ phoneNumber, displayName }).expect(201);
  const res = await request(app).post('/api/v1/auth/verify').send({ phoneNumber, code: OTP }).expect(200);
  return { token: res.body.data.token, userId: res.body.data.userId };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
