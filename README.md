# ASY Global Travel & Mobility — Final Authentication Fix

Small patch only; this is NOT the full application.

Files to replace:
- server/src/bootstrap.js
- server/src/middleware/auth.js
- server/src/routes/authRoutes.js
- client/src/services/api.js
- client/src/pages/Login.jsx
- client/src/App.jsx

## One-time Render admin reset

1. In Render, open the `asy-global-api` service.
2. Environment → Add environment variable:
   ADMIN_RESET_PASSWORD = ASYTemp2026!
3. Save, rebuild, and deploy.
4. When the API logs show the admin password was reset, log into the live ASY portal with:
   admin@asyglobal.com
   ASYTemp2026!
5. Change the password in Profile.
6. REMOVE ADMIN_RESET_PASSWORD from Render and redeploy the API.

## Important

Keep DATABASE_URL, JWT_SECRET, CLIENT_URL, NODE_ENV, JWT_EXPIRES_IN and STORAGE_DIR unchanged.
Do not commit server/.env.
