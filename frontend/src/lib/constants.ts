// Domain constants shared by the SPA. Mirrors backend/src/domain/constants.ts.

export const ROLES = {
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',
  TECHNICIAN: 'TECHNICIAN',
  HOD: 'HOD',
  PRINCIPAL: 'PRINCIPAL',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PORTAL: Record<Role, string> = {
  STUDENT: '/user',
  FACULTY: '/user',
  TECHNICIAN: '/worker',
  HOD: '/hod',
  PRINCIPAL: '/principal',
  SUPER_ADMIN: '/principal',
};

export const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  TECHNICIAN: 'Technician',
  HOD: 'Head of Department',
  PRINCIPAL: 'Principal',
  SUPER_ADMIN: 'Super Admin',
};

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

export const PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];
