# Grievia

AI-assisted campus grievance management & automatic escalation platform for SNS College of Technology.

## Repository layout

| Path | Description |
|------|-------------|
| `prd.md` | Product requirements |
| `system_design.md` | System architecture |
| `AI_SPEC.md` | AI usage specification (rule-first, optional LLM) |
| `implementation_plan.md` | Phased implementation plan |
| `web/` | **Web application** (Next.js + TypeScript + Tailwind + Supabase) |

## Getting started

The web app is the current deliverable. See **[`web/README.md`](web/README.md)** for full setup, Supabase migrations, demo accounts, the live escalation walkthrough, and deployment.

```bash
cd web
npm install
cp .env.example .env.local   # fill in Supabase (AI keys optional)
npm run dev
```

## Roadmap

- **Phase 1 (done):** Web application + API + deterministic core (assignment, SLA, escalation) + pluggable AI classification.
- **Phase 2 (next):** Expo React Native mobile client reusing the same API.
