-- ===========================================================================
-- Grievia — Seed (custom auth). Idempotent.
-- Passwords are all "sns" (demo). bcrypt hashes below (cost 10).
-- ===========================================================================

-- Departments --------------------------------------------------------------
insert into departments (code, name) values
  ('CSE',   'Computer Science & Engineering'),
  ('ECE',   'Electronics & Communication'),
  ('MECH',  'Mechanical Engineering'),
  ('CIVIL', 'Civil Engineering'),
  ('EEE',   'Electrical & Electronics'),
  ('ADMIN', 'Administration & Facilities')
on conflict (code) do nothing;

-- SLA defaults: worker window then HOD window (minutes) -----------------------
-- Production-ish defaults; Principal can change these in the portal.
insert into sla_config (priority, worker_minutes, hod_minutes) values
  ('CRITICAL', 240,  240),
  ('HIGH',     720,  360),
  ('MEDIUM',   1440, 720),
  ('LOW',      2880, 1440)
on conflict (priority) do nothing;

-- Users (all password = "sns") ----------------------------------------------
-- Principal (main admin). Username: Principle
insert into app_users (username, password_hash, full_name, role)
values ('Principle', '$2b$10$kPzzP.E7A6WCwumbdMTEIOH7nVp13Hhm8KdeZxYtb93AL8sZpMsim', 'Principal', 'PRINCIPAL')
on conflict (username) do nothing;

-- A demo student + faculty (self-service users)
insert into app_users (username, password_hash, full_name, role, department_id, register_number)
values ('student', '$2b$10$ijMcfM0IS89G9dPuKKrOR.wVRHBzQh8sDmlT1rAsSlOKCgfEaghwi', 'Demo Student', 'STUDENT',
        (select id from departments where code='CSE'), '71762207001')
on conflict (username) do nothing;

insert into app_users (username, password_hash, full_name, role, department_id)
values ('faculty', '$2b$10$AYtlqmpirewRSJ3TJadJ/.VesugJhVmX4BpkoOgUPra24WwN9MTsi', 'Demo Faculty', 'FACULTY',
        (select id from departments where code='CSE'))
on conflict (username) do nothing;

-- A demo HOD + two workers (normally created by the Principal in-app)
insert into app_users (username, password_hash, full_name, role, department_id)
values ('hod.cse', '$2b$10$60lXtZP3aCEtEp7cZaHBUe.ExVYwa8M463IgkG1IZ2ZajBlF3SlG.', 'HOD - CSE', 'HOD',
        (select id from departments where code='CSE'))
on conflict (username) do nothing;

insert into app_users (username, password_hash, full_name, role, department_id)
values ('worker.network', '$2b$10$ekZ3z4sP3jCZDeMa.txFIeffp3Yg/4aPiBJ8FsUVKy/XFYFt6hZZa', 'Network Technician', 'TECHNICIAN',
        (select id from departments where code='ADMIN'))
on conflict (username) do nothing;

insert into app_users (username, password_hash, full_name, role, department_id)
values ('worker.elec', '$2b$10$q0k7Le.IexSqUXZSC7qSAORf2uTqB6xBtIph.q0D2ZQBnQABxDYte', 'Electrical Technician', 'TECHNICIAN',
        (select id from departments where code='ADMIN'))
on conflict (username) do nothing;

-- Point CSE HOD --------------------------------------------------------------
update departments d set hod_id = (select id from app_users where username='hod.cse')
  where d.code = 'CSE';

-- Category -> worker map (global fallback) -----------------------------------
insert into category_staff_map (category, department_id, staff_id)
select c.category::complaint_category, null::uuid, s.id
from (values
  ('NETWORK'),('CLASSROOM'),('LABORATORY'),('FOOD'),('TRANSPORT'),
  ('SECURITY'),('ACADEMIC'),('ADMINISTRATIVE'),('OTHER'),('CLEANING'),('HOSTEL')
) as c(category)
cross join (select id from app_users where username='worker.network') s
on conflict do nothing;

insert into category_staff_map (category, department_id, staff_id)
select c.category::complaint_category, null::uuid, s.id
from (values ('ELECTRICAL'),('PLUMBING')) as c(category)
cross join (select id from app_users where username='worker.elec') s
on conflict do nothing;
