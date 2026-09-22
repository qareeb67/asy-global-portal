import express from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';
import { notifyStaff } from '../services/notificationService.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const result = await query('SELECT * FROM testimonials ORDER BY featured DESC, created_at DESC LIMIT 300');
  res.json({ testimonials: result.rows });
});

router.post('/', requireRole('super_admin', 'admin'), async (req, res) => {
  const { client_name, destination, service_type, quote, consent_for_marketing = false, featured = false, is_published = true } = req.body ?? {};
  if (!client_name?.trim() || !quote?.trim()) return res.status(400).json({ message: 'Client name and testimonial are required.' });
  if (Boolean(consent_for_marketing) !== true && Boolean(is_published) === true) return res.status(400).json({ message: 'Marketing consent is required before publishing a testimonial.' });
  const result = await query(
    `INSERT INTO testimonials (client_name, destination, service_type, quote, consent_for_marketing, featured, is_published, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING *`,
    [client_name.trim(), destination?.trim() || null, service_type?.trim() || null, quote.trim(), Boolean(consent_for_marketing), Boolean(featured), Boolean(is_published), req.user.id]
  );
  const item = result.rows[0];
  await logActivity({ userId: req.user.id, action: 'TESTIMONIAL_CREATED', entityType: 'testimonial', entityId: String(item.id), details: { client_name: item.client_name, is_published: item.is_published } });
  await notifyStaff({ title: 'New testimonial added', message: `${item.client_name}'s story was added to the ASY testimonial library.`, type: 'success', link: '/testimonials' });
  res.status(201).json({ testimonial: item });
});

router.patch('/:id', requireRole('super_admin', 'admin'), async (req, res) => {
  const fields = ['client_name','destination','service_type','quote','consent_for_marketing','featured','is_published'];
  const provided = fields.filter((field) => Object.prototype.hasOwnProperty.call(req.body ?? {}, field));
  if (!provided.length) return res.status(400).json({ message: 'No fields supplied.' });
  const nextConsent = req.body.consent_for_marketing;
  if (req.body.is_published === true && nextConsent !== true) {
    const existing = await query('SELECT consent_for_marketing FROM testimonials WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ message: 'Testimonial not found.' });
    if (!existing.rows[0].consent_for_marketing) return res.status(400).json({ message: 'Marketing consent is required before publishing a testimonial.' });
  }
  const values = provided.map((field) => req.body[field] === '' ? null : req.body[field]);
  const setSql = provided.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const result = await query(`UPDATE testimonials SET ${setSql}, updated_by = $${provided.length + 1}, updated_at = NOW() WHERE id = $${provided.length + 2} RETURNING *`, [...values, req.user.id, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Testimonial not found.' });
  await logActivity({ userId: req.user.id, action: 'TESTIMONIAL_UPDATED', entityType: 'testimonial', entityId: req.params.id, details: { fields: provided } });
  res.json({ testimonial: result.rows[0] });
});

router.delete('/:id', requireRole('super_admin', 'admin'), async (req, res) => {
  const result = await query('DELETE FROM testimonials WHERE id = $1 RETURNING *', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Testimonial not found.' });
  await logActivity({ userId: req.user.id, action: 'TESTIMONIAL_DELETED', entityType: 'testimonial', entityId: req.params.id, details: { client_name: result.rows[0].client_name } });
  res.json({ message: 'Testimonial deleted.' });
});

export default router;
