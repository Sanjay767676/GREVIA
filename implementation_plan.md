# GRIEVIA

## 2 Hour implementation plan

### Phase 1 — Foundation

* Initialize Git repository
* Create Next.js web application
* Create Expo mobile application
* Configure Supabase
* Configure environment variables
* Configure authentication
* Create database schema
* Create seed data

### Phase 2 — Authentication and RBAC

Implement:

Student
Faculty
Technician
HOD
Principal
Admin

Create protected routes and API authorization.

### Phase 3 — Complaint System

Implement:

* Create complaint
* List complaints
* Complaint details
* Complaint status
* Image upload
* Complaint history

### Phase 4 — Assignment

Implement:

* Category mapping
* Department mapping
* Responsible staff mapping
* Automatic assignment

### Phase 5 — SLA

Implement:

* SLA configuration
* Deadline calculation
* Countdown
* Due-soon detection
* Overdue detection

### Phase 6 — Escalation

Implement:

Technician → HOD → Principal → Higher Authority

Create automatic escalation logic.

### Phase 7 — Technician Dashboard

Implement:

* Assigned complaints
* Accept
* In progress
* Resolve
* Resolution notes
* Resolution proof

### Phase 8 — HOD Dashboard

Implement:

* Department complaints
* Escalated complaints
* SLA violations
* Reassignment
* Escalation controls
* Analytics

### Phase 9 — Principal Dashboard

Implement:

* College-wide statistics
* Department statistics
* Escalation statistics
* Resolution time
* Category analytics

### Phase 10 — AI

Implement:

* Rule-based classifier
* AI fallback classifier
* Priority suggestion
* AI confidence
* AI failure fallback

### Phase 11 — Verification

Implement:

* Student resolution confirmation
* Reopen complaint
* Complaint closure

### Phase 12 — Notifications

Implement in-app notifications first.

Email notifications can be added if time permits.

### Phase 13 — Testing

Test:

* Authentication
* Role permissions
* Complaint creation
* Assignment
* SLA calculation
* Escalation
* Resolution
* Reopening
* AI failure
* Image upload
* Mobile responsiveness

### Phase 14 — Demo Mode

Create configurable demo SLA values.

Production:

4/12/24/48 hours depending on priority.

Demo:

1–2 minutes.

This allows the complete escalation workflow to be demonstrated live.

### Phase 15 — Deployment

Web:
Deploy to Vercel.

Backend:
Deploy using the selected Node.js hosting strategy.

Database:
Supabase production project.

Mobile:
Generate Android APK using Expo EAS.

### Priority Rule

Never spend significant time polishing P2 features before P0 functionality is stable.

P0 must be fully functional before advanced AI, duplicate detection, heatmaps or predictive analytics.
