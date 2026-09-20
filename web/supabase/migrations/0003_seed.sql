-- ===========================================================================
-- Grievia — Seed data (idempotent)
-- Departments, SLA defaults. Staff mappings + demo users are wired after the
-- auth users exist (see supabase/seed_demo_users.sql and README).
-- ===========================================================================

-- --- Departments -----------------------------------------------------------
insert into departments (code, name) values
  ('CSE',   'Computer Science & Engineering'),
  ('ECE',   'Electronics & Communication'),
  ('MECH',  'Mechanical Engineering'),
  ('CIVIL', 'Civil Engineering'),
  ('EEE',   'Electrical & Electronics'),
  ('ADMIN', 'Administration & Facilities')
on conflict (code) do nothing;

-- --- SLA defaults (production hours; PRD §10) ------------------------------
-- Critical 4h, High 12h, Medium 24h, Low 48h.
insert into sla_config (priority, minutes) values
  ('CRITICAL', 240),
  ('HIGH',     720),
  ('MEDIUM',   1440),
  ('LOW',      2880)
on conflict (priority) do nothing;
