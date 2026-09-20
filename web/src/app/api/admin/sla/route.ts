import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile, requireApiRole } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AUDIT_ACTIONS, PRIORITY, ROLES } from '@/lib/constants';
import { addAudit } from '@/lib/engines/events';

// PATCH /api/admin/sla — update SLA minutes per priority (SUPER_ADMIN only).
// body: { updates: { priority: Priority, minutes: number }[] }
export async function PATCH(req: NextRequest) {
  try {
    const profile = await getApiProfile();
    requireApiRole(profile, [ROLES.SUPER_ADMIN]);

    const body = await req.json();
    const updates = Array.isArray(body.updates) ? body.updates : [];
    const admin = createAdminClient();

    for (const u of updates) {
      const priority = String(u.priority ?? '').toUpperCase();
      const minutes = Number(u.minutes);
      if (!(Object.values(PRIORITY) as string[]).includes(priority)) continue;
      if (!Number.isFinite(minutes) || minutes <= 0) continue;
      await admin
        .from('sla_config')
        .upsert({ priority, minutes }, { onConflict: 'priority' });
    }

    await addAudit(admin, {
      complaintId: null,
      actorId: profile.id,
      action: 'SLA_CONFIG_UPDATED',
      metadata: { updates },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
