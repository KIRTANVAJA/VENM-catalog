import dotenv from 'dotenv';
dotenv.config();

let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;

if (dbUrl && !dbUrl.includes('connection_limit')) {
  const joiner = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${joiner}connection_limit=15&pool_timeout=30`;
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "venm_catalog_super_secret_jwt_key_2026";
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: dbUrl ? {
    db: {
      url: dbUrl
    }
  } : undefined,
  log: ['error']
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
