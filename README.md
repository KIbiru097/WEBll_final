# Lost & Found Management System

A campus lost-and-found platform. Students report lost or found items, submit ownership
claims on found items with supporting proof, and admins review claims, manage users, and
monitor activity from a dashboard.

## Features

**Students**
- Register/login, manage profile, change password
- Report lost items and found items, each with an optional photo
- Search/filter items by name, category, location, status
- View your own reports (My Reports) and your own claims (My Claims)
- Submit an ownership claim on a found item with a reason, optional
  brand/color/serial/unique-marks details, and a proof photo
- Resubmit a claim if it's rejected

**Admins**
- Dashboard with user/item/claim counts and category breakdowns
- Manage users (search, delete, view password-change history)
- Manage lost & found reports (search, delete)
- Review claims: approve or reject, with the underlying item's status updated automatically
- Activity log of actions across the system

## Tech Stack

**Backend** — Node.js + Express, PostgreSQL (`pg`), JWT auth (`jsonwebtoken`, `bcrypt`),
`multer` for image uploads, `express-validator` for validation, `nodemailer` for
password-reset emails.

**Frontend** — React 19 + Vite, React Router, Tailwind CSS (a custom "lux" design system —
see `frontend/src/index.css` and `tailwind.config.js`), Axios.

## Project Structure

```
Lost/
├── backend/
│   ├── config/          # DB connection (config/db.js), multer config
│   ├── controllers/      # Route handlers (auth, items, claims, admin)
│   ├── middleware/       # JWT auth (protect/authorize), validation
│   ├── models/           # DB query layer (User, LostItem, FoundItem)
│   ├── migrations/       # SQL migrations + runner (npm run migrate)
│   ├── routes/           # Express routers
│   ├── services/         # Shared business logic (claim approve/reject/delete)
│   ├── uploads/          # Uploaded images (found-items/ lost-items/ proofs/)
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/   # Auth, Items, Claims, Layout, shared icons
    │   ├── contexts/      # AuthContext
    │   ├── pages/         # Dashboard, Admin, MyReports, MyClaims, Home, Profile
    │   └── services/      # api.js (axios instance + asset URL helper)
    └── vite.config.js
```

## Prerequisites

- Node.js 18+
- PostgreSQL 13+, already running, with tables for `users`, `lost_items`, `found_items`,
  `claims`, and `activity_logs` (see **Database** below — this repo ships an incremental
  migration, not the original full schema)

## Database

This repo doesn't include the original `CREATE TABLE` schema — it was created directly
against the database this project was built on. You need a Postgres database with the
tables the code expects: `users`, `lost_items`, `found_items`, `claims`, `activity_logs`.

Once your base schema exists, apply the migration in `backend/migrations/`:

```bash
cd backend
npm run migrate
```

This adds `reviewed_by` and `reviewed_at` to the `claims` table. **These columns are
required** — claim approval/rejection and the admin statistics endpoint fail without them.
The migration is safe to re-run (uses `IF NOT EXISTS`).

> **Note on `claims.item_id`:** a claim can point at either `lost_items` or `found_items`
> depending on `item_type`, so `item_id` can't carry a normal foreign key (Postgres FKs only
> reference one table). Referential integrity for this relationship is enforced in
> `backend/services/claimDecisionService.js` at the application level, not the database
> level. A real FK would require splitting `claims` into `lost_item_claims` /
> `found_item_claims` — a larger schema change, outside the scope of the current migration.

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your real DB credentials, JWT secret, etc.
npm run migrate        # apply backend/migrations/*.sql
npm run dev             # nodemon, http://localhost:5000
```

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Frontend origin, for CORS |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres connection |
| `JWT_SECRET`, `JWT_EXPIRE` | Auth token signing |
| `MAX_FILE_SIZE` | Upload size limit in bytes |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | Password-reset emails (optional in dev) |

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL if the API isn't on localhost:5000
npm run dev             # http://localhost:3000
npm run build           # production build to frontend/dist
```

## Creating the First Admin Account

Public registration (`POST /api/auth/register`) **always** creates a `student` account —
it deliberately ignores any `role` field in the request body, so nobody can self-promote to
admin through the signup form. The first admin has to be created directly against the
database:

```sql
-- After registering a normal account through the UI, promote it:
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

From then on, that admin can create further admins (or students) via:

```
POST /api/admin/users   (requires an admin JWT)
Body: { "full_name", "email", "password", "phone"?, "role": "admin" | "student" }
```

## API Overview

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

**Auth** (`/api/auth`)
`POST /register` · `POST /login` · `POST /forgot-password` · `POST /reset-password` ·
`GET /verify-reset-token/:token` · `GET /profile` · `PUT /profile` ·
`PUT /change-password` · `POST /logout` · `DELETE /account` · `GET /stats`

**Lost Items** (`/api/lost-items`)
`GET /` (search/category/location/status/user_id/page/limit) · `GET /:id` ·
`POST /` (auth, image upload) · `PUT /:id` (auth) · `DELETE /:id` (auth)

**Found Items** (`/api/found-items`) — same shape as Lost Items.

**Claims** (`/api/claims`)
`POST /` (auth, proof image upload) · `GET /` (auth, your own claims) · `GET /:id` (auth) ·
`PUT /:id` (admin — approve/reject) · `DELETE /:id` (admin)

**Admin** (`/api/admin`, all routes admin-only)
`GET /dashboard` · `GET /statistics` · `GET /logs` ·
`GET /users` · `POST /users` · `DELETE /users/:id` ·
`GET /users/:userId/password-history` ·
`GET|PUT|DELETE /lost-items[/:id]` · `GET|PUT|DELETE /found-items[/:id]` ·
`GET /claims` · `PUT /claims/:id` · `DELETE /claims/:id`

## Claim Lifecycle

1. A student submits a claim on a **found** item (`/claim/found/:itemId` in the UI) with a
   reason and optional brand/color/serial/marks/proof photo. The item's status stays
   **unchanged** while the claim is pending — submitting a claim does not lock the item.
2. An admin approves or rejects it from the Admin dashboard's Claims tab.
   - **Approved** → item status → `returned`; any other pending claims on the same item are
     auto-rejected, since the item is already going back to its owner.
   - **Rejected** → item status reverts to its type-correct open state (`open` for lost
     items, `available` for found items).
3. All of the above runs in a single DB transaction (`backend/services/claimDecisionService.js`),
   so a claim can't end up "approved" while the item is stuck on the wrong status because a
   later step failed.

## Security Notes

- Registration always creates a `student` account server-side, regardless of what the
  client sends — admin accounts can only be created by an existing admin.
- Claim approve/reject/delete go through one shared, transaction-wrapped service used by
  both `/api/claims/:id` and `/api/admin/claims/:id`, so there's a single source of truth
  for status transitions instead of two endpoints that could disagree.

## Known Limitations

- No automated test suite yet.
- `claims.item_id` has no database-level foreign key (see note under **Database**).
- The original database schema isn't included in this repo — only the incremental
  migration for the columns this codebase currently needs.