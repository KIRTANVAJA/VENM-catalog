import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let dbUrl = process.env.DATABASE_URL || '';
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

