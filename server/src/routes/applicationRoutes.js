import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';
import { notifyStaff } from '../services/notificationService.js';

const router = express.Router();
router.use(requireAuth);

router.post('/', async (req, res) => {
  const { client_id, destination, service_type, total_fee = 0, opportunity_id, status = 'New', assigned_to, notes } = req.body ?? {};
  if (!client_id || !destination || !service_type) return res.status(400).json({ message: 'Client, destination and service type are required.' });
  const numericFee = Number(total_fee || 0);
  if (!Number.isFinite(numericFee) || numericFee < 0) return res.status(400).json({ message: 'Service fee must be zero or greater.' });

  const result = await query(
    `INSERT INTO applications (client_id, destination, service_type, total_fee, opportunity_id, status, assigned_to, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [client_id, destination.trim(), service_type.trim(), numericFee, opportunity_id?.trim() || null, status, assigned_to || req.user.id, notes || null]
  );
  await logActivity({ userId: req.user.id, action: 'APPLICATION_CREATED', entityType: 'application', entityId: String(result.rows[0].id), details: { client_id, destination, service_type, total_fee: numericFee } });
  await notifyStaff({ title: 'New client application', message: `${destination} • ${service_type} application created for client ${client_id}.`, type: 'application', link: `/clients/${client_id}` });
  
  res.status(201).json({ application: result.rows[0] });
});

router.patch('/:id', async (req, res) => {
  const allowed = ['destination','service_type','total_fee','opportunity_id','status','assigned_to','notes'];
  const provided = allowed.filter((field) => Object.prototype.hasOwnProperty.call(req.body ?? {}, field));
  if (!provided.length) return res.status(400).json({ message: 'No fields supplied.' });

  const values = provided.map((field) => {
    if (field === 'total_fee') {
      const numericFee = Number(req.body[field] || 0);
      if (!Number.isFinite(numericFee) || numericFee < 0) throw Object.assign(new Error('Service fee must be zero or greater.'), { status: 400 });
      return numericFee;
    }
    return req.body[field] === '' ? null : req.body[field];
  });
  const setSql = provided.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const result = await query(`UPDATE applications SET ${setSql}, updated_at = NOW() WHERE id = $${provided.length + 1} RETURNING *`, [...values, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Application not found.' });
  await logActivity({ userId: req.user.id, action: 'APPLICATION_UPDATED', entityType: 'application', entityId: req.params.id, details: { fields: provided } });
  await notifyStaff({ title: 'Application updated', message: `${result.rows[0].destination} • ${result.rows[0].service_type} application ${result.rows[0].status}.`, type: 'application', link: `/clients/${result.rows[0].client_id}` });
  res.json({ application: result.rows[0] });
});

export default router;
