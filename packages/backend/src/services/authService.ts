/**
 * Authentication Service
 * Handles user registration, verification, and token generation
 */

import jwt from 'jsonwebtoken';
import { User } from '../types';
import { firebaseService } from './firebaseService';
import { generateId } from '../utils/helpers';
import * as crypto from 'crypto';

interface VerificationCode {
  code: string;
  userId: string;
  expiresAt: number;
  attempts: number;
}

// In-memory storage for verification codes (in production, use Redis)
const verificationCodes: Map<string, VerificationCode> = new Map();

const OTP_LENGTH = 6;
const DEV_OTP = '123456';

class AuthService {
  private jwtExpiration = (process.env.JWT_EXPIRATION || '7d') as jwt.SignOptions['expiresIn'];

  /**
   * The signing secret is read lazily. In production the server refuses to sign
   * tokens with a missing secret instead of silently falling back to a default.
   */
  private get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    return 'dev-only-insecure-secret';
  }

  /**
   * Register a new user
   */
  async register(phoneNumber: string, displayName: string, email?: string): Promise<{ userId: string; verificationRequired: boolean }> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('INVALID_PHONE_NUMBER');
    }

    // Check if phone number already exists
    const existingUser = await firebaseService.getUserByPhone(phoneNumber);
    if (existingUser) {
      throw new Error('PHONE_NUMBER_ALREADY_EXISTS');
    }

    // Generate user ID
    const userId = generateId();

    // Create new user
    const newUser: User = {
      id: userId,
      phoneNumber,
      displayName,
      email,
      verificationStatus: 'pending',
      joinedAt: Date.now(),
      lastActive: Date.now(),
      reputation: {
        totalPayments: 0,
        onTimeRate: 0,
        totalDisbursed: 0,
        trustScore: 50, // Base score
        flags: [],
      },
      groupIds: [],
      adminGroupIds: [],
    };

    // Save to Firebase
    await firebaseService.createUser(userId, newUser);

    // Generate and send verification code (mock - no actual SMS in MVP)
    const verificationCode = this.generateVerificationCode();
    verificationCodes.set(phoneNumber, {
      code: verificationCode,
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    });

    this.logMockSms(phoneNumber, verificationCode);

    return {
      userId,
      verificationRequired: true,
    };
  }

  /**
   * Verify phone number with OTP code
   */
  async verify(phoneNumber: string, code: string): Promise<{ userId: string; token: string; user: User }> {
    const verification = verificationCodes.get(phoneNumber);

    if (!verification) {
      throw new Error('NO_VERIFICATION_CODE_SENT');
    }

    if (verification.expiresAt < Date.now()) {
      verificationCodes.delete(phoneNumber);
      throw new Error('VERIFICATION_CODE_EXPIRED');
    }

    if (verification.attempts >= 3) {
      verificationCodes.delete(phoneNumber);
      throw new Error('TOO_MANY_ATTEMPTS');
    }

    if (verification.code !== code) {
      verification.attempts++;
      throw new Error('INVALID_VERIFICATION_CODE');
    }

    // Get user and mark as verified
    const user = await firebaseService.getUser(verification.userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    user.verificationStatus = 'verified';
    user.lastActive = Date.now();

    await firebaseService.updateUser(verification.userId, {
      verificationStatus: 'verified',
      lastActive: Date.now(),
    });

    // Clean up verification code
    verificationCodes.delete(phoneNumber);

    // Generate JWT token
    const token = this.generateToken(verification.userId);

    return {
      userId: verification.userId,
      token,
      user,
    };
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(phoneNumber: string): Promise<void> {
    const user = await firebaseService.getUserByPhone(phoneNumber);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Generate new verification code
    const verificationCode = this.generateVerificationCode();
    verificationCodes.set(phoneNumber, {
      code: verificationCode,
      userId: user.id,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    });

    this.logMockSms(phoneNumber, verificationCode);
  }

  /**
   * No SMS gateway is wired up yet (MVP). The code is only printed outside production.
   */
  private logMockSms(phoneNumber: string, code: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MOCK SMS] Verification code for ${phoneNumber}: ${code}`);
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, {
      expiresIn: this.jwtExpiration,
    });
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.jwtSecret) as { userId: string };
    } catch (error) {
      throw new Error('INVALID_TOKEN');
    }
  }

  /**
   * Generate a 6-digit one-time code (matches the OTP input in the frontend).
   * In development a fixed code is used so the flow can be tested without SMS.
   */
  private generateVerificationCode(): string {
    if (process.env.NODE_ENV === 'development') {
      return DEV_OTP;
    }
    return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Regex for international phone format: +[country code][number]
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phoneNumber);
  }
}

export const authService = new AuthService();
