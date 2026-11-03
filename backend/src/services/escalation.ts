import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AUDIT_ACTIONS,
  ESCALATION_LEVEL,
  OPEN_STATUSES,
  ROLES,
  STATUS,
  type ComplaintStatus,
} from '../domain/constants.js';
import type { Complaint } from '../domain/types.js';
import { computeSlaWindow } from './sla.js';
import { addAudit, addHistory, notify, notifyMany } from './events.js';

const NEXT: Record<number, { level: number; status: ComplaintStatus } | null> = {
  [ESCALATION_LEVEL.TECHNICIAN]: { level: ESCALATION_LEVEL.HOD, status: STATUS.ESCALATED_TO_HOD },
  [ESCALATION_LEVEL.HOD]: { level: ESCALATION_LEVEL.PRINCIPAL, status: STATUS.ESCALATED_TO_PRINCIPAL },
  [ESCALATION_LEVEL.PRINCIPAL]: { level: ESCALATION_LEVEL.HIGHER_AUTHORITY, status: STATUS.ESCALATED_TO_HIGHER_AUTHORITY },
  [ESCALATION_LEVEL.HIGHER_AUTHORITY]: null,
};

const STATUS_BY_LEVEL: Record<number, ComplaintStatus> = {
  [ESCALATION_LEVEL.HOD]: STATUS.ESCALATED_TO_HOD,
  [ESCALATION_LEVEL.PRINCIPAL]: STATUS.ESCALATED_TO_PRINCIPAL,
  [ESCALATION_LEVEL.HIGHER_AUTHORITY]: STATUS.ESCALATED_TO_HIGHER_AUTHORITY,
};

export interface EscalationOutcome {
  escalated: boolean;
  fromLevel: number;
  toLevel?: number;
  toStatus?: ComplaintStatus;
  reason?: string;
}

export async function escalateComplaint(
  admin: SupabaseClient,
  complaint: Complaint,
  actorId: string | null,
  reason = 'SLA expired',
  targetLevel?: number,
): Promise<EscalationOutcome> {
  const fromLevel = complaint.escalation_level;

  if (!OPEN_STATUSES.includes(complaint.status)) {
    return { escalated: false, fromLevel, reason: 'Complaint not open' };
  }

  // Default to the next tier. Manual escalation can jump straight to a higher
  // tier (for example, an HOD escalating directly to the Principal).
  const requestedLevel =
    targetLevel === undefined
      ? NEXT[fromLevel]?.level
      : Math.min(targetLevel, ESCALATION_LEVEL.HIGHER_AUTHORITY);

  if (requestedLevel === undefined || requestedLevel <= fromLevel) {
    return { escalated: false, fromLevel, reason: 'Already at highest level' };
  }

  const next = { level: requestedLevel, status: STATUS_BY_LEVEL[requestedLevel] };
  if (!next.status) {
    return { escalated: false, fromLevel, reason: 'Invalid escalation level' };
  }

  // Idempotency: re-read the current level and confirm it still matches.
  const { data: fresh } = await admin
    .from('complaints')
    .select('escalation_level, status')
    .eq('id', complaint.id)
    .single();

  if (!fresh || fresh.escalation_level !== fromLevel) {
    return { escalated: false, fromLevel, reason: 'Level changed concurrently' };
  }

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
    .eq('escalation_level', fromLevel);

  if (updateErr) return { escalated: false, fromLevel, reason: updateErr.message };

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

async function notifyEscalationTargets(
  admin: SupabaseClient,
  complaint: Complaint,
  toLevel: number,
  toStatus: ComplaintStatus,
): Promise<void> {
  const title = `Complaint ${complaint.code} escalated`;
  const body = `${complaint.title} — now ${toStatus.replaceAll('_', ' ')}`;

  if (toLevel === ESCALATION_LEVEL.HOD) {
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

  await notify(admin, {
    userId: complaint.created_by,
    complaintId: complaint.id,
    title: `Your complaint ${complaint.code} was escalated`,
    body,
  });
}
