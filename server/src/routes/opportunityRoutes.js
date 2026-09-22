import express from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';
import { notifyStaff } from '../services/notificationService.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const status = String(req.query.status ?? '').trim();
  const category = String(req.query.category ?? '').trim();
  const result = await query(
    `SELECT * FROM opportunities
     WHERE ($1 = '' OR title ILIKE '%' || $1 || '%' OR country ILIKE '%' || $1 || '%' OR opportunity_code ILIKE '%' || $1 || '%')
       AND ($2 = '' OR status = $2)
       AND ($3 = '' OR category = $3)
     ORDER BY featured DESC, updated_at DESC, created_at DESC
     LIMIT 300`,
    [q, status, category]
  );
  res.json({ opportunities: result.rows });
});

router.post('/', requireRole('super_admin', 'admin'), async (req, res) => {
  const { title, country, category, service_type, opportunity_code, status = 'Available', summary, requirements, partner_name, featured = false } = req.body ?? {};
  if (!title?.trim() || !country?.trim() || !category?.trim()) return res.status(400).json({ message: 'Title, country and category are required.' });
  const result = await query(
    `INSERT INTO opportunities (title, country, category, service_type, opportunity_code, status, summary, requirements, partner_name, featured, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
     RETURNING *`,
    [title.trim(), country.trim(), category.trim(), service_type?.trim() || null, opportunity_code?.trim() || null, status, summary?.trim() || null, requirements?.trim() || null, partner_name?.trim() || null, Boolean(featured), req.user.id]
  );
  const item = result.rows[0];
  await logActivity({ userId: req.user.id, action: 'OPPORTUNITY_CREATED', entityType: 'opportunity', entityId: String(item.id), details: { title: item.title, status: item.status } });
  await notifyStaff({ title: 'New opportunity added', message: `${item.country} • ${item.title} is now listed in the ASY travel desk.`, type: 'opportunity', link: '/opportunities' });
  res.status(201).json({ opportunity: item });
});

router.patch('/:id', requireRole('super_admin', 'admin'), async (req, res) => {
  const fields = ['title','country','category','service_type','opportunity_code','status','summary','requirements','partner_name','featured'];
  const provided = fields.filter((field) => Object.prototype.hasOwnProperty.call(req.body ?? {}, field));
  if (!provided.length) return res.status(400).json({ message: 'No fields supplied.' });
  const values = provided.map((field) => req.body[field] === '' ? null : req.body[field]);
  const setSql = provided.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const result = await query(`UPDATE opportunities SET ${setSql}, updated_by = $${provided.length + 1}, updated_at = NOW() WHERE id = $${provided.length + 2} RETURNING *`, [...values, req.user.id, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Opportunity not found.' });
  const item = result.rows[0];
  await logActivity({ userId: req.user.id, action: 'OPPORTUNITY_UPDATED', entityType: 'opportunity', entityId: req.params.id, details: { fields: provided } });
  await notifyStaff({ title: 'Opportunity updated', message: `${item.country} • ${item.title} is now ${item.status}.`, type: item.status === 'Available' ? 'success' : 'info', link: '/opportunities' });
  res.json({ opportunity: item });
});

router.delete('/:id', requireRole('super_admin', 'admin'), async (req, res) => {
  const result = await query('DELETE FROM opportunities WHERE id = $1 RETURNING *', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Opportunity not found.' });
  await logActivity({ userId: req.user.id, action: 'OPPORTUNITY_DELETED', entityType: 'opportunity', entityId: req.params.id, details: { title: result.rows[0].title } });
  res.json({ message: 'Opportunity deleted.' });
});

export default router;
