// ---------------------------------------------------------------------------
// Escalation engine (system_design §8-9). Idempotent: a complaint is never
// escalated twice to the same level. Advances one level per invocation and
// extends the SLA window for the new level. Notifies the receiving authority.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AUDIT_ACTIONS,
  ESCALATION_LEVEL,
  OPEN_STATUSES,
  ROLES,
  STATUS,
  type ComplaintStatus,
} from '../constants';
import type { Complaint } from '../types';
import { computeSlaWindow } from './sla';
import { addAudit, addHistory, notify, notifyMany } from './events';

// Map current escalation level -> the status + next level after escalation.
const NEXT: Record<
  number,
  { level: number; status: ComplaintStatus } | null
> = {
  [ESCALATION_LEVEL.TECHNICIAN]: {
    level: ESCALATION_LEVEL.HOD,
    status: STATUS.ESCALATED_TO_HOD,
  },
  [ESCALATION_LEVEL.HOD]: {
    level: ESCALATION_LEVEL.PRINCIPAL,
    status: STATUS.ESCALATED_TO_PRINCIPAL,
  },
  [ESCALATION_LEVEL.PRINCIPAL]: {
    level: ESCALATION_LEVEL.HIGHER_AUTHORITY,
    status: STATUS.ESCALATED_TO_HIGHER_AUTHORITY,
  },
  [ESCALATION_LEVEL.HIGHER_AUTHORITY]: null, // terminal
};

export interface EscalationOutcome {
  escalated: boolean;
  fromLevel: number;
  toLevel?: number;
  toStatus?: ComplaintStatus;
  reason?: string;
}

// Escalate a single complaint by exactly one level. `admin` must be the
// service-role client. `actorId` is the actor (null for the system/cron).
export async function escalateComplaint(
  admin: SupabaseClient,
  complaint: Complaint,
  actorId: string | null,
  reason = 'SLA expired',
): Promise<EscalationOutcome> {
  const fromLevel = complaint.escalation_level;

  // Guard: only escalate open complaints.
  if (!OPEN_STATUSES.includes(complaint.status)) {
    return { escalated: false, fromLevel, reason: 'Complaint not open' };
  }

  const next = NEXT[fromLevel];
  if (!next) {
    return { escalated: false, fromLevel, reason: 'Already at highest level' };
  }

  // Idempotency: re-read current level under the same client and confirm it
  // still matches what we intend to advance from. Prevents double-escalation
  // from concurrent cron runs.
  const { data: fresh } = await admin
    .from('complaints')
    .select('escalation_level, status')
    .eq('id', complaint.id)
    .single();

  if (!fresh || fresh.escalation_level !== fromLevel) {
    return { escalated: false, fromLevel, reason: 'Level changed concurrently' };
  }

  // Extend the SLA window for the new level using the same priority.
  // When escalating to the HOD, apply the HOD-stage window; beyond that
  // (principal / higher authority) reuse the HOD window as a holding timer.
  const priority = complaint.priority ?? 'MEDIUM';
  const sla = await computeSlaWindow(admin, priority, 'hod');

  const { error: updateErr } = await admin
    .from('complaints')
    .update({
      status: next.status,
      escalation_level: next.level,
      sla_start_at: sla.start,
      sla_deadline_at: sla.deadline,
    })
    .eq('id', complaint.id)
    .eq('escalation_level', fromLevel); // conditional = idempotent

  if (updateErr) {
    return { escalated: false, fromLevel, reason: updateErr.message };
  }

  await addHistory(admin, {
    complaintId: complaint.id,
    actorId,
    action: AUDIT_ACTIONS.ESCALATED,
    fromStatus: complaint.status,
    toStatus: next.status,
    note: `${reason} — escalated to level ${next.level}`,
  });
  await addAudit(admin, {
    complaintId: complaint.id,
    actorId,
    action: AUDIT_ACTIONS.ESCALATED,
    metadata: { fromLevel, toLevel: next.level, reason },
  });

  await notifyEscalationTargets(admin, complaint, next.level, next.status);

  return {
    escalated: true,
    fromLevel,
    toLevel: next.level,
    toStatus: next.status,
    reason,
  };
}

// Notify the authority receiving the complaint at the new level.
async function notifyEscalationTargets(
  admin: SupabaseClient,
  complaint: Complaint,
  toLevel: number,
  toStatus: ComplaintStatus,
): Promise<void> {
  const title = `Complaint ${complaint.code} escalated`;
  const body = `${complaint.title} — now ${toStatus.replaceAll('_', ' ')}`;

  if (toLevel === ESCALATION_LEVEL.HOD) {
    // Notify the HOD of the complaint's department.
    if (complaint.department_id) {
      const { data: hods } = await admin
        .from('app_users')
        .select('id')
        .eq('role', ROLES.HOD)
        .eq('department_id', complaint.department_id);
      await notifyMany(admin, (hods ?? []).map((h: { id: string }) => h.id), {
        complaintId: complaint.id,
        title,
        body,
      });
    }
  } else if (
    toLevel === ESCALATION_LEVEL.PRINCIPAL ||
    toLevel === ESCALATION_LEVEL.HIGHER_AUTHORITY
  ) {
    // Principal is the main admin and top of the chain here.
    const { data: principals } = await admin
      .from('app_users')
      .select('id')
      .in('role', [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    await notifyMany(admin, (principals ?? []).map((p: { id: string }) => p.id), {
      complaintId: complaint.id,
      title,
      body,
    });
  }

  // Always keep the complainant informed.
  await notify(admin, {
    userId: complaint.created_by,
    complaintId: complaint.id,
    title: `Your complaint ${complaint.code} was escalated`,
    body,
  });
}
