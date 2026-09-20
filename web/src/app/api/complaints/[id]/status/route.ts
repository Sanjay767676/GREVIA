import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { addAudit, addHistory, notify } from '@/lib/engines/events';
import { AUDIT_ACTIONS, ROLES, STATUS, type ComplaintStatus } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

const TECH_TRANSITIONS: Record<string, ComplaintStatus[]> = {
  ACCEPT: [STATUS.ASSIGNED, STATUS.REOPENED, STATUS.ESCALATED_TO_HOD],
  START: [STATUS.ACCEPTED],
  RESOLVE: [STATUS.IN_PROGRESS, STATUS.ACCEPTED],
};

// POST /api/complaints/:id/status — worker transitions: ACCEPT | START | RESOLVE.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const body = await req.json();
    const action = String(body.action ?? '').toUpperCase();

    const supabase = db();
    const { data: complaint } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    const isAssignedTech = user.role === ROLES.TECHNICIAN && complaint.assigned_to === user.sub;
    const isOversight = [ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN].includes(user.role as never);
    if (!isAssignedTech && !isOversight) throw new ApiError(403, 'Not authorized');

    const allowedFrom = TECH_TRANSITIONS[action];
    if (!allowedFrom) throw new ApiError(422, `Unknown action: ${action}`);
    if (!allowedFrom.includes(complaint.status))
      throw new ApiError(409, `Cannot ${action} from ${complaint.status}`);

    let toStatus: ComplaintStatus;
    const patch: Record<string, unknown> = {};
    if (action === 'ACCEPT') {
      toStatus = STATUS.ACCEPTED;
    } else if (action === 'START') {
      toStatus = STATUS.IN_PROGRESS;
    } else {
      // RESOLVE — record completion proof + timestamp; ask user to verify.
      toStatus = STATUS.USER_VERIFICATION;
      patch.resolution_notes = String(body.resolution_notes ?? '').trim() || null;
      patch.resolution_proof_path =
        typeof body.resolution_proof_path === 'string' ? body.resolution_proof_path : null;
      patch.resolved_at = new Date().toISOString();
    }
    patch.status = toStatus;

    const { data: updated, error } = await supabase
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

    await addHistory(supabase, {
      complaintId: complaint.id,
      actorId: user.sub,
      action: auditAction,
      fromStatus: complaint.status,
      toStatus,
      note: action === 'RESOLVE' ? ((patch.resolution_notes as string) ?? 'Marked resolved') : null,
    });
    await addAudit(supabase, {
      complaintId: complaint.id,
      actorId: user.sub,
      action: auditAction,
      metadata: { action },
    });

    if (action === 'RESOLVE') {
      await notify(supabase, {
        userId: complaint.created_by,
        complaintId: complaint.id,
        title: `Please verify resolution: ${complaint.code}`,
        body: 'The worker marked your complaint resolved. Confirm or reopen it.',
      });
    }
    return NextResponse.json({ complaint: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
