import { Request, Response } from 'express';
import { User } from '../models';
import { AuthRequest } from '../types';
import { sendTokenResponse } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, phone, brokerage, licenseNumber } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    brokerage,
    licenseNumber,
  });

  sendTokenResponse(user, 201, res);
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, data: null });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id);
  res.status(200).json({ success: true, data: user });
});

// PUT /api/auth/me
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'brokerage',
      'licenseNumber', 'bio', 'avatar',
    ];
    const updates: Record<string, any> = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user!._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  }
);
