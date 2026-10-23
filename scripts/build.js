import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

console.log('[BUILD] Ensuring Prisma Client is generated...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
} catch (err) {
  console.warn('[BUILD] prisma generate notice:', err.message);
}

console.log('[BUILD] Running Vite build...');
execSync('npx vite build', { stdio: 'inherit', env: process.env });
