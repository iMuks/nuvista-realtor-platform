import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User } from '../models';
import { config } from '../config';
import { AuthRequest, TokenPayload, UserRole } from '../types';

// ─── Protect Routes ──────────────────────────────────────
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookie
    else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Not authorized. Please log in.',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User no longer exists or is deactivated.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
    });
  }
};

// ─── Role-based Access ───────────────────────────────────
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Not authorized for this action.',
      });
      return;
    }
    next();
  };
};

// ─── Generate JWT Token ──────────────────────────────────
export const generateToken = (userId: string, role: UserRole): string => {
  return jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
};

// ─── Set Token Cookie ────────────────────────────────────
export const sendTokenResponse = (
  user: { _id: Types.ObjectId | string; role: UserRole },
  statusCode: number,
  res: Response
): void => {
  const token = generateToken(user._id.toString(), user.role);

  const cookieOptions = {
    expires: new Date(
      Date.now() + config.jwt.cookieExpiresIn * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict' as const,
  };

  res.status(statusCode).cookie('jwt', token, cookieOptions).json({
    success: true,
    data: { token },
  });
};
