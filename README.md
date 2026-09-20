# Grievia

**Grievia** is a campus grievance (complaint) management system for **SNS College of Technology**. Students and faculty report problems on campus — a broken fan, no WiFi, a water leak, canteen issues, and so on. Grievia automatically figures out what kind of problem it is, hands it to the right worker, tracks how long it takes to fix, and — if nobody fixes it in time — automatically escalates it up the chain until someone does.

Everything lives in **one Next.js web app** that you can deploy to Vercel.

---

## In plain English: how it works

1. **A student or faculty member posts a problem** (title, description, location, optional photo).
2. **An "understanding engine" reads the problem** and decides its category (network, electrical, plumbing, etc.) and how urgent it is. It uses simple keyword rules first; if it's unsure and AI keys are configured, it asks an AI model for a second opinion. If AI is unavailable, it just uses the rules — the system never breaks because of AI.
3. **The engine assigns the right worker** based on a category → worker mapping the Principal controls.
4. **The worker sees the job** in their queue, accepts it, works on it, and marks it **completed** — uploading a photo as proof. The completion time is recorded.
5. **A countdown timer runs** the whole time. The Principal sets how long a worker gets before the problem is considered overdue.
6. **If the worker doesn't finish in time**, the problem **automatically escalates to the Head of Department (HOD)** of the relevant department. The HOD can see it, reassign it to another worker, or handle it.
7. **If the HOD doesn't resolve it within their own time limit** (also set by the Principal), it **escalates again to the Principal**, who is the top of the chain and can see everything.
8. **When a worker marks a problem fixed, the original person is asked to confirm.** If they say "yes", it closes. If they say "no", it reopens and goes back to the worker.

Every action is written to a timeline and an audit log, so there's a full history of who did what and when.

---

## The four portals (one app, role-based)

| Portal | Who logs in | What they do |
|--------|-------------|--------------|
| **User** (`/user`) | Students, Faculty | Post problems, track them, confirm or reopen fixes |
| **Worker** (`/worker`) | Technicians | See assigned jobs, accept, work, mark completed with proof |
| **HOD** (`/hod`) | Heads of Department | See their department's problems + escalations, reassign, escalate |
| **Principal** (`/principal`) | Principal (main admin) | See everything, create HOD/Worker accounts, set the escalation timers, view analytics + audit log |

After login, each person is automatically sent to their own portal. They can't access portals that aren't theirs.

---

## Logins

Grievia uses its **own username + password** system (stored securely in the database with bcrypt hashing). The **Principal is the main admin** and creates the HOD and Worker accounts from inside the Principal portal.

**Demo accounts** (all passwords are `sns`):

| Username | Role |
|----------|------|
| `Principle` | Principal (main admin) |
| `student` | Student |
| `faculty` | Faculty |
| `hod.cse` | HOD (Computer Science) |
| `worker.network` | Worker (network jobs) |
| `worker.elec` | Worker (electrical jobs) |

The Principal can add more HODs and Workers at **Principal portal → Staff**, choosing their username, password, role, and department.

---

## What the Principal controls

- **Staff** (`/principal/staff`): create HOD and Worker accounts (username + password + department).
- **SLA & Config** (`/principal/config`):
  - **Escalation timers** — for each priority (Critical / High / Medium / Low), set the **worker window** (time before it escalates to the HOD) and the **HOD window** (time before it escalates to the Principal).
  - **Category → worker mapping** — decide which worker handles which category of problem.
- **Complaints** (`/principal/complaints`): every complaint college-wide, plus the ones escalated to the Principal.
- **Overview** (`/principal`): stats by department and category, average resolution time.
- **Audit log** (`/principal/audit`): a record of every important action.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS** — the whole app.
- **Supabase Postgres** — the database (tables for users, complaints, history, notifications, audit, SLA config).
- **Supabase Storage** — stores complaint photos and completion proofs (served via short-lived signed URLs).
- **Custom auth** — username/password with **bcrypt** hashing and a signed **JWT session cookie** (`jose`).
- **Rule engine + optional AI** — deterministic classification with a pluggable AI fallback (NVIDIA, Gemini, OpenRouter).

> Note: Supabase is used only as the **database and file store**. Login is handled by Grievia itself, not Supabase Auth.

---

## Running it locally

### 1. Install

```bash
cd web
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project (Project Settings → API).
- `SESSION_SECRET` — any long random string (signs the login cookie).
- `CRON_SECRET` — any random string (protects the auto-escalation job).
- AI keys are **optional** — leave blank to run rule-engine-only.

### 3. Set up the database

The SQL migrations are in `web/supabase/migrations/`. Apply them to your Supabase project either with the Supabase CLI (`supabase db push`) or by pasting them into the SQL Editor in order:
1. `0100_custom_auth.sql` — tables + custom-auth schema
2. `0101_seed.sql` — departments, SLA defaults, and the demo accounts above

Then create a **private Storage bucket** named `complaints`.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000> and sign in as `Principle` / `sns`.

### Demo the escalation live

Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` and restart — SLA windows shrink to 1–4 minutes so you can watch a complaint escalate worker → HOD → Principal in real time. The escalation check runs at `/api/cron/sla-check` (call it manually with `Authorization: Bearer <CRON_SECRET>`, or let Vercel Cron run it every minute — see `vercel.json`).

---

## Deploying to Vercel

1. Push this repo to GitHub (already at `Sanjay767676/GREVIA`).
2. In Vercel, import the repo and set the **root directory to `web`**.
3. Add all the environment variables from your `.env.local` in the Vercel project settings.
4. Deploy. `web/vercel.json` registers the auto-escalation cron.

---

## Project layout

```
web/
├── src/
│   ├── app/
│   │   ├── api/            # login, complaints, notifications, admin, upload, cron
│   │   ├── user/  worker/  hod/  principal/   # the four role portals
│   │   └── login/  page.tsx                    # login + landing
│   ├── components/         # shared UI (tables, badges, detail, shell, logo…)
│   └── lib/
│       ├── engines/        # classifier, assignment, SLA, escalation
│       ├── ai/             # optional AI classifier + providers
│       ├── session.ts      # JWT session cookie
│       ├── auth.ts / api-auth.ts   # role gating
│       └── db.ts           # database access
└── supabase/migrations/    # database schema + seed
```
