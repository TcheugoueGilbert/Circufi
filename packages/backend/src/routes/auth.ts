// packages/backend/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import { db, auth } from '../config/firebase';
import { User, RegisterRequest, RegisterResponse, VerifyRequest, VerifyResponse } from '@circufi/shared';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Mock OTP storage (in production, use Firebase SMS or a proper OTP service)
const otpStore = new Map<string, { code: string; expires: number }>();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, displayName, email }: RegisterRequest = req.body;
    
    // Validate phone number format
    if (!phoneNumber.match(/^\+\d{10,15}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }
    
    // Check if user exists
    const existingUser = await db.collection('users').where('phoneNumber', '==', phoneNumber).get();
    if (!existingUser.empty) {
      return res.status(409).json({ success: false, error: 'User already exists with this phone number' });
    }
    
    // Create user in Firebase Auth (or our own system for MVP)
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        phoneNumber,
        displayName,
        email: email || undefined,
      });
    } catch (authError) {
      // For MVP without actual Firebase Auth setup, create local user
      console.log('Using local user creation (Firebase Auth not fully configured)');
    }
    
    const userId = firebaseUser?.uid || uuidv4();
    const now = Date.now();
    
    const user: User = {
      id: userId,
      phoneNumber,
      displayName,
      email,
      verificationStatus: 'pending',
      referencePhone: undefined,
      joinedAt: now,
      lastActive: now,
      reputation: {
        totalPayments: 0,
        onTimeRate: 100,
        totalDisbursed: 0,
        trustScore: 50,
        flags: [],
        completionRate: 100,
        membershipDurationScore: 10,
        penaltyScore: 100
      },
      groupIds: [],
      adminGroupIds: []
    };
    
    await db.collection('users').doc(userId).set(user);
    
    // Generate and store OTP (mock - in production, send SMS)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phoneNumber, { code: otpCode, expires: now + 10 * 60 * 1000 });
    
    // In MVP, log the OTP for demo purposes
    console.log(`[MOCK OTP] For ${phoneNumber}: ${otpCode}`);
    
    const response: RegisterResponse = {
      userId,
      verificationRequired: true
    };
    
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, verificationCode }: VerifyRequest = req.body;
    
    const storedOTP = otpStore.get(phoneNumber);
    if (!storedOTP || storedOTP.code !== verificationCode || storedOTP.expires < Date.now()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
    }
    
    // Find user and mark as verified
    const userSnapshot = await db.collection('users').where('phoneNumber', '==', phoneNumber).get();
    if (userSnapshot.empty) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    const user = userDoc.data() as User;
    
    user.verificationStatus = 'verified';
    user.lastActive = Date.now();
    
    await db.collection('users').doc(userId).update({
      verificationStatus: 'verified',
      lastActive: Date.now()
    });
    
    // Clean up OTP
    otpStore.delete(phoneNumber);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId, phoneNumber, displayName: user.displayName },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    const response: VerifyResponse = {
      token,
      user: user
    };
    
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: userDoc.data() });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

export default router;