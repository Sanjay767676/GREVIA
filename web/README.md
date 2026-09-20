# Grievia — Web

AI-assisted campus grievance management & automatic escalation platform for SNS College of Technology.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**. The core workflow (classification routing, assignment, SLA, escalation) is fully deterministic and works with **zero AI keys**. AI is an optional enhancement layer with a rule-engine fallback.

---

## Portals

| Portal | Path | Roles |
|--------|------|-------|
| User | `/user` | Student, Faculty |
| Worker | `/worker` | Technician |
| HOD | `/hod` | HOD |
| Admin | `/admin` | Principal, Super Admin |

`admin` is the Principal portal; **Super Admin** additionally sees the **Configuration** tab. Role-based routing is enforced in middleware, server layouts (`requireRole`), API handlers (`requireApiRole`), and Supabase RLS.

---

## Architecture

- **Deterministic core** (`src/lib/engines/`): rule classifier, assignment, SLA, escalation. Runs regardless of AI availability.
- **AI fallback** (`src/lib/ai/`): rule-first; AI is consulted only when the rule result is ambiguous/low-confidence and a provider key exists. Providers are tried in order and any failure degrades to `RULE_ENGINE`.
- **API** (`src/app/api/`): complaint lifecycle, notifications, admin config, and the SLA cron sweep.
- **Supabase**: auth, Postgres (with RLS), and Storage for images/proofs.

Complaint lifecycle: `SUBMITTED → CLASSIFIED → ASSIGNED → ACCEPTED → IN_PROGRESS → RESOLVED → USER_VERIFICATION → CLOSED`, with SLA-driven escalation `Technician → HOD → Principal → Higher Authority`.

---

## Prerequisites

- Node.js 18+ (20+ recommended)
- A Supabase project (free tier is fine)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

At [supabase.com](https://supabase.com), create a project. From **Project Settings → API**, copy:

- Project URL
- `anon` public key
- `service_role` key (secret)

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in the Supabase values. The AI keys are all **optional** — leave them blank to run rule-engine-only.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Secret; server only |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | yes | Default `complaints` |
| `CRON_SECRET` | yes | Protects the SLA cron endpoint |
| `NEXT_PUBLIC_DEMO_MODE` | no | `true` = short SLA windows for live demos |
| `AI_PROVIDER_ORDER` | no | e.g. `nvidia,gemini,grok,openrouter` |
| `NVIDIA_API_KEY` / `GEMINI_API_KEY` / `GROK_API_KEY` / `OPENROUTER_API_KEY` | no | Any subset; first configured & working provider wins |

### 4. Run the database migrations

In the Supabase **SQL Editor**, run these files in order:

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_seed.sql`

### 5. Create the storage bucket

In **Storage**, create a bucket named `complaints` (matches `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`). Keep it **private** — the app serves files via signed URLs.

### 6. Create demo users and wire roles

In **Authentication → Users → Add user**, create these accounts (enable **Auto Confirm User**). A profile row is auto-created for each by a trigger.

| Email | Role |
|-------|------|
| `student@sns.edu` | Student |
| `faculty@sns.edu` | Faculty |
| `tech.network@sns.edu` | Technician |
| `tech.elec@sns.edu` | Technician |
| `hod.cse@sns.edu` | HOD (CSE) |
| `principal@sns.edu` | Principal |
| `admin@sns.edu` | Super Admin |

Then run `supabase/seed_demo_users.sql` in the SQL Editor to set roles, departments, and the category → staff assignment map. (You can also manage all of this later from the Super Admin **Configuration** tab.)

### 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any demo account. Each role lands in its own portal automatically.

---

## SLA escalation (background job)

Overdue complaints are escalated by `GET /api/cron/sla-check`, protected by `CRON_SECRET`.

**Locally**, trigger it manually:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/sla-check
```

**On Vercel**, `vercel.json` schedules it every minute automatically (Vercel Cron calls are authenticated by the platform).

---

## Live demo walkthrough

Set `NEXT_PUBLIC_DEMO_MODE=true` so SLA windows are 1–4 minutes instead of 4–48 hours, then restart.

1. **Student** (`student@sns.edu`) submits "WiFi not working in CSE Lab 3". It is auto-classified as **NETWORK**, assigned to the network technician, and an SLA countdown starts.
2. **Technician** (`tech.network@sns.edu`) sees it in *My queue*, clicks **Accept → Start work → Mark resolved** (optionally attaching proof).
3. **Student** gets a verification request and clicks **Yes, close it** (or **No, reopen**).
4. To demo escalation, submit a complaint and **do not** accept it. Wait past the demo SLA window (or hit the cron endpoint). It escalates to the **HOD**, then **Principal**, then **Higher Authority**, notifying each in turn.
5. **HOD** (`hod.cse@sns.edu`) can reassign staff or escalate manually; **Principal** (`principal@sns.edu`) sees college-wide analytics; **Super Admin** (`admin@sns.edu`) manages SLA rules, assignment mappings, and user roles.

The in-app notification bell (top right) polls for updates across all portals.

---

## Deployment (Vercel)

1. Push this `web/` directory to a Git repo and import it in Vercel.
2. Add all environment variables from `.env.local` in the Vercel project settings.
3. Deploy. `vercel.json` registers the SLA cron automatically.
4. Point production SLA back to real windows by leaving `NEXT_PUBLIC_DEMO_MODE` unset/`false`.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (type-checks + lints) |
| `npm start` | Run the production build |
| `npm run lint` | Lint only |

---

## Project structure

```
web/
├── src/
│   ├── app/                 # App Router pages + API routes
│   │   ├── api/             # complaints, notifications, admin, cron
│   │   ├── user/  worker/  hod/  admin/   # role portals
│   │   ├── login/  post-login/  page.tsx  # auth + landing
│   ├── components/          # shared UI (tables, badges, shell, timeline…)
│   ├── lib/
│   │   ├── engines/         # deterministic core (classifier, assignment, sla, escalation, events)
│   │   ├── ai/              # pluggable AI classifier (providers + orchestrator)
│   │   ├── supabase/        # browser / server / admin clients
│   │   └── …                # auth, constants, types, stats, analytics
│   └── middleware.ts        # session refresh + route gating
├── supabase/
│   ├── migrations/          # 0001 schema, 0002 RLS, 0003 seed
│   └── seed_demo_users.sql  # demo role wiring
└── vercel.json              # SLA cron schedule
```

---

## Notes

- The system is designed to keep working if the AI service is down; classification simply falls back to the rule engine and is tagged `RULE_ENGINE`.
- All privileged workflow steps (assignment, escalation, audit, notifications) run through the service-role client on the server; the browser only ever uses the RLS-scoped anon client.
- A React Native (Expo) mobile client is the planned next phase; this repo is the web application and its API, which the mobile app will reuse.
```
