import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await query(
    `SELECT id, title, message, type, link, is_read, created_at
     FROM notifications
     WHERE recipient_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [req.user.id]
  );
  res.json({ notifications: result.rows });
});

router.get('/unread-count', async (req, res) => {
  const result = await query('SELECT COUNT(*)::INTEGER AS count FROM notifications WHERE recipient_id = $1 AND is_read = FALSE', [req.user.id]);
  res.json({ count: result.rows[0].count });
});

router.patch('/:id/read', async (req, res) => {
  const result = await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2 RETURNING *', [req.params.id, req.user.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Notification not found.' });
  await logActivity({ userId: req.user.id, action: 'NOTIFICATION_READ', entityType: 'notification', entityId: req.params.id });
  res.json({ notification: result.rows[0] });
});

router.patch('/read-all', async (req, res) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE', [req.user.id]);
  res.json({ message: 'All notifications marked as read.' });
});

export default router;
