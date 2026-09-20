import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import type { AuditLog } from '@/lib/types';

export default async function AuditLogPage() {
  await requireRole([ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
  const { data } = await db()
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  const logs = (data ?? []) as AuditLog[];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Audit log</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No audit events yet.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{l.action.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.metadata ? JSON.stringify(l.metadata) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
