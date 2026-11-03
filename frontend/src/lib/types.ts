import type { Category, ComplaintStatus, Priority, Role } from './constants';

export interface Department {
  id: string;
  code: string;
  name: string;
  hod_id: string | null;
}

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  created_at?: string;
}

export interface Complaint {
  id: string;
  code: string;
  created_by: string;
  department_id: string | null;
  category: Category | null;
  priority: Priority | null;
  status: ComplaintStatus;
  title: string;
  description: string;
  location: string;
  image_path: string | null;
  classification_source: string | null;
  ai_confidence: number | null;
  ai_summary: string | null;
  assigned_to: string | null;
  sla_start_at: string | null;
  sla_deadline_at: string | null;
  escalation_level: number;
  resolution_notes: string | null;
  resolution_proof_path: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintHistory {
  id: string;
  complaint_id: string;
  actor_id: string | null;
  action: string;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus | null;
  note: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  complaint_id: string | null;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  complaint_id: string | null;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SlaConfigRow {
  id?: string;
  priority: Priority;
  worker_minutes: number;
  hod_minutes: number;
}

export interface CategoryStaffMap {
  id: string;
  category: Category;
  department_id: string | null;
  staff_id: string;
}

export interface SessionUser {
  sub: string;
  username: string;
  role: Role;
  full_name: string;
  department_id: string | null;
}

export interface ComplaintDetailResponse {
  complaint: Complaint;
  history: ComplaintHistory[];
  imageUrl: string | null;
  proofUrl: string | null;
}

export interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
  escalated: number;
  overdue: number;
}
