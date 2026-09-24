import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(serverDir, '.env') });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("RENDER:", process.env.RENDER);
  console.error("SERVICE:", process.env.RENDER_SERVICE_NAME);
  console.error(
    "DATABASE_URL PRESENT:",
    Boolean(process.env.DATABASE_URL)
  );

  throw new Error("DATABASE_URL is missing at runtime.");
}
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query(text, params) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
