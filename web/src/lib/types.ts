import type {
  Category,
  ClassificationSource,
  ComplaintStatus,
  Priority,
  Role,
} from './constants';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department_id: string | null;
  register_number: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  hod_id: string | null;
}

export interface SlaConfig {
  id: string;
  priority: Priority;
  minutes: number;
}

export interface CategoryStaffMap {
  id: string;
  category: Category;
  department_id: string | null;
  staff_id: string;
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
  classification_source: ClassificationSource | null;
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

export interface ClassificationResult {
  category: Category;
  priority: Priority;
  confidence: number;
  summary: string | null;
  source: ClassificationSource;
  model?: string;
}
