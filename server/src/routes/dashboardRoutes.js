import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/summary', async (_req, res) => {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM clients) AS total_clients,
      (SELECT COUNT(*) FROM clients WHERE created_at >= CURRENT_DATE) AS new_clients,
      (SELECT COUNT(*) FROM applications WHERE status NOT IN ('Completed', 'Cancelled')) AS active_applications,
      (SELECT COUNT(*) FROM applications WHERE status = 'Documents Pending') AS documents_pending,
      (SELECT COUNT(*) FROM applications WHERE status = 'Completed') AS completed_applications
  `);

  res.json({ summary: result.rows[0] });
});

export default router;
