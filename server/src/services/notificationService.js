import { query } from '../db.js';

export async function notifyStaff({ title, message, type = 'info', link = null }) {
  await query(
    `INSERT INTO notifications (recipient_id, title, message, type, link)
     SELECT id, $1, $2, $3, $4
     FROM users
     WHERE is_active = TRUE
`,
    [title, message, type, link]
  );
}
