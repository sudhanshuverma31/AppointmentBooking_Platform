import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User.js';
import Owner from '../models/Owner.js';

const JWT_SECRET = process.env.JWT_SECRET || 'care_sync_super_secret_jwt_key_2026';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.token;

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401).json({ message: 'User not found or session invalid' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};

export const attachOwnerProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const owner = await Owner.findOne({ userId: req.user._id });
    if (!owner) {
      res.status(404).json({ message: 'Owner profile not found' });
      return;
    }

    req.owner = owner;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Failed to load owner profile' });
    return;
  }
};
