'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, CATEGORY_LABELS, PRIORITY, type Category, type Priority } from '@/lib/constants';

interface SlaRow {
  priority: string;
  worker_minutes: number;
  hod_minutes: number;
}
interface WorkerRow {
  id: string;
  full_name: string;
  username: string;
}

// ---- SLA editor (worker + HOD windows per priority) -----------------------
export function SlaEditor({ sla }: { sla: SlaRow[] }) {
  const router = useRouter();
  const initial: Record<string, { worker: number; hod: number }> = {};
  for (const p of Object.values(PRIORITY)) {
    const row = sla.find((s) => s.priority === p);
    initial[p] = { worker: row?.worker_minutes ?? 0, hod: row?.hod_minutes ?? 0 };
  }
  const [vals, setVals] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const updates = Object.entries(vals).map(([priority, v]) => ({
      priority,
      worker_minutes: Number(v.worker),
      hod_minutes: Number(v.hod),
    }));
    const res = await fetch('/api/admin/sla', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    setSaving(false);
    setMsg(res.ok ? 'Saved.' : 'Failed to save.');
    if (res.ok) router.refresh();
  }

  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Escalation timers (minutes)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Priority</th>
              <th className="py-2">Worker window</th>
              <th className="py-2">HOD window</th>
            </tr>
          </thead>
          <tbody>
            {(Object.values(PRIORITY) as Priority[]).map((p) => (
              <tr key={p}>
                <td className="py-2 pr-4 font-medium text-slate-700">{p}</td>
                <td className="py-2 pr-4">
                  <input type="number" min={1} className="input w-28" value={vals[p].worker}
                    onChange={(e) => setVals({ ...vals, [p]: { ...vals[p], worker: Number(e.target.value) } })} />
                </td>
                <td className="py-2">
                  <input type="number" min={1} className="input w-28" value={vals[p].hod}
                    onChange={(e) => setVals({ ...vals, [p]: { ...vals[p], hod: Number(e.target.value) } })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save timers'}
        </button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}

// ---- Assignment map editor ------------------------------------------------
export function AssignmentEditor({ workers }: { workers: WorkerRow[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>(CATEGORIES.NETWORK);
  const [staffId, setStaffId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!staffId) {
      setMsg('Select a worker.');
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await fetch('/api/admin/assignments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, staff_id: staffId }),
    });
    setSaving(false);
    setMsg(res.ok ? 'Mapping updated.' : 'Failed to update.');
    if (res.ok) router.refresh();
  }

  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Category → worker mapping</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48">
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {(Object.values(CATEGORIES) as Category[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div className="min-w-48">
          <label className="label">Worker</label>
          <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">— Select —</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.full_name || w.username}</option>
            ))}
          </select>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Set mapping'}
        </button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}
