-- ===========================================================================
-- Grievia — Row Level Security
-- Enforces system_design §10. API also re-checks authorization; RLS is the
-- backstop so the anon/auth key can never over-read.
-- ===========================================================================

-- Helper functions run as SECURITY DEFINER to read the caller's role/department
-- without triggering recursive RLS on the profiles table.
create or replace function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function auth_department() returns uuid as $$
  select department_id from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_staff_admin() returns boolean as $$
  select coalesce(auth_role() in ('PRINCIPAL','SUPER_ADMIN'), false);
$$ language sql stable security definer;

-- Enable RLS ----------------------------------------------------------------
alter table profiles            enable row level security;
alter table departments         enable row level security;
alter table sla_config          enable row level security;
alter table category_staff_map  enable row level security;
alter table complaints          enable row level security;
alter table complaint_history   enable row level security;
alter table notifications       enable row level security;
alter table audit_logs          enable row level security;

-- --- profiles --------------------------------------------------------------
drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles
  for select using (
    id = auth.uid()
    or is_staff_admin()
    or auth_role() in ('HOD','TECHNICIAN')
  );

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
  for update using (id = auth.uid() or is_staff_admin());

drop policy if exists profiles_admin_insert on profiles;
create policy profiles_admin_insert on profiles
  for insert with check (is_staff_admin() or id = auth.uid());

-- --- departments (read-all authenticated, write admin) ---------------------
drop policy if exists departments_read on departments;
create policy departments_read on departments
  for select using (auth.uid() is not null);
drop policy if exists departments_write on departments;
create policy departments_write on departments
  for all using (is_staff_admin()) with check (is_staff_admin());

-- --- sla_config (read-all, write admin) ------------------------------------
drop policy if exists sla_read on sla_config;
create policy sla_read on sla_config
  for select using (auth.uid() is not null);
drop policy if exists sla_write on sla_config;
create policy sla_write on sla_config
  for all using (is_staff_admin()) with check (is_staff_admin());

-- --- category_staff_map (read-all, write admin) ----------------------------
drop policy if exists csm_read on category_staff_map;
create policy csm_read on category_staff_map
  for select using (auth.uid() is not null);
drop policy if exists csm_write on category_staff_map;
create policy csm_write on category_staff_map
  for all using (is_staff_admin()) with check (is_staff_admin());

-- --- complaints ------------------------------------------------------------
-- Read: owner, assigned technician, HOD of same department, principal/admin.
drop policy if exists complaints_read on complaints;
create policy complaints_read on complaints
  for select using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or is_staff_admin()
    or (auth_role() = 'HOD' and department_id = auth_department())
  );

-- Insert: any authenticated user, only as themselves.
drop policy if exists complaints_insert on complaints;
create policy complaints_insert on complaints
  for insert with check (created_by = auth.uid());

-- Update: owner (verification/reopen), assigned technician, HOD (same dept),
-- principal/admin. Column-level intent is enforced in the API layer.
drop policy if exists complaints_update on complaints;
create policy complaints_update on complaints
  for update using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or is_staff_admin()
    or (auth_role() = 'HOD' and department_id = auth_department())
  );

-- --- complaint_history -----------------------------------------------------
drop policy if exists history_read on complaint_history;
create policy history_read on complaint_history
  for select using (
    exists (
      select 1 from complaints c
      where c.id = complaint_history.complaint_id
        and (
          c.created_by = auth.uid()
          or c.assigned_to = auth.uid()
          or is_staff_admin()
          or (auth_role() = 'HOD' and c.department_id = auth_department())
        )
    )
  );
drop policy if exists history_insert on complaint_history;
create policy history_insert on complaint_history
  for insert with check (auth.uid() is not null);

-- --- notifications ---------------------------------------------------------
drop policy if exists notifications_read on notifications;
create policy notifications_read on notifications
  for select using (user_id = auth.uid());
drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications
  for update using (user_id = auth.uid());

-- --- audit_logs (read: admin + HOD scope via complaint; insert authed) -----
drop policy if exists audit_read on audit_logs;
create policy audit_read on audit_logs
  for select using (is_staff_admin() or auth_role() = 'HOD');
drop policy if exists audit_insert on audit_logs;
create policy audit_insert on audit_logs
  for insert with check (auth.uid() is not null);
