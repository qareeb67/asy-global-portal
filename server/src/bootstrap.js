import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { pool, query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

export async function initializeDatabase() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);

  const email = 'admin@asyglobal.com';
  const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);

  if (!existing.rows[0]) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
    await query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'super_admin', TRUE)`,
      ['ASY Super Admin', email, passwordHash]
    );
    console.log(`Starter admin created: ${email}`);
  } else {
    console.log(`Database ready; existing admin preserved: ${email}`);
  }
}
