import app from '../server/app.js';

export default function handler(req, res) {
  // Ensure the /api prefix is present so Express routes match correctly regardless of Vercel rewrite behavior
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}
