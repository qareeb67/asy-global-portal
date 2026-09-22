import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(requireAuth, requireRole('super_admin', 'admin'));

router.get('/', async (_req, res) => {
  const result = await query('SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
  res.json({ users: result.rows });
});

router.post('/', async (req, res) => {
  const { full_name, email, password, role = 'staff' } = req.body ?? {};
  if (!full_name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
  if (!['super_admin', 'admin', 'staff'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
  if (role === 'super_admin' && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Only a super admin can create a super admin.' });

  const password_hash = await bcrypt.hash(password, 12);
  try {
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, is_active, created_at`,
      [full_name.trim(), email.trim(), password_hash, role]
    );
    const user = result.rows[0];
    await logActivity({ userId: req.user.id, action: 'USER_CREATED', entityType: 'user', entityId: String(user.id), details: { email: user.email, role: user.role } });
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'That email is already in use.' });
    throw error;
  }
});

router.patch('/:id/status', async (req, res) => {
  const active = Boolean(req.body?.is_active);
  const result = await query(
    'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, email, role, is_active',
    [active, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: 'User not found.' });
  await logActivity({ userId: req.user.id, action: active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', entityType: 'user', entityId: req.params.id });
  res.json({ user: result.rows[0] });
});

export default router;
