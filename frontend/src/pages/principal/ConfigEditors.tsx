import { useState } from 'react';
import { get, patch, put } from '../../lib/api';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITY,
  type Category,
  type Priority,
} from '../../lib/constants';
import { useAsync } from '../../lib/useAsync';

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
interface DepartmentRow {
  id: string;
  name: string;
}

// ---- SLA editor (worker + HOD windows per priority) -----------------------
export function SlaEditor({ sla }: { sla: SlaRow[] }) {
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
    try {
      await patch('/api/admin/sla', { updates });
      setMsg('Saved.');
    } catch {
      setMsg('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-amber-100 bg-amber-50/50 px-5 py-3">
        <h2 className="font-display text-sm font-bold text-stone-800">
          Escalation timers (minutes)
        </h2>
        <p className="mt-0.5 text-xs text-stone-500">
          How long each tier has before the complaint moves up.
        </p>
      </div>
      <div className="overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-amber-800/70">
            <tr>
              <th className="py-2 font-semibold">Priority</th>
              <th className="py-2 font-semibold">Worker window</th>
              <th className="py-2 font-semibold">HOD window</th>
            </tr>
          </thead>
          <tbody>
            {(Object.values(PRIORITY) as Priority[]).map((p) => (
              <tr key={p} className="border-t border-amber-50">
                <td className="py-2.5 pr-4 font-semibold text-stone-700">{p}</td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min={1}
                    className="input w-28"
                    value={vals[p].worker}
                    onChange={(e) =>
                      setVals({ ...vals, [p]: { ...vals[p], worker: Number(e.target.value) } })
                    }
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    className="input w-28"
                    value={vals[p].hod}
                    onChange={(e) =>
                      setVals({ ...vals, [p]: { ...vals[p], hod: Number(e.target.value) } })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-amber-100 px-5 py-4">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save timers'}
        </button>
        {msg && <span className="text-sm text-stone-500">{msg}</span>}
      </div>
    </div>
  );
}

// ---- Assignment map editor ------------------------------------------------
export function AssignmentEditor({
  workers,
  departments = [],
  onSaved,
}: {
  workers: WorkerRow[];
  departments?: DepartmentRow[];
  onSaved?: () => void;
}) {
  const [category, setCategory] = useState<Category>(CATEGORIES.NETWORK);
  const [departmentId, setDepartmentId] = useState('');
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
    try {
      await put('/api/admin/assignments', {
        category,
        staff_id: staffId,
        department_id: departmentId || null,
      });
      setMsg('Mapping updated.');
      onSaved?.();
    } catch {
      setMsg('Failed to update.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-amber-100 bg-amber-50/50 px-5 py-3">
        <h2 className="font-display text-sm font-bold text-stone-800">
          Category → worker mapping
        </h2>
        <p className="mt-0.5 text-xs text-stone-500">Choose who receives each type of complaint.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-48">
          <label className="label">Category</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {(Object.values(CATEGORIES) as Category[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-48">
          <label className="label">Scope</label>
          <select
            className="input"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">Global (all departments)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-48">
          <label className="label">Worker</label>
          <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">— Select —</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name || w.username}
              </option>
            ))}
          </select>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Set mapping'}
        </button>
        {msg && <span className="text-sm text-stone-500">{msg}</span>}
      </div>
      <p className="px-5 pb-4 text-xs text-stone-400">
        A department-specific mapping overrides the global one for that department.
      </p>
    </div>
  );
}

// ---- Current mappings table ------------------------------------------------
export function MappingTable({
  mappings,
  workers,
  departments,
}: {
  mappings: { id: string; category: Category; department_id: string | null; staff_id: string }[];
  workers: WorkerRow[];
  departments: DepartmentRow[];
}) {
  const staffName = new Map(workers.map((w) => [w.id, w.full_name || w.username]));
  const deptName = new Map(departments.map((d) => [d.id, d.name]));

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/50 px-5 py-3">
        <div>
          <h2 className="font-display text-sm font-bold text-stone-800">
            Current category → worker mappings
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            A department-specific mapping takes priority over the global one for complaints filed
            under that department.
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
          {mappings.length} mappings
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-amber-100 text-left text-[11px] uppercase tracking-wider text-amber-800/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Assigned worker</th>
              <th className="px-4 py-3 font-semibold">Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-50">
            {mappings.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-stone-400">
                  No mappings configured.
                </td>
              </tr>
            ) : (
              mappings.map((m) => (
                <tr key={m.id} className="hover:bg-amber-50/40">
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {CATEGORY_LABELS[m.category]}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {staffName.get(m.staff_id) ?? m.staff_id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        m.department_id
                          ? 'bg-violet-50 text-violet-700 ring-violet-200'
                          : 'bg-amber-50 text-amber-800 ring-amber-200'
                      }`}
                    >
                      {m.department_id ? deptName.get(m.department_id) ?? 'Department' : 'Global'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
