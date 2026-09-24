import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { pool, query } from "./db.js";

const __dirname = path.dirname(
    fileURLToPath(import.meta.url)
);

const schemaPath = path.join(
    __dirname,
    "schema.sql"
);

export async function initializeDatabase() {
    const schema =
        fs.readFileSync(
            schemaPath,
            "utf8"
        );

    await pool.query(schema);

    const email =
        "admin@asyglobal.com";

    const resetPassword =
        process.env.ADMIN_RESET_PASSWORD?.trim();

    const existing =
        await query(
            `SELECT id
             FROM users
             WHERE LOWER(email) = LOWER($1)
             LIMIT 1`,
            [email]
        );

    /*
    ==================================================
    CREATE STARTER ADMIN
    ==================================================
    */

    if (!existing.rows[0]) {

        const password =
            resetPassword ||
            "ChangeMe123!";

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );

        await query(
            `INSERT INTO users (
                full_name,
                email,
                password_hash,
                role,
                is_active
            )
            VALUES (
                $1,
                $2,
                $3,
                'super_admin',
                TRUE
            )`,
            [
                "ASY Super Admin",
                email,
                passwordHash
            ]
        );

        console.log(
            `Starter admin created: ${email}`
        );

        return;
    }

    /*
    ==================================================
    RESET ADMIN PASSWORD
    ==================================================
    */

    if (resetPassword) {

        const passwordHash =
            await bcrypt.hash(
                resetPassword,
                12
            );

        await query(
            `UPDATE users
             SET password_hash = $1,
                 role = 'super_admin',
                 is_active = TRUE
             WHERE id = $2`,
            [
                passwordHash,
                existing.rows[0].id
            ]
        );

        console.log(
            `Admin password reset successfully: ${email}`
        );

        return;
    }

    /*
    ==================================================
    EXISTING ADMIN — LEAVE IT ALONE
    ==================================================
    */

    console.log(
        `Database ready; existing admin preserved: ${email}`
    );
}