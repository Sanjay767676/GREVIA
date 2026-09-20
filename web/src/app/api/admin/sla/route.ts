import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser, requireApiRole } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { addAudit } from '@/lib/engines/events';
import { PRIORITY, ROLES } from '@/lib/constants';

// GET /api/admin/sla — current SLA config (worker + HOD windows per priority).
export async function GET() {
  try {
    const user = await requireApiUser();
    requireApiRole(user, [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const { data, error } = await db().from('sla_config').select('*').order('priority');
    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ sla: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

// PATCH /api/admin/sla — Principal sets escalation timers.
// body: { updates: { priority, worker_minutes, hod_minutes }[] }
export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireApiUser();
    requireApiRole(actor, [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const body = await req.json();
    const updates = Array.isArray(body.updates) ? body.updates : [];
    const supabase = db();

    for (const u of updates) {
      const priority = String(u.priority ?? '').toUpperCase();
      const worker = Number(u.worker_minutes);
      const hod = Number(u.hod_minutes);
      if (!(Object.values(PRIORITY) as string[]).includes(priority)) continue;
      if (!Number.isFinite(worker) || worker <= 0) continue;
      if (!Number.isFinite(hod) || hod <= 0) continue;
      await supabase
        .from('sla_config')
        .upsert({ priority, worker_minutes: worker, hod_minutes: hod }, { onConflict: 'priority' });
    }

    await addAudit(supabase, {
      complaintId: null,
      actorId: actor.sub,
      action: 'SLA_CONFIG_UPDATED',
      metadata: { updates },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
