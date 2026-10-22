import { execSync } from 'child_process';

const FALLBACK_DB_URL = "postgresql://venm_database_user:Rznm0E37mn2PwDo85eZTdpMePIynTo6O@dpg-db3ri60473hc73f36usg-a.oregon-postgres.render.com/venm_database?sslmode=require&connection_limit=15&pool_timeout=30";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DB_URL;
}

console.log('[BUILD] Ensuring Prisma Client is generated...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
} catch (err) {
  console.warn('[BUILD] prisma generate notice:', err.message);
}

console.log('[BUILD] Running Vite build...');
execSync('npx vite build', { stdio: 'inherit', env: process.env });
