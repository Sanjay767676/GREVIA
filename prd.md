# GREVIA

## Product Requirements Document

### 1. Product Overview

SNS ResolveX is an AI-assisted campus grievance management and automatic escalation platform designed for SNS College of Technology.

The system allows students and faculty members to submit complaints related to infrastructure, academics, hostel, food, network, electrical systems, plumbing, laboratories, classrooms and other campus services.

The system automatically classifies complaints, identifies the responsible category and routes the complaint to the appropriate staff member.

If the assigned staff member does not resolve the complaint within the configured SLA, the system automatically escalates the complaint through the institutional hierarchy.

### 2. Primary Goal

Build a closed-loop grievance management platform that provides:

* Easy complaint submission
* Intelligent complaint classification
* Automatic staff assignment
* SLA monitoring
* Automatic escalation
* Resolution verification
* Complaint tracking
* Administrative analytics

### 3. User Roles

#### Student

* Login
* Submit complaint
* Upload optional image
* Track complaint
* View complaint timeline
* Confirm resolution
* Reopen unresolved complaint

#### Faculty

* Same complaint functionality as students
* Submit complaints related to academic or infrastructure issues

#### Technician / Staff

* View assigned complaints
* Accept complaint
* Change status
* Add resolution notes
* Upload resolution proof
* Mark complaint as resolved

#### HOD

* View department complaints
* View escalated complaints
* Monitor SLA violations
* Assign/reassign staff
* Review unresolved complaints
* Escalate complaints to Principal

#### Principal

* View college-wide complaints
* Monitor escalations
* View department analytics
* Review unresolved issues
* Escalate to higher authority

#### Super Admin

* Manage users
* Manage departments
* Manage categories
* Configure SLA rules
* Configure hierarchy
* Manage staff assignments
* View complete audit logs

### 4. Complaint Submission

Required fields:

* Register Number / User ID
* Department
* Complaint description
* Location

Optional:

* Image
* Additional details

The complaint description must contain meaningful text.

### 5. Complaint Categories

Initial categories:

* Network / Internet
* Electrical
* Plumbing / Water
* Cleaning
* Classroom
* Laboratory
* Hostel
* Food / Canteen
* Transport
* Security
* Academic
* Administrative
* Other

### 6. AI Responsibilities

AI must NOT control the complete workflow.

AI is responsible for:

* Complaint category suggestion
* Priority suggestion
* Ambiguous complaint detection
* Optional short summary

The backend rule engine is responsible for:

* Staff assignment
* Department mapping
* SLA calculation
* Escalation
* Status transitions
* Permissions

### 7. Complaint Lifecycle

SUBMITTED
→ CLASSIFIED
→ ASSIGNED
→ ACCEPTED
→ IN_PROGRESS
→ RESOLVED
→ USER_VERIFICATION
→ CLOSED

If SLA expires:

ASSIGNED
→ ESCALATED_TO_HOD

HOD SLA expiry:

ESCALATED_TO_HOD
→ ESCALATED_TO_PRINCIPAL

Principal SLA expiry:

ESCALATED_TO_PRINCIPAL
→ ESCALATED_TO_HIGHER_AUTHORITY

### 8. Resolution Verification

A technician cannot permanently close a complaint.

The technician marks the complaint as resolved and optionally uploads resolution proof.

The original complainant receives a verification request.

YES:
→ CLOSED

NO:
→ REOPENED

Reopened complaints must retain their complete history.

### 9. Duplicate Complaints

The system should identify potentially similar complaints.

Example:

"WiFi not working in CSE Lab 3"

"Internet unavailable in CSE Lab 3"

These should be detected as potentially related.

Duplicate detection is an enhancement and must not block complaint submission.

### 10. SLA

SLA must be configurable.

Example defaults:

Critical: 4 hours
High: 12 hours
Medium: 24 hours
Low: 48 hours

The system must store:

* SLA start time
* SLA deadline
* Remaining time
* Escalation time
* Current escalation level

### 11. Dashboards

Student/Faculty:

* Total complaints
* Pending
* In progress
* Resolved
* Closed
* Escalated

Technician:

* Assigned complaints
* Overdue complaints
* Due soon
* Resolved complaints

HOD:

* Department complaints
* SLA violations
* Escalated complaints
* Resolution time
* Category distribution

Principal:

* College-wide statistics
* Department comparison
* Escalation trends
* Recurring issues
* Resolution performance

### 12. Notifications

The system should support:

* In-app notifications
* Email notifications

Notifications should be generated for:

* New assignment
* Status change
* SLA approaching
* SLA violation
* Escalation
* Resolution request
* Reopened complaint

### 13. Audit Trail

Every important action must be logged.

Examples:

* Complaint created
* AI classification completed
* Complaint assigned
* Complaint accepted
* Status changed
* Comment added
* Complaint resolved
* Complaint reopened
* Escalated
* Complaint closed

### 14. Non-Functional Requirements

The system should be:

* Responsive
* Secure
* Role-based
* Mobile-friendly
* Scalable
* Maintainable
* API-driven
* Fault tolerant

The system must continue to work even when the AI service is temporarily unavailable.

### 15. MVP Priority

P0:

* Authentication
* Complaint creation
* Complaint database
* Category assignment
* Staff assignment
* SLA
* Escalation
* Technician dashboard
* HOD dashboard
* Principal dashboard
* Resolution verification

P1:

* AI classification
* Image upload
* Notifications
* Analytics

P2:

* Duplicate detection
* Heatmap
* Predictive maintenance
* Advanced AI analysis

### 16. Success Criteria

The MVP is considered complete when:

1. A student can submit a complaint.
2. The complaint is stored securely.
3. The complaint is classified.
4. The correct staff member receives it.
5. SLA countdown starts automatically.
6. Expired complaints escalate automatically.
7. HOD can handle escalated complaints.
8. Principal can monitor escalations.
9. Technician can resolve complaints.
10. Student can verify resolution.
11. Complete complaint history is maintained.
12. System works without AI dependency for core operations.
