import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('===================================================');
console.log('🚀 STARTING VENM CATALOG BACKEND & FRONTEND SERVERS');
console.log('===================================================');

// 1. Spawn Backend Express API Server on Port 5000
const serverProc = spawn('node', ['server/server.js'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

// 2. Spawn Frontend Vite Dev Server on Port 5173
const viteProc = spawn('npx', ['vite'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

const handleExit = () => {
  console.log('\n🛑 Shutting down backend and frontend dev servers...');
  try { serverProc.kill(); } catch (e) {}
  try { viteProc.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
