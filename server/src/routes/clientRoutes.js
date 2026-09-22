import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';
import { notifyStaff } from '../services/notificationService.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const result = await query(
    `SELECT c.*, 
      (SELECT COUNT(*) FROM documents d WHERE d.client_id = c.id) AS document_count,
      (SELECT COUNT(*) FROM applications a WHERE a.client_id = c.id) AS application_count
     FROM clients c
     WHERE $1 = ''
        OR c.client_code ILIKE '%' || $1 || '%'
        OR c.full_name ILIKE '%' || $1 || '%'
        OR c.phone ILIKE '%' || $1 || '%'
        OR COALESCE(c.passport_number, '') ILIKE '%' || $1 || '%'
     ORDER BY c.created_at DESC
     LIMIT 100`,
    [q]
  );
  res.json({ clients: result.rows });
});

router.get('/:id', async (req, res) => {
  const clientResult = await query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
  if (!clientResult.rows[0]) return res.status(404).json({ message: 'Client not found.' });

  const [apps, docs, payments] = await Promise.all([
    query(`SELECT a.*, u.full_name AS assigned_to_name, COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.application_id = a.id), 0) AS payment_total FROM applications a LEFT JOIN users u ON u.id = a.assigned_to WHERE a.client_id = $1 ORDER BY a.created_at DESC`, [req.params.id]),
    query(`SELECT d.*, u.full_name AS uploaded_by_name FROM documents d LEFT JOIN users u ON u.id = d.uploaded_by WHERE d.client_id = $1 ORDER BY d.created_at DESC`, [req.params.id]),
    query(`SELECT p.*, u.full_name AS received_by_name FROM payments p LEFT JOIN users u ON u.id = p.received_by WHERE p.client_id = $1 ORDER BY p.created_at DESC`, [req.params.id])
  ]);

  res.json({ client: clientResult.rows[0], applications: apps.rows, documents: docs.rows, payments: payments.rows });
});

router.post('/', async (req, res) => {
  const {
    full_name, date_of_birth, gender, phone, email, address, state, nationality = 'Nigerian',
    passport_number, passport_issue_date, passport_expiry_date, notes
  } = req.body ?? {};

  if (!full_name?.trim() || !phone?.trim()) return res.status(400).json({ message: 'Full name and phone are required.' });

  const result = await query(
    `INSERT INTO clients (full_name, date_of_birth, gender, phone, email, address, state, nationality, passport_number, passport_issue_date, passport_expiry_date, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [full_name.trim(), date_of_birth || null, gender || null, phone.trim(), email?.trim() || null, address || null, state || null, nationality.trim(), passport_number?.trim() || null, passport_issue_date || null, passport_expiry_date || null, notes || null, req.user.id]
  );

  const client = result.rows[0];
  await logActivity({ userId: req.user.id, action: 'CLIENT_CREATED', entityType: 'client', entityId: String(client.id), details: { client_code: client.client_code } });
  await notifyStaff({ title: 'New client registered', message: `${client.full_name} (${client.client_code}) was added to the ASY client workspace.`, type: 'client', link: `/clients/${client.id}` });
  
  res.status(201).json({ client });
});

router.patch('/:id', async (req, res) => {
  const fields = ['full_name','date_of_birth','gender','phone','email','address','state','nationality','passport_number','passport_issue_date','passport_expiry_date','notes'];
  const provided = fields.filter((field) => Object.prototype.hasOwnProperty.call(req.body ?? {}, field));
  if (!provided.length) return res.status(400).json({ message: 'No fields supplied.' });

  const values = provided.map((field) => req.body[field] === '' ? null : req.body[field]);
  const setSql = provided.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const result = await query(`UPDATE clients SET ${setSql}, updated_at = NOW() WHERE id = $${provided.length + 1} RETURNING *`, [...values, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Client not found.' });
  await logActivity({ userId: req.user.id, action: 'CLIENT_UPDATED', entityType: 'client', entityId: req.params.id, details: { fields: provided } });
  res.json({ client: result.rows[0] });
});

export default router;
