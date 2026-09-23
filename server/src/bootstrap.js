import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { pool, query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

const email = 'admin@asyglobal.com';
const defaultPassword = 'ChangeMe123!';

export async function initializeDatabase() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);

  const resetPassword = String(process.env.ADMIN_RESET_PASSWORD || '').trim();
  const existing = await query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );

  if (resetPassword) {
    if (resetPassword.length < 8) {
      throw new Error('ADMIN_RESET_PASSWORD must be at least 8 characters.');
    }

    const passwordHash = await bcrypt.hash(resetPassword, 12);

    if (existing.rows[0]) {
      await query(
        `UPDATE users
         SET password_hash = $1,
             role = 'super_admin',
             is_active = TRUE
         WHERE id = $2`,
        [passwordHash, existing.rows[0].id]
      );

      console.log(`Admin password reset from ADMIN_RESET_PASSWORD: ${email}`);
    } else {
      await query(
        `INSERT INTO users (full_name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'super_admin', TRUE)`,
        ['ASY Super Admin', email, passwordHash]
      );

      console.log(`Admin created from ADMIN_RESET_PASSWORD: ${email}`);
    }

    return;
  }

  if (!existing.rows[0]) {
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
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
