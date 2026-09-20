// ---------------------------------------------------------------------------
// Grievia domain constants — single source of truth for roles, lifecycle,
// categories, priorities and escalation levels. Referenced across engines,
// API routes and UI. Do NOT hard-code these values elsewhere.
// ---------------------------------------------------------------------------

// User roles (PRD §3). Note: "admin" folder == principal portal, which hosts
// both PRINCIPAL and SUPER_ADMIN with different permission tiers.
export const ROLES = {
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',
  TECHNICIAN: 'TECHNICIAN',
  HOD: 'HOD',
  PRINCIPAL: 'PRINCIPAL',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Which portal each role lands in.
export const ROLE_PORTAL: Record<Role, string> = {
  STUDENT: '/user',
  FACULTY: '/user',
  TECHNICIAN: '/worker',
  HOD: '/hod',
  PRINCIPAL: '/admin',
  SUPER_ADMIN: '/admin',
};

// Complaint lifecycle statuses (PRD §7).
export const STATUS = {
  SUBMITTED: 'SUBMITTED',
  CLASSIFIED: 'CLASSIFIED',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  USER_VERIFICATION: 'USER_VERIFICATION',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
  ESCALATED_TO_HOD: 'ESCALATED_TO_HOD',
  ESCALATED_TO_PRINCIPAL: 'ESCALATED_TO_PRINCIPAL',
  ESCALATED_TO_HIGHER_AUTHORITY: 'ESCALATED_TO_HIGHER_AUTHORITY',
} as const;

export type ComplaintStatus = (typeof STATUS)[keyof typeof STATUS];

// Statuses considered "open" for SLA/escalation purposes.
export const OPEN_STATUSES: ComplaintStatus[] = [
  STATUS.SUBMITTED,
  STATUS.CLASSIFIED,
  STATUS.ASSIGNED,
  STATUS.ACCEPTED,
  STATUS.IN_PROGRESS,
  STATUS.REOPENED,
  STATUS.ESCALATED_TO_HOD,
  STATUS.ESCALATED_TO_PRINCIPAL,
  STATUS.ESCALATED_TO_HIGHER_AUTHORITY,
];

// Complaint categories (PRD §5).
export const CATEGORIES = {
  NETWORK: 'NETWORK',
  ELECTRICAL: 'ELECTRICAL',
  PLUMBING: 'PLUMBING',
  CLEANING: 'CLEANING',
  CLASSROOM: 'CLASSROOM',
  LABORATORY: 'LABORATORY',
  HOSTEL: 'HOSTEL',
  FOOD: 'FOOD',
  TRANSPORT: 'TRANSPORT',
  SECURITY: 'SECURITY',
  ACADEMIC: 'ACADEMIC',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  OTHER: 'OTHER',
} as const;

export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

export const CATEGORY_LABELS: Record<Category, string> = {
  NETWORK: 'Network / Internet',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing / Water',
  CLEANING: 'Cleaning',
  CLASSROOM: 'Classroom',
  LABORATORY: 'Laboratory',
  HOSTEL: 'Hostel',
  FOOD: 'Food / Canteen',
  TRANSPORT: 'Transport',
  SECURITY: 'Security',
  ACADEMIC: 'Academic',
  ADMINISTRATIVE: 'Administrative',
  OTHER: 'Other',
};

// Priorities (PRD §10).
export const PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

// Classification source (system_design §5).
export const CLASSIFICATION_SOURCE = {
  AI: 'AI',
  RULE_ENGINE: 'RULE_ENGINE',
  MANUAL: 'MANUAL',
} as const;

export type ClassificationSource =
  (typeof CLASSIFICATION_SOURCE)[keyof typeof CLASSIFICATION_SOURCE];

// Escalation levels (system_design §8).
export const ESCALATION_LEVEL = {
  TECHNICIAN: 1,
  HOD: 2,
  PRINCIPAL: 3,
  HIGHER_AUTHORITY: 4,
} as const;

export type EscalationLevel =
  (typeof ESCALATION_LEVEL)[keyof typeof ESCALATION_LEVEL];

// Default SLA in minutes by priority (PRD §10). Stored in DB (sla_config);
// these are only the fallback defaults used when seeding / if DB unreachable.
export const DEFAULT_SLA_MINUTES: Record<Priority, number> = {
  CRITICAL: 4 * 60,
  HIGH: 12 * 60,
  MEDIUM: 24 * 60,
  LOW: 48 * 60,
};

// Demo SLA (implementation_plan Phase 14) — short windows to demo escalation
// live. Toggled via NEXT_PUBLIC_DEMO_MODE / DEMO_SLA_MINUTES env.
export const DEMO_SLA_MINUTES: Record<Priority, number> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

export const AUDIT_ACTIONS = {
  COMPLAINT_CREATED: 'COMPLAINT_CREATED',
  CLASSIFIED: 'CLASSIFIED',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  RESOLVED: 'RESOLVED',
  REOPENED: 'REOPENED',
  ESCALATED: 'ESCALATED',
  CLOSED: 'CLOSED',
  REASSIGNED: 'REASSIGNED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
