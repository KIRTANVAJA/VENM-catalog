import { verifyToken } from '../utils/token.js';
import prisma from '../config/db.js';

export const protectAdmin = async (req, res, next) => {
  try {
    let token = req.cookies?.venm_admin_token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // In development mode, fall back to default admin so admin actions never get blocked by missing cookies
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        const defaultAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (defaultAdmin) {
          req.user = {
            id: defaultAdmin.id,
            name: defaultAdmin.name,
            email: defaultAdmin.email,
            role: defaultAdmin.role
          };
          return next();
        }
      }
      return res.status(401).json({ message: 'UNAUTHORIZED ACCESS — ADMIN TOKEN MISSING' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        const defaultAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (defaultAdmin) {
          req.user = {
            id: defaultAdmin.id,
            name: defaultAdmin.name,
            email: defaultAdmin.email,
            role: defaultAdmin.role
          };
          return next();
        }
      }
      return res.status(401).json({ message: 'UNAUTHORIZED ACCESS — INVALID OR EXPIRED TOKEN' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        const defaultAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (defaultAdmin) {
          req.user = {
            id: defaultAdmin.id,
            name: defaultAdmin.name,
            email: defaultAdmin.email,
            role: defaultAdmin.role
          };
          return next();
        }
      }
      return res.status(401).json({ message: 'ADMIN USER NOT FOUND IN DATABASE' });
    }

    // Attach admin user object to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'AUTHENTICATION FAILED', error: error.message });
  }
};
