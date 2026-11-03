import { Router } from 'express';
import { db } from '../lib/db.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth, requireRole, user } from '../lib/auth.js';
import { classifyComplaint } from '../services/ai/classify.js';
import { resolveAssignee } from '../services/assignment.js';
import { computeSlaWindow } from '../services/sla.js';
import { addAudit, addHistory, notify } from '../services/events.js';
import { loadComplaintDetail } from '../services/complaint-detail.js';
import { escalateComplaint } from '../services/escalation.js';
import {
  AUDIT_ACTIONS,
  ESCALATION_LEVEL,
  ROLES,
  STATUS,
  type ComplaintStatus,
} from '../domain/constants.js';
import type { Complaint, SessionPayload } from '../domain/types.js';

const router = Router();

router.use(requireAuth);

// GET /api/complaints — list complaints visible to the caller (role-scoped).
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = user(req);
    let query = db().from('complaints').select('*').order('created_at', { ascending: false });

    if (me.role === ROLES.STUDENT || me.role === ROLES.FACULTY) {
      query = query.eq('created_by', me.sub);
    } else if (me.role === ROLES.TECHNICIAN) {
      query = query.eq('assigned_to', me.sub);
    } else if (me.role === ROLES.HOD) {
      query = query.eq('department_id', me.department_id ?? '');
    }
    // PRINCIPAL / SUPER_ADMIN: all.

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);
    res.json({ complaints: data ?? [] });
  }),
);

// POST /api/complaints — create + run the deterministic processing flow.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const me = user(req);
    const body = req.body ?? {};

    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();
    const location = String(body.location ?? '').trim();
    const imagePath =
      typeof body.image_path === 'string' && body.image_path ? body.image_path : null;
    const departmentId =
      (typeof body.department_id === 'string' && body.department_id) ||
      me.department_id ||
      null;

    if (!title) throw new ApiError(422, 'Title is required');
    if (description.length < 10) {
      throw new ApiError(422, 'Description must be at least 10 characters');
    }
    if (!location) throw new ApiError(422, 'Location is required');
    if (imagePath && !imagePath.startsWith(`${me.sub}/`)) {
      throw new ApiError(422, 'Invalid image path');
    }

    const supabase = db();

    const { data: created, error: insertErr } = await supabase
      .from('complaints')
      .insert({
        created_by: me.sub,
        department_id: departmentId,
        title,
        description,
        location,
        image_path: imagePath,
        status: STATUS.SUBMITTED,
      })
      .select('*')
      .single<Complaint>();

    if (insertErr || !created) {
      throw new ApiError(500, insertErr?.message ?? 'Failed to create complaint');
    }

    await addHistory(supabase, {
      complaintId: created.id,
      actorId: me.sub,
      action: AUDIT_ACTIONS.COMPLAINT_CREATED,
      toStatus: STATUS.SUBMITTED,
      note: 'Complaint submitted',
    });
    await addAudit(supabase, {
      complaintId: created.id,
      actorId: me.sub,
      action: AUDIT_ACTIONS.COMPLAINT_CREATED,
      metadata: { code: created.code },
    });

    const classification = await classifyComplaint(
      `${title}. ${description}. Location: ${location}`,
    );
    const assignee = await resolveAssignee(supabase, classification.category, departmentId);
    const sla = await computeSlaWindow(supabase, classification.priority);
    const nextStatus = assignee ? STATUS.ASSIGNED : STATUS.CLASSIFIED;

    const { data: updated } = await supabase
      .from('complaints')
      .update({
        category: classification.category,
        priority: classification.priority,
        classification_source: classification.source,
        ai_confidence: classification.confidence,
        ai_summary: classification.summary,
        assigned_to: assignee,
        sla_start_at: assignee ? sla.start : null,
        sla_deadline_at: assignee ? sla.deadline : null,
        status: nextStatus,
      })
      .eq('id', created.id)
      .select('*')
      .single<Complaint>();

    await addHistory(supabase, {
      complaintId: created.id,
      actorId: null,
      action: AUDIT_ACTIONS.CLASSIFIED,
      fromStatus: STATUS.SUBMITTED,
      toStatus: STATUS.CLASSIFIED,
      note: `Category ${classification.category} / ${classification.priority} (${classification.source}${classification.model ? ' via ' + classification.model : ''})`,
    });
    await addAudit(supabase, {
      complaintId: created.id,
      actorId: null,
      action: AUDIT_ACTIONS.CLASSIFIED,
      metadata: {
        category: classification.category,
        priority: classification.priority,
        source: classification.source,
        model: classification.model ?? null,
        confidence: classification.confidence,
      },
    });

    if (assignee) {
      await addHistory(supabase, {
        complaintId: created.id,
        actorId: null,
        action: AUDIT_ACTIONS.ASSIGNED,
        fromStatus: STATUS.CLASSIFIED,
        toStatus: STATUS.ASSIGNED,
        note: 'Auto-assigned to responsible worker',
      });
      await addAudit(supabase, {
        complaintId: created.id,
        actorId: null,
        action: AUDIT_ACTIONS.ASSIGNED,
        metadata: { assignee },
      });
      await notify(supabase, {
        userId: assignee,
        complaintId: created.id,
        title: `New complaint assigned: ${created.code}`,
        body: `${title} — ${location}`,
      });
    }

    await notify(supabase, {
      userId: me.sub,
      complaintId: created.id,
      title: `Complaint ${created.code} submitted`,
      body: assignee
        ? 'Your complaint was classified and assigned to a worker.'
        : 'Your complaint was classified and is awaiting assignment.',
    });

    res.status(201).json({ complaint: updated ?? created });
  }),
);

// GET /api/complaints/:id — detail + history + signed image/proof URLs.
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const detail = await loadComplaintDetail(db(), req.params.id, user(req));
    if (!detail) throw new ApiError(404, 'Complaint not found');
    res.json(detail);
  }),
);

const TECH_TRANSITIONS: Record<string, ComplaintStatus[]> = {
  ACCEPT: [STATUS.ASSIGNED, STATUS.REOPENED, STATUS.ESCALATED_TO_HOD],
  START: [STATUS.ACCEPTED],
  RESOLVE: [STATUS.IN_PROGRESS, STATUS.ACCEPTED],
};

// POST /api/complaints/:id/status — worker transitions: ACCEPT | START | RESOLVE.
router.post(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const me = user(req);
    const action = String(req.body?.action ?? '').toUpperCase();
    const supabase = db();

    const { data: complaint } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', req.params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    const isAssignedTech = me.role === ROLES.TECHNICIAN && complaint.assigned_to === me.sub;
    const isOversight =
      me.role === ROLES.PRINCIPAL ||
      me.role === ROLES.SUPER_ADMIN ||
      (me.role === ROLES.HOD && complaint.department_id === me.department_id);
    if (!isAssignedTech && !isOversight) throw new ApiError(403, 'Not authorized');

    const allowedFrom = TECH_TRANSITIONS[action];
    if (!allowedFrom) throw new ApiError(422, `Unknown action: ${action}`);
    if (!allowedFrom.includes(complaint.status)) {
      throw new ApiError(409, `Cannot ${action} from ${complaint.status}`);
    }

    let toStatus: ComplaintStatus;
    const patch: Record<string, unknown> = {};

    if (action === 'ACCEPT') {
      toStatus = STATUS.ACCEPTED;
    } else if (action === 'START') {
      toStatus = STATUS.IN_PROGRESS;
    } else {
      toStatus = STATUS.RESOLVED;
      patch.resolution_notes = String(req.body?.resolution_notes ?? '').trim() || null;
      const proofPath =
        typeof req.body?.resolution_proof_path === 'string'
          ? req.body.resolution_proof_path
          : null;
      if (proofPath && !proofPath.startsWith(`${me.sub}/`)) {
        throw new ApiError(422, 'Invalid proof path');
      }
      patch.resolution_proof_path = proofPath;
      patch.resolved_at = new Date().toISOString();
    }
    patch.status = toStatus;

    const { data: updated, error } = await supabase
      .from('complaints')
      .update(patch)
      .eq('id', complaint.id)
      .select('*')
      .single<Complaint>();
    if (error) throw new ApiError(500, error.message);

    const auditAction =
      action === 'ACCEPT'
        ? AUDIT_ACTIONS.ACCEPTED
        : action === 'RESOLVE'
          ? AUDIT_ACTIONS.RESOLVED
          : AUDIT_ACTIONS.STATUS_CHANGED;

    await addHistory(supabase, {
      complaintId: complaint.id,
      actorId: me.sub,
      action: auditAction,
      fromStatus: complaint.status,
      toStatus,
      note: action === 'RESOLVE'
        ? ((patch.resolution_notes as string) ?? 'Marked resolved')
        : null,
    });
    await addAudit(supabase, {
      complaintId: complaint.id,
      actorId: me.sub,
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

    res.json({ complaint: updated });
  }),
);

// POST /api/complaints/:id/verify — complainant confirms (YES) or reopens (NO).
router.post(
  '/:id/verify',
  asyncHandler(async (req, res) => {
    const me = user(req);
    const decision = String(req.body?.decision ?? '').toUpperCase();
    const supabase = db();

    const { data: complaint } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', req.params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    if (complaint.created_by !== me.sub) {
      throw new ApiError(403, 'Only the complainant can verify');
    }
    if (complaint.status !== STATUS.RESOLVED) {
      throw new ApiError(409, 'Complaint is not awaiting verification');
    }

    if (decision === 'YES') {
      const { data: updated, error } = await supabase
        .from('complaints')
        .update({ status: STATUS.CLOSED, closed_at: new Date().toISOString() })
        .eq('id', complaint.id)
        .select('*')
        .single<Complaint>();
      if (error) throw new ApiError(500, error.message);

      await addHistory(supabase, {
        complaintId: complaint.id,
        actorId: me.sub,
        action: AUDIT_ACTIONS.CLOSED,
        fromStatus: STATUS.RESOLVED,
        toStatus: STATUS.CLOSED,
        note: 'Complainant confirmed resolution',
      });
      await addAudit(supabase, {
        complaintId: complaint.id,
        actorId: me.sub,
        action: AUDIT_ACTIONS.CLOSED,
      });

      if (complaint.assigned_to) {
        await notify(supabase, {
          userId: complaint.assigned_to,
          complaintId: complaint.id,
          title: `Complaint ${complaint.code} closed`,
          body: 'The complainant confirmed the resolution.',
        });
      }
      return res.json({ complaint: updated });
    }

    if (decision === 'NO') {
      // Reopen: return to the assigned worker and restart the SLA window,
      // otherwise the next sweep would instantly re-escalate it.
      const sla = await computeSlaWindow(supabase, complaint.priority ?? 'MEDIUM', 'worker');
      const { data: updated, error } = await supabase
        .from('complaints')
        .update({
          status: STATUS.REOPENED,
          resolved_at: null,
          sla_start_at: sla.start,
          sla_deadline_at: sla.deadline,
        })
        .eq('id', complaint.id)
        .select('*')
        .single<Complaint>();
      if (error) throw new ApiError(500, error.message);

      await addHistory(supabase, {
        complaintId: complaint.id,
        actorId: me.sub,
        action: AUDIT_ACTIONS.REOPENED,
        fromStatus: STATUS.RESOLVED,
        toStatus: STATUS.REOPENED,
        note: String(req.body?.note ?? '').trim() || 'Complainant reopened complaint',
      });
      await addAudit(supabase, {
        complaintId: complaint.id,
        actorId: me.sub,
        action: AUDIT_ACTIONS.REOPENED,
      });

      if (complaint.assigned_to) {
        await notify(supabase, {
          userId: complaint.assigned_to,
          complaintId: complaint.id,
          title: `Complaint ${complaint.code} reopened`,
          body: 'The complainant was not satisfied. Please review again.',
        });
      }
      return res.json({ complaint: updated });
    }

    throw new ApiError(422, "decision must be 'YES' or 'NO'");
  }),
);

// POST /api/complaints/:id/reassign — HOD/principal reassigns a worker.
router.post(
  '/:id/reassign',
  requireRole(ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const me = user(req);
    const staffId = String(req.body?.staff_id ?? '');
    if (!staffId) throw new ApiError(422, 'staff_id is required');

    const supabase = db();
    const { data: staffUser } = await supabase
      .from('app_users')
      .select('id, role')
      .eq('id', staffId)
      .maybeSingle();
    if (!staffUser || staffUser.role !== ROLES.TECHNICIAN) {
      throw new ApiError(422, 'staff_id must be a technician');
    }

    const { data: complaint } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', req.params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    if (me.role === ROLES.HOD && complaint.department_id !== me.department_id) {
      throw new ApiError(403, 'HOD can only reassign own department complaints');
    }

    const sla = await computeSlaWindow(supabase, complaint.priority ?? 'MEDIUM', 'worker');
    const { data: updated, error } = await supabase
      .from('complaints')
      .update({ assigned_to: staffId, sla_start_at: sla.start, sla_deadline_at: sla.deadline })
      .eq('id', complaint.id)
      .select('*')
      .single<Complaint>();
    if (error) throw new ApiError(500, error.message);

    await addHistory(supabase, {
      complaintId: complaint.id,
      actorId: me.sub,
      action: AUDIT_ACTIONS.REASSIGNED,
      note: `Reassigned to worker ${staffId}`,
    });
    await addAudit(supabase, {
      complaintId: complaint.id,
      actorId: me.sub,
      action: AUDIT_ACTIONS.REASSIGNED,
      metadata: { from: complaint.assigned_to, to: staffId },
    });
    await notify(supabase, {
      userId: staffId,
      complaintId: complaint.id,
      title: `Complaint assigned to you: ${complaint.code}`,
      body: complaint.title,
    });

    res.json({ complaint: updated });
  }),
);

// POST /api/complaints/:id/escalate — manual escalation by HOD/principal.
router.post(
  '/:id/escalate',
  requireRole(ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const me = user(req);
    const reason = String(req.body?.reason ?? 'Manual escalation').trim();

    const supabase = db();
    const { data: complaint } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', req.params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    if (me.role === ROLES.HOD && complaint.department_id !== me.department_id) {
      throw new ApiError(403, 'HOD can only escalate own department complaints');
    }

    const outcome = await escalateComplaint(
      supabase,
      complaint,
      me.sub,
      reason,
      // An HOD escalating means "pass it above me": go straight to the
      // Principal instead of stopping at the HOD's own tier.
      me.role === ROLES.HOD
        ? Math.max(complaint.escalation_level + 1, ESCALATION_LEVEL.PRINCIPAL)
        : undefined,
    );
    if (!outcome.escalated) throw new ApiError(409, outcome.reason ?? 'Could not escalate');

    res.json({ outcome });
  }),
);

export default router;
