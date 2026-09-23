import jwt from 'jsonwebtoken';
import { query } from '../db.js';

function getAccessToken(req) {
  const authHeader = req.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.asy_access || null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getAccessToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [payload.sub]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Account unavailable.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission for this action.' });
    }
    next();
  };
}
