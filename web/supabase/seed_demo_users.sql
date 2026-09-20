-- ===========================================================================
-- Grievia — Demo user wiring (RUN AFTER creating auth users)
-- ===========================================================================
-- Supabase does not let you insert into auth.users via plain SQL reliably, so:
--
-- STEP 1: In the Supabase Dashboard -> Authentication -> Users -> "Add user",
--   create these accounts (email + password, "Auto Confirm User" = ON):
--
--     student@sns.edu       (STUDENT)
--     faculty@sns.edu       (FACULTY)
--     tech.network@sns.edu  (TECHNICIAN)
--     tech.elec@sns.edu     (TECHNICIAN)
--     hod.cse@sns.edu       (HOD, CSE)
--     principal@sns.edu     (PRINCIPAL)
--     admin@sns.edu         (SUPER_ADMIN)
--
--   The on_auth_user_created trigger auto-creates a profiles row for each.
--
-- STEP 2: Run this script (SQL editor) to set roles, departments and the
--   category -> staff assignment map. Safe to re-run.
-- ===========================================================================

-- Roles & departments -------------------------------------------------------
update profiles p set role = 'STUDENT',
  department_id = (select id from departments where code = 'CSE'),
  register_number = '71762207001', full_name = coalesce(nullif(p.full_name,''),'Demo Student')
  where p.email = 'student@sns.edu';

update profiles p set role = 'FACULTY',
  department_id = (select id from departments where code = 'CSE'),
  full_name = coalesce(nullif(p.full_name,''),'Demo Faculty')
  where p.email = 'faculty@sns.edu';

update profiles p set role = 'TECHNICIAN',
  department_id = (select id from departments where code = 'ADMIN'),
  full_name = coalesce(nullif(p.full_name,''),'Network Technician')
  where p.email = 'tech.network@sns.edu';

update profiles p set role = 'TECHNICIAN',
  department_id = (select id from departments where code = 'ADMIN'),
  full_name = coalesce(nullif(p.full_name,''),'Electrical Technician')
  where p.email = 'tech.elec@sns.edu';

update profiles p set role = 'HOD',
  department_id = (select id from departments where code = 'CSE'),
  full_name = coalesce(nullif(p.full_name,''),'HOD - CSE')
  where p.email = 'hod.cse@sns.edu';

update profiles p set role = 'PRINCIPAL',
  full_name = coalesce(nullif(p.full_name,''),'Principal')
  where p.email = 'principal@sns.edu';

update profiles p set role = 'SUPER_ADMIN',
  full_name = coalesce(nullif(p.full_name,''),'Super Admin')
  where p.email = 'admin@sns.edu';

-- Point CSE department HOD at the HOD account -------------------------------
update departments d
  set hod_id = (select id from profiles where email = 'hod.cse@sns.edu')
  where d.code = 'CSE';

-- Category -> staff map (global fallback rows, department_id = NULL) --------
-- Network-ish categories -> network tech; power -> electrical tech; the rest
-- default to the network tech for demo purposes. Adjust in the Admin portal.
insert into category_staff_map (category, department_id, staff_id)
select c.category, null::uuid, s.id
from (values
  ('NETWORK'),('CLASSROOM'),('LABORATORY'),('FOOD'),('TRANSPORT'),
  ('SECURITY'),('ACADEMIC'),('ADMINISTRATIVE'),('OTHER'),('CLEANING'),('HOSTEL')
) as c(category)
cross join (select id from profiles where email = 'tech.network@sns.edu') s
on conflict do nothing;

insert into category_staff_map (category, department_id, staff_id)
select c.category, null::uuid, s.id
from (values ('ELECTRICAL'),('PLUMBING')) as c(category)
cross join (select id from profiles where email = 'tech.elec@sns.edu') s
on conflict do nothing;
