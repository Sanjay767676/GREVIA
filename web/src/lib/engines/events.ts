// ---------------------------------------------------------------------------
// Shared side-effect helpers: complaint history, audit log, notifications.
// All take a Supabase client (typically the service-role admin client) so
// deterministic workflow steps can always write regardless of RLS.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ComplaintStatus } from '../constants';

export async function addHistory(
  supabase: SupabaseClient,
  params: {
    complaintId: string;
    actorId: string | null;
    action: string;
    fromStatus?: ComplaintStatus | null;
    toStatus?: ComplaintStatus | null;
    note?: string | null;
  },
): Promise<void> {
  await supabase.from('complaint_history').insert({
    complaint_id: params.complaintId,
    actor_id: params.actorId,
    action: params.action,
    from_status: params.fromStatus ?? null,
    to_status: params.toStatus ?? null,
    note: params.note ?? null,
  });
}

export async function addAudit(
  supabase: SupabaseClient,
  params: {
    complaintId: string | null;
    actorId: string | null;
    action: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await supabase.from('audit_logs').insert({
    complaint_id: params.complaintId,
    actor_id: params.actorId,
    action: params.action,
    metadata: params.metadata ?? null,
  });
}

export async function notify(
  supabase: SupabaseClient,
  params: {
    userId: string;
    complaintId: string | null;
    title: string;
    body?: string;
  },
): Promise<void> {
  if (!params.userId) return;
  await supabase.from('notifications').insert({
    user_id: params.userId,
    complaint_id: params.complaintId,
    title: params.title,
    body: params.body ?? '',
  });
}

// Notify many users (dedupes falsy/empty ids).
export async function notifyMany(
  supabase: SupabaseClient,
  userIds: (string | null | undefined)[],
  params: { complaintId: string | null; title: string; body?: string },
): Promise<void> {
  const rows = Array.from(new Set(userIds.filter(Boolean) as string[])).map(
    (userId) => ({
      user_id: userId,
      complaint_id: params.complaintId,
      title: params.title,
      body: params.body ?? '',
    }),
  );
  if (rows.length) await supabase.from('notifications').insert(rows);
}
