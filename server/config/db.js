import dotenv from 'dotenv';
dotenv.config();

const FALLBACK_DB_URL = "postgresql://venm_database_user:Rznm0E37mn2PwDo85eZTdpMePIynTo6O@dpg-db3ri60473hc73f36usg-a.oregon-postgres.render.com/venm_database?sslmode=require&connection_limit=15&pool_timeout=30";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DB_URL;
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "venm_catalog_super_secret_jwt_key_2026";
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let dbUrl = process.env.DATABASE_URL || FALLBACK_DB_URL;
if (dbUrl && !dbUrl.includes('connection_limit')) {
  const joiner = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${joiner}connection_limit=15&pool_timeout=30`;
}

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  },
  log: ['error']
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
