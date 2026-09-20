# GREVIA

## System Architecture

### 1. Architecture Style

Use a modular full-stack architecture.

The core workflow must be deterministic and must not depend on an external AI API.

### 2. Frontend

Web:
Next.js + TypeScript + Tailwind CSS

Mobile:
Expo React Native + TypeScript

Both clients communicate with the backend through authenticated APIs.

### 3. Backend Modules

Create independent modules:

/auth
/users
/departments
/complaints
/classification
/assignment
/sla
/escalation
/notifications
/resolution
/analytics
/audit

### 4. Complaint Processing

Request:

POST /api/complaints

Flow:

1. Authenticate user
2. Validate request
3. Store complaint
4. Determine department
5. Run rule-based classification
6. If classification is uncertain, optionally call AI
7. Determine priority
8. Find responsible staff
9. Calculate SLA deadline
10. Create complaint history event
11. Notify assigned staff
12. Return complaint details

### 5. AI Fallback

AI must be optional.

If AI API fails:

* Do not fail complaint creation.
* Use rule-based classification.
* Mark classification source as RULE_ENGINE.

Possible classification sources:

AI
RULE_ENGINE
MANUAL

### 6. Assignment Engine

Assignment must be database-driven.

Example:

NETWORK → Network Technician

ELECTRICAL → Electrical Technician

PLUMBING → Plumber

CLEANING → Housekeeping

LAB → Lab Technician

The mapping must be configurable by Admin.

### 7. SLA Engine

SLA configuration must be stored in database.

Example:

CRITICAL = 4 hours
HIGH = 12 hours
MEDIUM = 24 hours
LOW = 48 hours

Do not hard-code SLA values inside frontend code.

### 8. Escalation Engine

Escalation levels:

LEVEL 1:
Technician / Responsible Staff

LEVEL 2:
Department HOD

LEVEL 3:
Principal

LEVEL 4:
Higher Authority

The escalation engine must be idempotent.

A complaint must never be escalated twice to the same level.

### 9. Background Processing

Use scheduled server-side processing for SLA checks.

The system must periodically find complaints where:

current_time > sla_deadline
AND status is not resolved/closed
AND escalation_level is current_level

Then escalate.

### 10. Security

Use Supabase authentication.

Enforce role-based authorization at API level.

Never rely only on frontend route protection.

Students must not access another student's complaint.

Technicians must only access assigned complaints unless authorized.

HODs must only access complaints belonging to their department.

Principal/Admin may access broader datasets.

### 11. Storage

Supabase Storage:

/complaints/{complaint_id}/

Store:

* Complaint image
* Resolution proof

Use signed URLs where appropriate.

### 12. Audit

Every workflow transition creates an immutable audit event.

### 13. Reliability

Core complaint creation, assignment and escalation must work without AI.

AI is an enhancement layer, not a system dependency.
