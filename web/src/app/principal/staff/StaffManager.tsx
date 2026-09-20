'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import type { Department } from '@/lib/types';

interface StaffRow {
  id: string;
  username: string;
  full_name: string;
  role: string;
  department_id: string | null;
}

export function StaffManager({
  users,
  departments,
}: {
  users: StaffRow[];
  departments: Department[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(ROLES.TECHNICIAN);
  const [departmentId, setDepartmentId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const deptName = (id: string | null) =>
    id ? (departments.find((d) => d.id === id)?.name ?? '—') : '—';

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          role,
          department_id: departmentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create user');
        return;
      }
      setMsg(`Created ${username}. They can now log in with the password you set.`);
      setFullName('');
      setUsername('');
      setPassword('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-slate-700">Add HOD / Worker</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. R. Kumar" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value={ROLES.HOD}>HOD</option>
              <option value={ROLES.TECHNICIAN}>Worker (Technician)</option>
            </select>
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. hod.mech" autoComplete="off" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password" autoComplete="new-password" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Department</label>
            <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">— None —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
          Existing users
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-slate-800">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.username}</td>
                  <td className="px-4 py-3 text-slate-600">{u.role.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{deptName(u.department_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
