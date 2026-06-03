// packages/backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../config/firebase';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  try {
    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    // Try JWT verification as fallback
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
  }
}

export function requireGroupAccess(groupId: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const groupDoc = await db.collection('groups').doc(groupId).get();
      if (!groupDoc.exists) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }
      
      const group = groupDoc.data();
      const isMember = group?.members?.[req.userId!] !== undefined;
      const isAdmin = group?.admin?.userId === req.userId;
      
      if (!isMember && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error checking group access' });
    }
  };
}