-- ===========================================================================
-- Grievia — Custom auth rebuild (Principal-provisioned username/password).
-- This REPLACES the Supabase-Auth-based schema with a self-contained model.
-- Safe to run on the existing project: it drops the old app tables and
-- recreates everything keyed to app_users (no dependency on auth.users).
-- ===========================================================================

create extension if not exists "pgcrypto";

-- Drop old tables (order matters due to FKs). CASCADE cleans dependents.
drop table if exists audit_logs cascade;
drop table if exists notifications cascade;
drop table if exists complaint_history cascade;
drop table if exists complaints cascade;
drop table if exists category_staff_map cascade;
drop table if exists sla_config cascade;
drop table if exists profiles cascade;
-- departments is reused but recreated for a clean hod_id FK.
drop table if exists departments cascade;

-- --- Enums (create if missing) ---------------------------------------------
do $$ begin
  create type user_role as enum
    ('STUDENT','FACULTY','TECHNICIAN','HOD','PRINCIPAL','SUPER_ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complaint_category as enum
    ('NETWORK','ELECTRICAL','PLUMBING','CLEANING','CLASSROOM','LABORATORY',
     'HOSTEL','FOOD','TRANSPORT','SECURITY','ACADEMIC','ADMINISTRATIVE','OTHER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complaint_priority as enum ('CRITICAL','HIGH','MEDIUM','LOW');
exception when duplicate_object then null; end $$;

do $$ begin
  create type classification_source as enum ('AI','RULE_ENGINE','MANUAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complaint_status as enum
    ('SUBMITTED','CLASSIFIED','ASSIGNED','ACCEPTED','IN_PROGRESS','RESOLVED',
     'USER_VERIFICATION','CLOSED','REOPENED','ESCALATED_TO_HOD',
     'ESCALATED_TO_PRINCIPAL','ESCALATED_TO_HIGHER_AUTHORITY');
exception when duplicate_object then null; end $$;

-- --- Departments -----------------------------------------------------------
create table departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  hod_id uuid,
  created_at timestamptz not null default now()
);

-- --- App users (custom auth) -----------------------------------------------
create table app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  full_name text not null default '',
  role user_role not null default 'STUDENT',
  department_id uuid references departments(id) on delete set null,
  register_number text,
  created_at timestamptz not null default now()
);

alter table departments
  add constraint departments_hod_fk
  foreign key (hod_id) references app_users(id) on delete set null;

-- --- SLA configuration -----------------------------------------------------
-- Two stages: WORKER window (before escalating to HOD) and HOD window
-- (before escalating to Principal). Configurable by the Principal.
create table sla_config (
  id uuid primary key default gen_random_uuid(),
  priority complaint_priority unique not null,
  worker_minutes integer not null check (worker_minutes > 0),
  hod_minutes integer not null check (hod_minutes > 0)
);

-- --- Category -> worker assignment map -------------------------------------
create table category_staff_map (
  id uuid primary key default gen_random_uuid(),
  category complaint_category not null,
  department_id uuid references departments(id) on delete cascade,
  staff_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index category_staff_map_uq
  on category_staff_map (category, coalesce(department_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- --- Complaints ------------------------------------------------------------
create sequence if not exists complaint_seq start 1000;

create table complaints (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('GRV-' || nextval('complaint_seq')::text),
  created_by uuid not null references app_users(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  category complaint_category,
  priority complaint_priority,
  status complaint_status not null default 'SUBMITTED',
  title text not null,
  description text not null,
  location text not null,
  image_path text,
  classification_source classification_source,
  ai_confidence numeric(4,3),
  ai_summary text,
  assigned_to uuid references app_users(id) on delete set null,
  sla_start_at timestamptz,
  sla_deadline_at timestamptz,
  escalation_level integer not null default 1,
  resolution_notes text,
  resolution_proof_path text,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index complaints_created_by_idx on complaints (created_by);
create index complaints_assigned_to_idx on complaints (assigned_to);
create index complaints_department_idx on complaints (department_id);
create index complaints_status_idx on complaints (status);
create index complaints_deadline_idx on complaints (sla_deadline_at);

-- --- Complaint history -----------------------------------------------------
create table complaint_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  actor_id uuid references app_users(id) on delete set null,
  action text not null,
  from_status complaint_status,
  to_status complaint_status,
  note text,
  created_at timestamptz not null default now()
);
create index complaint_history_complaint_idx on complaint_history (complaint_id);

-- --- Notifications ---------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  complaint_id uuid references complaints(id) on delete cascade,
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read);

-- --- Audit log -------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete set null,
  actor_id uuid references app_users(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_complaint_idx on audit_logs (complaint_id);

-- --- updated_at trigger ----------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists complaints_set_updated_at on complaints;
create trigger complaints_set_updated_at
  before update on complaints
  for each row execute function set_updated_at();

-- ===========================================================================
-- All access goes through the backend using the service role; RLS is left
-- disabled on these tables because there is no Supabase Auth user context.
-- Authorization is enforced in the application layer (session + role checks).
-- The anon key is NOT used for data access.
-- ===========================================================================
