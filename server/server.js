import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 VENM CATALOG BACKEND API RUNNING ON PORT ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT} / http://127.0.0.1:${PORT}`);
  console.log(`===============================================`);
});

