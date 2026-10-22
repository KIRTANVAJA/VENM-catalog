import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { generateToken } from '../utils/token.js';
import { logActivity } from '../utils/activityLogger.js';

export const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'USERNAME AND PASSWORD ARE REQUIRED' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        message: 'DATABASE CONFIGURATION MISSING',
        error: 'DATABASE_URL is not set in Vercel Environment Variables. Please add it in Vercel Project Settings.'
      });
    }

    // Build conditions to match Email, Phone number, or Name
    const cleanPhone = identifier.replace(/[^0-9]/g, '');
    const orConditions = [
      { email: identifier.toLowerCase() },
      { phone: identifier },
      { name: { equals: identifier, mode: 'insensitive' } }
    ];

    if (cleanPhone) {
      orConditions.push({ phone: cleanPhone });
      if (cleanPhone.length >= 10) {
        const last10 = cleanPhone.slice(-10);
        orConditions.push({ phone: last10 });
        orConditions.push({ email: `${last10}@venm.local` });
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: orConditions
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: 'THIS ACCOUNT WAS SIGNED UP VIA GOOGLE. PLEASE CLICK "CONTINUE WITH GOOGLE" TO LOGIN.'
      });
    }

    let isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch && password.trim() !== password) {
      isMatch = await bcrypt.compare(password.trim(), user.passwordHash);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'INVALID USERNAME OR PASSWORD' });
    }

    const token = generateToken(user);

    // Set HTTP-only cookie
    res.cookie('venm_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log activity
    await logActivity({
      adminUserId: user.id,
      adminEmail: user.email,
      action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'USER_LOGIN',
      entityType: 'AUTH',
      description: `${user.role} logged in via ${identifier.includes('@') ? 'email' : 'credentials'} (${user.email || user.phone})`
    }).catch(() => {});

    res.json({
      message: 'AUTHENTICATION SUCCESSFUL',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]', error);
    res.status(500).json({ message: 'LOGIN FAILED', error: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ message: 'NAME, EMAIL OR PHONE, AND PASSWORD ARE REQUIRED' });
    }

    const cleanEmail = email && email.trim() ? email.toLowerCase().trim() : null;
    const cleanPhone = phone && phone.trim() ? phone.replace(/[^0-9]/g, '').slice(-10) : null;

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ message: 'PLEASE ENTER A VALID EMAIL OR 10-DIGIT PHONE NUMBER' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        message: 'DATABASE CONFIGURATION MISSING',
        error: 'DATABASE_URL is not set in Vercel Environment Variables. Please add it in Vercel Project Settings.'
      });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }, { email: `${cleanPhone}@venm.local` }] : [])
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'ACCOUNT WITH THIS EMAIL OR PHONE ALREADY EXISTS. PLEASE LOGIN.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail || `${cleanPhone}@venm.local`,
        phone: cleanPhone || null,
        passwordHash,
        role: 'CUSTOMER'
      }
    });

    const token = generateToken(newUser);

    res.cookie('venm_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await logActivity({
      adminUserId: newUser.id,
      adminEmail: newUser.email,
      action: 'USER_REGISTERED',
      entityType: 'AUTH',
      description: `New user registered: ${newUser.name} (${newUser.email || newUser.phone})`
    }).catch(() => {});

    res.status(201).json({
      message: 'REGISTRATION SUCCESSFUL',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('[AUTH REGISTER ERROR]', error);
    res.status(500).json({ message: 'REGISTRATION FAILED', error: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential, email, name, googleId } = req.body;

    let userEmail = email;
    let userName = name;
    let userGoogleId = googleId;

    // Decode Google ID Token JWT (credential) if provided
    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload.email) userEmail = payload.email;
          if (payload.name) userName = payload.name;
          if (payload.sub) userGoogleId = payload.sub;
        }
      } catch (tokenErr) {
        console.warn('[AUTH GOOGLE TOKEN PARSE WARNING]', tokenErr.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'GOOGLE EMAIL ADDRESS IS REQUIRED' });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const cleanName = (userName || cleanEmail.split('@')[0] || 'Google User').trim();

    // Look for existing user by email
    let user = await prisma.user.findFirst({
      where: {
        email: cleanEmail
      }
    });

    if (!user) {
      // User doesn't exist yet - automatically create & store them in database
      const randomPassword = `goog_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await prisma.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          phone: null,
          passwordHash,
          role: 'CUSTOMER'
        }
      });

      await logActivity({
        adminUserId: user.id,
        adminEmail: user.email,
        action: 'USER_REGISTERED_GOOGLE',
        entityType: 'AUTH',
        description: `New user registered via Google: ${user.name} (${user.email})`
      }).catch(() => {});
    }

    const token = generateToken(user);

    res.cookie('venm_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await logActivity({
      adminUserId: user.id,
      adminEmail: user.email,
      action: 'USER_LOGIN_GOOGLE',
      entityType: 'AUTH',
      description: `User logged in via Google: ${user.name} (${user.email})`
    }).catch(() => {});

    res.json({
      message: 'AUTHENTICATION SUCCESSFUL',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AUTH GOOGLE ERROR]', error);
    res.status(500).json({ message: 'GOOGLE SIGN-IN FAILED', error: error.message });
  }
};

export const logout = async (req, res) => {
  const user = req.user || req.body?.user;
  const userEmail = user?.email || user?.phone || 'client';
  const userName = user?.name || 'Client';

  await logActivity({
    adminUserId: user?.id || 'client-visitor',
    adminEmail: userEmail,
    action: 'USER_LOGOUT',
    entityType: 'AUTH',
    entityName: userName,
    description: `User logged out: ${userName} (${userEmail})`
  }).catch(() => {});

  res.clearCookie('venm_admin_token');
  res.json({ message: 'LOGGED OUT SUCCESSFULLY' });
};

export const getMe = async (req, res) => {
  res.json({
    user: req.user
  });
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const inquiriesCount = await prisma.inquiry.count({
          where: {
            OR: [
              { userId: u.id },
              ...(u.email ? [{ clientEmail: u.email }] : []),
              ...(u.phone ? [{ clientPhone: u.phone }] : [])
            ]
          }
        });
        return {
          ...u,
          inquiriesCount
        };
      })
    );

    res.json({
      success: true,
      count: usersWithStats.length,
      users: usersWithStats
    });
  } catch (error) {
    console.error('[GET ALL USERS ERROR]', error);
    res.status(500).json({ message: 'FAILED TO FETCH REGISTERED USERS', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: 'USER NOT FOUND' });
    }

    if (existing.role === 'ADMIN' && existing.email === 'venm1310@gmail.com') {
      return res.status(400).json({ message: 'CANNOT DELETE PRIMARY STUDIO ADMIN ACCOUNT' });
    }

    await prisma.user.delete({ where: { id } });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin',
      action: 'DELETE_USER',
      entityType: 'AUTH',
      entityId: id,
      entityName: existing.name,
      description: `Admin deleted registered user: ${existing.name} (${existing.email || existing.phone})`
    }).catch(() => {});

    res.json({ success: true, message: 'USER DELETED SUCCESSFULLY' });
  } catch (error) {
    console.error('[DELETE USER ERROR]', error);
    res.status(500).json({ message: 'FAILED TO DELETE USER', error: error.message });
  }
};

// Backwards compatibility aliases
export const loginAdmin = login;
export const logoutAdmin = logout;

