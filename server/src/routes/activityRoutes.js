import express from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireRole('super_admin', 'admin'));

router.get('/', async (_req, res) => {
  const result = await query(`
    SELECT a.*, u.full_name AS user_name
    FROM activity_log a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT 200
  `);
  res.json({ activities: result.rows });
});

export default router;
