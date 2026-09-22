# ASY Global Travel & Mobility — Internal Portal V1.4.1

Private operations portal for ASY Global Travel & Mobility, in partnership with Hajja Zainab Travel & Tours.

## Important
Keep your existing `server/.env` and `server/storage/` when replacing an earlier version.

## Admin reset / initialization
From the `server` folder, run:

```bash
npm run seed
```

The seed script safely creates the schema and ensures the starter admin account is active with:

- Email: `admin@asyglobal.com`
- Password: `ChangeMe123!`

It does **not** delete existing clients, applications, documents, or payments. Change the admin password from Profile immediately after signing in.


## V1.5.0 finishing flow

- Client records now support application service fees via `total_fee`.
- Payments are linked to a client and optional application and support partial installments.
- Each payment receives a human-friendly Payment ID such as `ASY-PAY-2026-000001`.
- Receipts show agreed fee, previous payments, current payment and balance remaining, where an application fee exists.
- Documents can be uploaded from the global Documents page or directly from a client profile.
- New client registration opens the client workspace immediately so staff can attach documents and start an application.
- Dashboard destination promos are themed for Saudi Arabia, Poland and Europe.

After replacing an existing V1.4.x project, keep your current `server/.env` and `server/storage/`, then run `npm --prefix server run seed` once so the schema adds the new fee/payment fields without deleting existing data.
