import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 8 * 60 * 60 * 1000
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const result = await query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    const user = result.rows[0];

    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    res.cookie('asy_access', token, accessCookieOptions);

    await logActivity({ userId: user.id, action: 'USER_LOGIN', entityType: 'user', entityId: String(user.id) });

   res.json({
  token,
  user: {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  }
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed.' });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  await logActivity({ userId: req.user.id, action: 'USER_LOGOUT', entityType: 'user', entityId: String(req.user.id) });
  res.clearCookie('asy_access', accessCookieOptions);
  res.json({ message: 'Logged out.' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get('/profile', requireAuth, async (req, res) => {
  const result = await query(
    'SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: 'Profile not found.' });
  res.json({ user: result.rows[0] });
});

router.patch('/profile', requireAuth, async (req, res) => {
  const { full_name, email, current_password, new_password } = req.body ?? {};
  const name = typeof full_name === 'string' ? full_name.trim() : '';
  const nextEmail = typeof email === 'string' ? email.trim() : '';

  if (!name || !nextEmail) return res.status(400).json({ message: 'Full name and email are required.' });
  if (new_password && new_password.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' });
  if (new_password && !current_password) return res.status(400).json({ message: 'Current password is required to change your password.' });

  const existing = await query('SELECT id, password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!existing.rows[0]) return res.status(404).json({ message: 'Profile not found.' });

  if (new_password) {
    const ok = await bcrypt.compare(current_password, existing.rows[0].password_hash);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect.' });
  }

  try {
    let result;
    if (new_password) {
      const passwordHash = await bcrypt.hash(new_password, 12);
      result = await query(
        `UPDATE users SET full_name = $1, email = $2, password_hash = $3
         WHERE id = $4
         RETURNING id, full_name, email, role, is_active, created_at`,
        [name, nextEmail, passwordHash, req.user.id]
      );
    } else {
      result = await query(
        `UPDATE users SET full_name = $1, email = $2
         WHERE id = $3
         RETURNING id, full_name, email, role, is_active, created_at`,
        [name, nextEmail, req.user.id]
      );
    }

    const user = result.rows[0];
    await logActivity({
      userId: req.user.id,
      action: new_password ? 'PROFILE_UPDATED_PASSWORD' : 'PROFILE_UPDATED',
      entityType: 'user',
      entityId: String(req.user.id),
      details: { fields: new_password ? ['full_name', 'email', 'password'] : ['full_name', 'email'] }
    });

    res.json({ user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'That email is already in use.' });
    throw error;
  }
});

export default router;
