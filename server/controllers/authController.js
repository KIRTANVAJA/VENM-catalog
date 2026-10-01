import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { generateToken } from '../utils/token.js';
import { logActivity } from '../utils/activityLogger.js';

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'EMAIL AND PASSWORD ARE REQUIRED' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    return res.status(401).json({ message: 'INVALID ADMIN CREDENTIALS' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'INVALID ADMIN CREDENTIALS' });
  }

  const token = generateToken(user);

  // Set HTTP-only cookie
  res.cookie('venm_admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Log successful admin login
  await logActivity({
    adminUserId: user.id,
    adminEmail: user.email,
    action: 'ADMIN_LOGIN',
    entityType: 'AUTH',
    description: `Admin logged in (${user.email})`
  });

  res.json({
    message: 'AUTHENTICATION SUCCESSFUL',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

export const logoutAdmin = async (req, res) => {
  if (req.user) {
    await logActivity({
      adminUserId: req.user.id,
      adminEmail: req.user.email,
      action: 'ADMIN_LOGOUT',
      entityType: 'AUTH',
      description: `Admin logged out (${req.user.email})`
    });
  }
  res.clearCookie('venm_admin_token');
  res.json({ message: 'LOGGED OUT SUCCESSFULLY' });
};

export const getMe = async (req, res) => {
  res.json({
    user: req.user
  });
};
