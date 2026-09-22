import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'node:url';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../services/auditService.js';
import { notifyStaff } from '../services/notificationService.js';

const router = express.Router();
router.use(requireAuth);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '../..');
const storageRoot = path.resolve(serverDir, process.env.STORAGE_DIR || './storage');
fs.mkdirSync(storageRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storageRoot),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
    cb(null, allowed.has(file.mimetype));
  }
});

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const result = await query(
    `SELECT d.id, d.client_id, d.application_id, d.document_type, d.original_name, d.mime_type,
            d.file_size, d.created_at, c.client_code, c.full_name AS client_name,
            u.full_name AS uploaded_by_name
     FROM documents d
     JOIN clients c ON c.id = d.client_id
     LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE $1 = ''
        OR d.document_type ILIKE '%' || $1 || '%'
        OR d.original_name ILIKE '%' || $1 || '%'
        OR c.client_code ILIKE '%' || $1 || '%'
        OR c.full_name ILIKE '%' || $1 || '%'
     ORDER BY d.created_at DESC
     LIMIT 200`,
    [q]
  );
  res.json({ documents: result.rows });
});

router.post('/', upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'A PDF or image document is required.' });
  const { client_id, application_id, document_type } = req.body ?? {};
  if (!client_id || !document_type) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Client and document type are required.' });
  }

  const result = await query(
    `INSERT INTO documents (client_id, application_id, document_type, original_name, stored_name, mime_type, file_size, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, client_id, application_id, document_type, original_name, mime_type, file_size, uploaded_by, created_at`,
    [client_id, application_id || null, document_type.trim(), req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.user.id]
  );

  await logActivity({ userId: req.user.id, action: 'DOCUMENT_UPLOADED', entityType: 'document', entityId: String(result.rows[0].id), details: { client_id, document_type } });
  await notifyStaff({ title: 'New client document uploaded', message: `${result.rows[0].document_type} was uploaded for client ${client_id}.`, type: 'document', link: `/clients/${client_id}` });
  
  res.status(201).json({ document: result.rows[0] });
});

router.get('/:id/download', async (req, res) => {
  const result = await query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
  const document = result.rows[0];
  if (!document) return res.status(404).json({ message: 'Document not found.' });

  const filePath = path.join(storageRoot, path.basename(document.stored_name));
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Document file is missing from storage.' });

  await logActivity({ userId: req.user.id, action: 'DOCUMENT_DOWNLOADED', entityType: 'document', entityId: String(document.id), details: { client_id: document.client_id, filename: document.original_name } });
  res.download(filePath, document.original_name);
});

router.delete('/:id', async (req, res) => {
  const result = await query('DELETE FROM documents WHERE id = $1 RETURNING *', [req.params.id]);
  const document = result.rows[0];
  if (!document) return res.status(404).json({ message: 'Document not found.' });

  const filePath = path.join(storageRoot, path.basename(document.stored_name));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await logActivity({ userId: req.user.id, action: 'DOCUMENT_DELETED', entityType: 'document', entityId: String(document.id), details: { filename: document.original_name } });
  res.json({ message: 'Document deleted.' });
});

export default router;
