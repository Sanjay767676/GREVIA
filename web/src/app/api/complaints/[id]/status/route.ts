import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { addAudit, addHistory, notify } from '@/lib/engines/events';
import {
  AUDIT_ACTIONS,
  ROLES,
  STATUS,
  type ComplaintStatus,
} from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// Allowed technician-driven transitions.
const TECH_TRANSITIONS: Record<string, ComplaintStatus[]> = {
  ACCEPT: [STATUS.ASSIGNED, STATUS.REOPENED, STATUS.ESCALATED_TO_HOD],
  START: [STATUS.ACCEPTED],
  RESOLVE: [STATUS.IN_PROGRESS, STATUS.ACCEPTED],
};

// POST /api/complaints/:id/status — technician transitions: accept, start,
// resolve. Resolve moves to RESOLVED then USER_VERIFICATION (awaiting user).
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const profile = await getApiProfile();
    const body = await req.json();
    const action = String(body.action ?? '').toUpperCase();

    const admin = createAdminClient();
    const { data: complaint } = await admin
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    // Authorization: assigned technician, or HOD/principal/admin oversight.
    const isAssignedTech =
      profile.role === ROLES.TECHNICIAN && complaint.assigned_to === profile.id;
    const isOversight = [ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN].includes(
      profile.role as never,
    );
    if (!isAssignedTech && !isOversight) {
      throw new ApiError(403, 'Not authorized to change this complaint');
    }

    const allowedFrom = TECH_TRANSITIONS[action];
    if (!allowedFrom) throw new ApiError(422, `Unknown action: ${action}`);
    if (!allowedFrom.includes(complaint.status)) {
      throw new ApiError(
        409,
        `Cannot ${action} from status ${complaint.status}`,
      );
    }

    let toStatus: ComplaintStatus;
    const patch: Record<string, unknown> = {};

    if (action === 'ACCEPT') {
      toStatus = STATUS.ACCEPTED;
    } else if (action === 'START') {
      toStatus = STATUS.IN_PROGRESS;
    } else {
      // RESOLVE — record notes/proof and request user verification.
      toStatus = STATUS.USER_VERIFICATION;
      patch.resolution_notes = String(body.resolution_notes ?? '').trim() || null;
      patch.resolution_proof_path =
        typeof body.resolution_proof_path === 'string'
          ? body.resolution_proof_path
          : null;
      patch.resolved_at = new Date().toISOString();
    }

    patch.status = toStatus;

    const { data: updated, error } = await admin
      .from('complaints')
      .update(patch)
      .eq('id', complaint.id)
      .select('*')
      .single();
    if (error) throw new ApiError(500, error.message);

    const auditAction =
      action === 'ACCEPT'
        ? AUDIT_ACTIONS.ACCEPTED
        : action === 'RESOLVE'
          ? AUDIT_ACTIONS.RESOLVED
          : AUDIT_ACTIONS.STATUS_CHANGED;

    await addHistory(admin, {
      complaintId: complaint.id,
      actorId: profile.id,
      action: auditAction,
      fromStatus: complaint.status,
      toStatus,
      note:
        action === 'RESOLVE'
          ? (patch.resolution_notes as string) ?? 'Marked resolved'
          : null,
    });
    await addAudit(admin, {
      complaintId: complaint.id,
      actorId: profile.id,
      action: auditAction,
      metadata: { action },
    });

    // On resolve, ask the complainant to verify (PRD §8).
    if (action === 'RESOLVE') {
      await notify(admin, {
        userId: complaint.created_by,
        complaintId: complaint.id,
        title: `Please verify resolution: ${complaint.code}`,
        body: 'The technician marked your complaint resolved. Confirm or reopen it.',
      });
    }

    return NextResponse.json({ complaint: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
