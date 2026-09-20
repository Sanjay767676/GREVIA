-- ===========================================================================
-- Grievia — Core schema
-- Run order: 0001_schema.sql -> 0002_rls.sql -> 0003_seed.sql
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --- Enums -----------------------------------------------------------------
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
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  hod_id uuid,
  created_at timestamptz not null default now()
);

-- --- Profiles (1:1 with auth.users) ----------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role user_role not null default 'STUDENT',
  department_id uuid references departments(id) on delete set null,
  register_number text,
  created_at timestamptz not null default now()
);

alter table departments
  drop constraint if exists departments_hod_fk;
alter table departments
  add constraint departments_hod_fk
  foreign key (hod_id) references profiles(id) on delete set null;

-- --- SLA configuration -----------------------------------------------------
create table if not exists sla_config (
  id uuid primary key default gen_random_uuid(),
  priority complaint_priority unique not null,
  minutes integer not null check (minutes > 0)
);

-- --- Category -> staff assignment map --------------------------------------
-- department_id NULL == applies to all departments (global fallback).
create table if not exists category_staff_map (
  id uuid primary key default gen_random_uuid(),
  category complaint_category not null,
  department_id uuid references departments(id) on delete cascade,
  staff_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index if not exists category_staff_map_uq
  on category_staff_map (category, coalesce(department_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- --- Complaints ------------------------------------------------------------
create sequence if not exists complaint_seq start 1000;

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('GRV-' || nextval('complaint_seq')::text),
  created_by uuid not null references profiles(id) on delete cascade,
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
  assigned_to uuid references profiles(id) on delete set null,
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

create index if not exists complaints_created_by_idx on complaints (created_by);
create index if not exists complaints_assigned_to_idx on complaints (assigned_to);
create index if not exists complaints_department_idx on complaints (department_id);
create index if not exists complaints_status_idx on complaints (status);
create index if not exists complaints_deadline_idx on complaints (sla_deadline_at);

-- --- Complaint history (timeline) ------------------------------------------
create table if not exists complaint_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  from_status complaint_status,
  to_status complaint_status,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists complaint_history_complaint_idx
  on complaint_history (complaint_id);

-- --- Notifications ---------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  complaint_id uuid references complaints(id) on delete cascade,
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, read);

-- --- Audit log (immutable) -------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete set null,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_complaint_idx on audit_logs (complaint_id);

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

-- --- Auto-create profile on signup -----------------------------------------
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
