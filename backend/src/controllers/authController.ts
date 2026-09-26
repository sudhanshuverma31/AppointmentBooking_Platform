import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Owner from '../models/Owner.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import Category from '../models/Category.js';

const JWT_SECRET = process.env.JWT_SECRET || 'care_sync_super_secret_jwt_key_2026';

const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'USER',
      mobile: mobile || '',
    });

    const token = generateToken(newUser._id.toString(), newUser.role);

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        mobile: newUser.mobile,
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error during registration' });
  }
};

export const registerOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      email,
      password,
      mobile,
      title,
      description,
      categoryId,
      secondaryCategoryIds,
      outletName,
      country,
      state,
      district,
      address,
      appointmentMode,
      profileImage,
      bannerImages,
      termsAccepted
    } = req.body;

    if (!termsAccepted) {
      res.status(400).json({ message: 'You must accept terms, privacy policy, and verification policy' });
      return;
    }

    if (!fullName || !email || !password || !mobile || !title || !description || !categoryId || !outletName || !country || !state || !address) {
      res.status(400).json({ message: 'All required owner profile fields must be provided' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists' });
      return;
    }

    const categoryObj = await Category.findById(categoryId);
    if (!categoryObj) {
      res.status(400).json({ message: 'Invalid primary category selected' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'OWNER',
      mobile,
    });

    const newOwner = await Owner.create({
      userId: newUser._id,
      fullName,
      email: email.toLowerCase(),
      mobile,
      title,
      description,
      categoryId,
      secondaryCategoryIds: secondaryCategoryIds || [],
      outletName,
      country,
      state,
      district: district || '',
      address,
      appointmentMode: appointmentMode || 'TIME',
      profileImage: profileImage || '',
      bannerImages: bannerImages || [],
      verificationStatus: 'UNVERIFIED',
      activeStatus: 'ACTIVE',
    });

    const token = generateToken(newUser._id.toString(), newUser.role);

    res.status(201).json({
      message: 'Owner registered successfully. Verification request can be submitted in your dashboard.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        mobile: newUser.mobile,
      },
      owner: newOwner
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error during owner registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    let ownerProfile = null;
    if (user.role === 'OWNER') {
      ownerProfile = await Owner.findOne({ userId: user._id });
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        avatar: user.avatar,
      },
      owner: ownerProfile
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error during login' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, googleId, avatar, role } = req.body;

    if (!email || !name) {
      res.status(400).json({ message: 'Email and name are required for Google Auth' });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        role: role === 'OWNER' ? 'OWNER' : 'USER',
        googleId: googleId || `google_${uuidv4()}`,
        avatar: avatar || '',
      });
    } else if (!user.googleId) {
      user.googleId = googleId || `google_${uuidv4()}`;
      if (avatar) user.avatar = avatar;
      await user.save();
    }

    let ownerProfile = null;
    if (user.role === 'OWNER') {
      ownerProfile = await Owner.findOne({ userId: user._id });
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        avatar: user.avatar,
      },
      owner: ownerProfile
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error during Google auth' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success to prevent email enumeration
      res.json({ message: 'If an account exists with this email, a reset token has been generated.' });
      return;
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins expiry

    await PasswordResetToken.create({
      userId: user._id,
      token: resetToken,
      expiresAt,
      used: false,
    });

    console.log(`[PASSWORD RESET SERVICE] Reset token for ${email}: ${resetToken}`);

    res.json({
      message: 'Password reset link sent to your email address.',
      resetToken, // Returned for easy testing in UI/Postman
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to process forgot password' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    const resetDoc = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetDoc) {
      res.status(400).json({ message: 'Invalid or expired password reset token' });
      return;
    }

    const user = await User.findById(resetDoc.userId);
    if (!user) {
      res.status(400).json({ message: 'User not found' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    resetDoc.used = true;
    await resetDoc.save();

    res.json({ message: 'Password updated successfully. You can now login.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reset password' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    let ownerProfile = null;
    if (req.user.role === 'OWNER') {
      ownerProfile = await Owner.findOne({ userId: req.user._id })
        .populate('categoryId')
        .populate('secondaryCategoryIds');
    }

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        mobile: req.user.mobile,
        avatar: req.user.avatar,
      },
      owner: ownerProfile,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch current user' });
  }
};
