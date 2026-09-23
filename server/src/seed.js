import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { pool, query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(serverDir, '.env') });

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
await pool.query(schema);

const email = 'admin@asyglobal.com';
const password =  'ASYTemp2026!';
const hash = await bcrypt.hash(password, 12);

const result = await query(
  `INSERT INTO users (full_name, email, password_hash, role, is_active)
   VALUES ($1, $2, $3, 'super_admin', TRUE)
   ON CONFLICT (email)
   DO UPDATE SET
     full_name = EXCLUDED.full_name,
     password_hash = EXCLUDED.password_hash,
     role = 'super_admin',
     is_active = TRUE
   RETURNING id, email`,
  ['ASY Super Admin', email, hash]
);

console.log(`Admin ready: ${result.rows[0].email} / ${password}`);
console.log('Existing client/application/document/payment data was preserved.');

await pool.end();
