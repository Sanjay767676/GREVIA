# Grievia

**Grievia** is a campus grievance (complaint) management system for **SNS College of Technology**. Students and faculty report problems on campus — a broken fan, no WiFi, a water leak, canteen issues, and so on. Grievia automatically classifies the problem, routes it to the right worker, tracks how long it takes to fix, and escalates it up the chain when deadlines are missed.

The project is split into two apps:

```
frontend/   React 18 + Vite + TypeScript + Tailwind CSS
backend/    Express 4 + TypeScript + Supabase (database + storage)
supabase/   SQL migrations (schema + demo seed)
```

---

## How it works

1. **A student or faculty member posts a problem** (title, description, location, optional photo).
2. **A rule-first classifier** decides the category (network, electrical, plumbing, etc.) and priority instantly. If the text is unclear and AI keys are configured, an AI model is asked for a second opinion. If AI is unavailable, the rules are enough — the workflow never breaks.
3. **The right worker is assigned** using the category → worker mapping the Principal controls.
4. **The worker sees the job**, accepts it, works on it, and marks it **completed** with optional photo proof.
5. **An SLA countdown runs** for the whole job, using the windows the Principal configures.
6. **If the worker misses the deadline**, the complaint **escalates automatically to the HOD**.
7. **If the HOD misses theirs**, it **escalates to the Principal**.
8. **The complainant verifies the fix.** “Yes” closes it; “No” reopens it and restarts the worker SLA.

Every action is written to the complaint timeline and to an immutable audit log.

---

## The four portals

| Portal | Who logs in | What they do |
|--------|-------------|--------------|
| **User** (`/user`) | Students, Faculty | Post problems, track them, confirm or reopen fixes |
| **Worker** (`/worker`) | Technicians | See assigned jobs, accept, work, mark completed with proof |
| **HOD** (`/hod`) | Heads of Department | See their department’s problems and escalations, reassign, escalate |
| **Principal** (`/principal`) | Principal (main admin) | See everything, create staff accounts, set timers and mappings, view analytics + audit |

After login each person is automatically sent to their own portal and cannot access another role’s portal.

---

## Demo logins

Grievia uses its own **username + password** system (bcrypt-hashed in the database) and a signed **JWT session cookie** (`jose`). The Principal creates HOD and Worker accounts from inside the Principal portal.

All demo passwords are `sns`:

| Username | Role |
|----------|------|
| `Principle` | Principal (main admin) |
| `student` | Student |
| `faculty` | Faculty |
| `hod.cse` | HOD (Computer Science) |
| `worker.network` | Worker (network jobs) |
| `worker.elec` | Worker (electrical jobs) |

---

## Tech stack

**Frontend**
- React 18 + TypeScript, built with Vite
- React Router for the four role portals
- Tailwind CSS with an amber / yellow / white design system
- Lexend (display) + Source Sans 3 (body)

**Backend**
- Express 4 + TypeScript (ESM)
- Supabase Postgres for data and Supabase Storage for photos/proofs
- Custom auth with bcrypt + JWT httpOnly cookie
- Rule-first classification with an optional AI fallback (NVIDIA, Gemini, OpenRouter)
- Built-in SLA sweeper every 60 seconds, plus a protected `/api/cron/sla-check` endpoint

Supabase is used only as the **database and file store**. Login is handled by Grievia itself, not Supabase Auth.

---

## Running locally

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Fill in:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Project Settings → API.
- `SESSION_SECRET` — any long random string (signs the session cookie).
- `CRON_SECRET` — any random string (protects the cron endpoint).
- AI keys are **optional** — leave blank to run rule-engine-only.

The frontend needs no configuration for local development. In production, set `VITE_API_URL` to the deployed API URL:

```bash
cd frontend
cp .env.example .env
```

### 3. Set up the database

Apply the SQL in `supabase/migrations/` to your Supabase project, in order:

1. `0100_custom_auth.sql` — tables + custom-auth schema
2. `0101_seed.sql` — departments, SLA defaults, and the demo accounts

Use the Supabase CLI (`supabase db push`) or paste each file into the SQL Editor. Then create a **private Storage bucket** named `complaints`.

### 4. Run

Backend (port 4000):

```bash
cd backend
npm run dev
```

Frontend (port 5173, proxies `/api` to the backend):

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173> and sign in as `Principle` / `sns`.

### Demo the escalation live

Set `DEMO_MODE=true` in `backend/.env` and restart. SLA windows shrink to 1–4 minutes so you can watch a complaint escalate worker → HOD → Principal in real time. You can also force a sweep from **Principal portal → Overview → Run SLA escalation check**, or call:

```bash
curl -X POST http://localhost:4000/api/cron/sla-check \
  -H "Authorization: Bearer <CRON_SECRET>"
```

---

## Production build

```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # serves ./frontend/dist
```

Host `frontend/dist` on any static host and point `VITE_API_URL` at the Express API. Because the SPA uses client-side routing, configure the host to rewrite unknown paths to `index.html` (a “history fallback”), otherwise refreshing a URL like `/principal/config` returns a 404. When frontend and backend are on different sites, set:

- `COOKIE_SAMESITE=none`
- `COOKIE_SECURE=true`
- `CORS_ORIGINS=https://your-frontend.example.com`

---

## Deploy (Render + Vercel)

The repo ships with `render.yaml` (API Blueprint) and `frontend/vercel.json` (SPA rewrites).

### 1. Database - Supabase (once)

1. Create a project at supabase.com.
2. SQL Editor: run `supabase/migrations/0100_custom_auth.sql`, then `0101_seed.sql`.
3. Storage: create a **private** bucket named `complaints`. No policies are needed - the API uses the service-role key.
4. Copy the Project URL and `service_role` key from Project Settings -> API.

### 2. Backend - Render

Blueprint (uses `render.yaml`):

1. Push this repo to GitHub.
2. Render dashboard -> New -> Blueprint -> select the repo.
3. Enter `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` when prompted.
4. Deploy, then copy the service URL (for example `https://grievia-api.onrender.com`).
5. Set `CORS_ORIGINS` to the Vercel URL from step 3, then redeploy.

Manual web service (same result):

- Root Directory: `backend`
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Add the variables from `backend/.env.example` in the dashboard. Do **not** set `PORT`; Render injects it.

Confirm `https://<service>.onrender.com/api/health` returns `{"ok":true,...}`.

### 3. Frontend - Vercel

1. Vercel -> Add New -> Project -> import the repo.
2. Root Directory: `frontend` (Framework preset: Vite).
3. Environment Variable: `VITE_API_URL=https://grievia-api.onrender.com` for Production (add Preview too if you use it).
4. Deploy.
5. Copy the Vercel URL, set it as `CORS_ORIGINS` on Render, and redeploy the API.

`VITE_API_URL` is baked in at build time, so changing it requires a new Vercel deployment.

### 4. Keep escalations running

The API checks SLAs every 60 seconds while awake and also exposes `POST /api/cron/sla-check` for external schedulers. Render's free plan sleeps after about 15 minutes idle, which pauses the built-in check. Either:

- Create a free cron at cron-job.org (or GitHub Actions) that calls
  `POST https://<service>.onrender.com/api/cron/sla-check` every 10 minutes with the header
  `Authorization: Bearer <CRON_SECRET>` (this also wakes the service), or
- Upgrade the Render service so it stays awake.

### 5. Before going live

- Change the seeded demo passwords. In `backend/`, generate a hash:

  ```bash
  node -e "import('bcryptjs').then(b=>b.default.hash('NEW_PASSWORD',10).then(console.log))"
  ```

  Then run in the Supabase SQL Editor:

  ```sql
  update app_users set password_hash = '<hash>' where username = 'Principle';
  ```

  Repeat for `student`, `faculty`, `hod.cse`, `worker.network`, `worker.elec`, or create real accounts in the Principal portal and remove the demo ones.
- Keep `DEMO_MODE=false` so SLA windows are the real 4h / 12h / 24h / 48h.
- Never commit `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, or `CRON_SECRET`.

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Login succeeds, then requests return 401 | Cookie blocked or cross-site | Set `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, and make `CORS_ORIGINS` the exact https frontend origin (no trailing slash) |
| CORS error in the browser console | Frontend origin missing from `CORS_ORIGINS` | Add it and redeploy the API |
| Refreshing `/principal/config` gives 404 | SPA rewrite missing | Keep `frontend/vercel.json`, set the Vercel Root Directory to `frontend` |
| Uploads fail | Bucket missing | Create the private `complaints` bucket |
| API calls hit the wrong host | `VITE_API_URL` wrong | Use the API origin only, with no `/api` suffix |

---

## API overview

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Sign in, set session cookie |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current session |
| GET/POST | `/api/complaints` | List visible complaints / create one |
| GET | `/api/complaints/:id` | Detail + history + signed image/proof URLs |
| POST | `/api/complaints/:id/status` | Worker accept / start / resolve |
| POST | `/api/complaints/:id/verify` | Complainant close or reopen |
| POST | `/api/complaints/:id/reassign` | HOD/Principal reassign worker |
| POST | `/api/complaints/:id/escalate` | Manual escalation |
| GET/POST/PATCH | `/api/admin/users` | Staff accounts |
| GET/PATCH | `/api/admin/sla` | SLA windows per priority |
| GET/PUT | `/api/admin/assignments` | Category → worker mappings |
| POST | `/api/admin/run-escalation` | Run the SLA sweep now |
| GET | `/api/admin/audit` | Audit log |
| GET | `/api/staff`, `/api/departments` | Reference data |
| GET/PATCH | `/api/notifications` | Notifications |
| POST | `/api/upload` | Upload a photo to Supabase Storage |
| GET/POST | `/api/cron/sla-check` | Protected scheduled sweep |

---

## Project layout

```
backend/
└── src/
    ├── config/        # environment
    ├── domain/        # roles, statuses, categories, types
    ├── lib/           # db, errors, session, auth
    ├── routes/        # auth, complaints, admin, directory, notifications, upload, cron
    ├── services/      # sla, assignment, classifier, escalation, events, sweeper, AI
    ├── app.ts         # Express app
    └── index.ts       # server + built-in SLA sweeper

frontend/
└── src/
    ├── components/    # shell, nav, tables, badges, timeline, detail…
    ├── lib/           # api client, auth context, constants, types, helpers
    └── pages/         # home, login, user/, worker/, hod/, principal/

supabase/
└── migrations/        # schema + demo seed
```
