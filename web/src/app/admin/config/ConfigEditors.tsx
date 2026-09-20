'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITY,
  ROLES,
  type Category,
  type Priority,
} from '@/lib/constants';
import type { Department, Profile, SlaConfig } from '@/lib/types';

type StaffLite = Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>;

// ---- SLA editor -----------------------------------------------------------
export function SlaEditor({ sla }: { sla: SlaConfig[] }) {
  const router = useRouter();
  const initial: Record<string, number> = {};
  for (const p of Object.values(PRIORITY)) {
    initial[p] = sla.find((s) => s.priority === p)?.minutes ?? 0;
  }
  const [minutes, setMinutes] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const updates = Object.entries(minutes).map(([priority, m]) => ({
      priority,
      minutes: Number(m),
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
      <h2 className="mb-3 text-sm font-semibold text-slate-700">SLA (minutes per priority)</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        {(Object.values(PRIORITY) as Priority[]).map((p) => (
          <div key={p}>
            <label className="label">{p}</label>
            <input
              type="number"
              min={1}
              className="input"
              value={minutes[p]}
              onChange={(e) => setMinutes({ ...minutes, [p]: Number(e.target.value) })}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save SLA'}
        </button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}

// ---- Assignment map editor ------------------------------------------------
export function AssignmentEditor({
  technicians,
}: {
  technicians: StaffLite[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>(CATEGORIES.NETWORK);
  const [staffId, setStaffId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!staffId) {
      setMsg('Select a technician.');
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
      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Category → staff mapping (global)
      </h2>
      <div className="flex flex-wrap items-end gap-3">
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
          <label className="label">Technician</label>
          <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">— Select —</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || t.email}
              </option>
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

// ---- User role editor -----------------------------------------------------
export function UserEditor({
  users,
  departments,
}: {
  users: StaffLite[];
  departments: Department[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<string>(ROLES.STUDENT);
  const [departmentId, setDepartmentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!userId) {
      setMsg('Select a user.');
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        role,
        department_id: departmentId || null,
      }),
    });
    setSaving(false);
    setMsg(res.ok ? 'User updated.' : 'Failed to update.');
    if (res.ok) router.refresh();
  }

  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">User roles &amp; departments</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">User</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— Select —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {(u.full_name || u.email) + ` (${u.role})`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {r.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Department</label>
          <select
            className="input"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">— None —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Update user'}
        </button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}
