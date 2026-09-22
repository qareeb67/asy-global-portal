import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';
import { notifyStaff } from '../services/notificationService.js';

const router = express.Router();
router.use(requireAuth);

const paymentSelect = `
    SELECT p.id, p.payment_code, p.receipt_number, p.client_id, p.application_id, p.amount, p.payment_method,
           p.transaction_reference, p.purpose, p.notes, p.received_by, p.created_at,
           c.client_code, c.full_name AS client_name,
           a.destination, a.service_type, a.total_fee AS application_total_fee,
           COALESCE(ps.total_paid, 0) AS application_total_paid,
           GREATEST(COALESCE(a.total_fee, 0) - COALESCE(ps.total_paid, 0), 0) AS application_balance,
           u.full_name AS received_by_name
    FROM payments p
    JOIN clients c ON c.id = p.client_id
    LEFT JOIN applications a ON a.id = p.application_id
    LEFT JOIN users u ON u.id = p.received_by
    LEFT JOIN LATERAL (
      SELECT SUM(px.amount) AS total_paid
      FROM payments px
      WHERE px.application_id = p.application_id
    ) ps ON TRUE`;

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const result = await query(`${paymentSelect}
    WHERE $1 = ''
       OR p.receipt_number ILIKE '%' || $1 || '%'
       OR p.payment_code ILIKE '%' || $1 || '%'
       OR c.client_code ILIKE '%' || $1 || '%'
       OR c.full_name ILIKE '%' || $1 || '%'
       OR p.client_id::text ILIKE '%' || $1 || '%'
       OR p.purpose ILIKE '%' || $1 || '%'
       OR COALESCE(p.transaction_reference, '') ILIKE '%' || $1 || '%'
    ORDER BY p.created_at DESC
    LIMIT 200`, [q]);
  res.json({ payments: result.rows });
});

router.get('/:id', async (req, res) => {
  const result = await query(`${paymentSelect}
    WHERE p.id = $1`, [req.params.id]);
  const payment = result.rows[0];
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });
  const previousPaid = Math.max(Number(payment.application_total_paid || 0) - Number(payment.amount || 0), 0);
  const balanceAfterPayment = Math.max(Number(payment.application_total_fee || 0) - Number(payment.application_total_paid || 0), 0);
  res.json({ payment: { ...payment, previous_paid: previousPaid, balance_after_payment: balanceAfterPayment } });
});

router.post('/', async (req, res) => {
  const { client_id, application_id, amount, payment_method, transaction_reference, purpose, notes } = req.body ?? {};
  if (!client_id || !amount || !payment_method || !purpose) return res.status(400).json({ message: 'Client, amount, payment method and purpose are required.' });
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Amount must be greater than zero.' });

  if (application_id) {
    const applicationResult = await query(
      `SELECT a.total_fee, COALESCE(SUM(p.amount), 0) AS total_paid
       FROM applications a
       LEFT JOIN payments p ON p.application_id = a.id
       WHERE a.id = $1 AND a.client_id = $2
       GROUP BY a.id`,
      [application_id, client_id]
    );
    const application = applicationResult.rows[0];
    if (!application) return res.status(400).json({ message: 'That application does not belong to this client.' });
    const totalFee = Number(application.total_fee || 0);
    const totalPaid = Number(application.total_paid || 0);
    const balance = Math.max(totalFee - totalPaid, 0);
    if (totalFee > 0 && numericAmount > balance + 0.001) {
      return res.status(400).json({ message: `Payment is higher than the remaining balance of ₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}.` });
    }
  }

  const result = await query(
    `INSERT INTO payments (client_id, application_id, amount, payment_method, transaction_reference, purpose, notes, received_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [client_id, application_id || null, numericAmount, payment_method.trim(), transaction_reference?.trim() || null, purpose.trim(), notes || null, req.user.id]
  );
  const payment = result.rows[0];
  await logActivity({ userId: req.user.id, action: 'PAYMENT_RECORDED', entityType: 'payment', entityId: String(payment.id), details: { client_id, application_id, amount: numericAmount, receipt_number: payment.receipt_number } });
  await notifyStaff({ title: 'Payment recorded', message: `Payment ${payment.receipt_number} of ₦${numericAmount.toLocaleString('en-NG')} was recorded.`, type: 'payment', link: `/payments/${payment.id}/print` });
  
  res.status(201).json({ payment });
});

export default router;
