import { query } from '../db.js';

export async function logActivity({ userId, action, entityType = null, entityId = null, details = {} }) {
  await query(
    `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, entityType, entityId, JSON.stringify(details)]
  );
}
