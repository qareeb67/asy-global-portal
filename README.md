# ASY Global Travel & Mobility — Internal Portal V1.5.5

Private operations portal for ASY Global Travel & Mobility, in partnership with Hajja Zainab Travel & Tours.

## Local development

Keep your local `server/.env` and `server/storage/`. From the project root:

```bash
npm install
npm run install:all
npm run dev
```

To initialize/update the local database:

```bash
cd server
npm run seed
```

## Render deployment

This repository includes `render.yaml` for a two-service Render deployment plus Render Postgres:

- `asy-global-api` — Node/Express API
- `asy-global-portal` — Vite/React static site
- PostgreSQL — use the existing Render Postgres instance; create a separate logical database named `asy_global`

The API is configured for Render's `PORT` and binds to `0.0.0.0`. The production auth cookie uses `SameSite=None; Secure` so the React static site can authenticate to the separate API origin.

### Demo warning

Render Free is suitable for a demo/preview, not for real client records. Free web-service files are ephemeral, and free Postgres databases currently expire after 30 days. Uploaded documents therefore must not contain real passports/IDs on the free demo. For real operations, move the database to a non-expiring plan and move document storage to persistent disk or managed object storage.

### First deployment

1. Push this repository to GitHub.
2. In Render, create a **New Blueprint** from the repository. When prompted for `DATABASE_URL`, supply the connection string for the separate `asy_global` database inside your existing Render Postgres instance.
3. After deployment, verify `https://asy-global-api.onrender.com/api/health`.
4. Verify the frontend at `https://asy-global-portal.onrender.com`.
5. The Blueprint wires the deployed API and frontend URLs automatically; Vite receives the API URL at build time.
6. The API automatically initializes the schema and creates the starter admin only when it does not already exist, so no Render shell step is required.
7. Change the starter admin password immediately from Profile.

## Important production settings

Set `CLIENT_URL` on the API to the exact deployed frontend origin. Keep `JWT_SECRET` in Render Environment Variables/Secrets; never commit it.

For React Router, the static site rewrite `/* -> /index.html` is already included in the Blueprint.


## Using an existing Render Postgres instance

Render allows more than one logical database inside a single Postgres instance. Do not create a second Free Postgres instance if your workspace already has one. In the existing Postgres instance, open the provided PSQL command/session and run:

```sql
CREATE DATABASE asy_global;
```

Then obtain the connection URL for that database and provide it to the `DATABASE_URL` environment variable for `asy-global-api` during the initial Blueprint setup. Do not use the Ghost HMS database itself; ASY must use the separate `asy_global` database.


## V1.5.7 deployment fix

The frontend now reads `VITE_API_URL` directly at Vite build time and appends `/api` only when needed. The Render build no longer uses shell interpolation to generate a JavaScript file, avoiding `bad substitution` on Render's Linux shell.
