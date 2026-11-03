import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { get, post } from '../../lib/api';
import { ROLES } from '../../lib/constants';
import { useAsync } from '../../lib/useAsync';

interface StaffRow {
  id: string;
  username: string;
  full_name: string;
  role: string;
  department_id: string | null;
}

interface DepartmentRow {
  id: string;
  name: string;
}

const ROLE_TONE: Record<string, string> = {
  [ROLES.HOD]: 'bg-violet-50 text-violet-700 ring-violet-200',
  [ROLES.TECHNICIAN]: 'bg-amber-50 text-amber-800 ring-amber-200',
  [ROLES.PRINCIPAL]: 'bg-stone-100 text-stone-700 ring-stone-200',
  [ROLES.SUPER_ADMIN]: 'bg-stone-100 text-stone-700 ring-stone-200',
};

export function StaffManager({
  users,
  departments,
  onCreated,
}: {
  users: StaffRow[];
  departments: DepartmentRow[];
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(ROLES.TECHNICIAN);
  const [departmentId, setDepartmentId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? '—' : '—';

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      await post('/api/admin/users', {
        username,
        password,
        full_name: fullName,
        role,
        department_id: departmentId || null,
      });
      setMsg(`Created ${username}. They can now log in with the password you set.`);
      setFullName('');
      setUsername('');
      setPassword('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card overflow-hidden">
        <div className="panel-head">
          <Icon name="users" className="h-4 w-4 text-amber-700" />
          <h2 className="font-display text-sm font-bold text-stone-800">Add HOD / Worker</h2>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="staff-name">
                Full name
              </label>
              <input
                id="staff-name"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. R. Kumar"
              />
            </div>
            <div>
              <label className="label" htmlFor="staff-role">
                Role
              </label>
              <select
                id="staff-role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value={ROLES.HOD}>HOD</option>
                <option value={ROLES.TECHNICIAN}>Worker (Technician)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="staff-username">
                Username
              </label>
              <input
                id="staff-username"
                className="input"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. hod.mech"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label" htmlFor="staff-password">
                Password
              </label>
              <input
                id="staff-password"
                className="input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a password"
                autoComplete="new-password"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="staff-dept">
                Department
              </label>
              <select
                id="staff-dept"
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

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {msg && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              <Icon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0" />
              {msg}
            </div>
          )}

          <div className="border-t border-amber-100 pt-4">
            <button type="submit" disabled={loading} className="btn-primary">
              <Icon name="plus" className="h-4 w-4" />
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Icon name="list" className="h-4 w-4 text-amber-700" />
            <h2 className="font-display text-sm font-bold text-stone-800">Existing users</h2>
          </div>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
            {users.length} accounts
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-amber-100 text-left text-[11px] uppercase tracking-wider text-amber-800/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-stone-400">
                    No staff accounts yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3 font-semibold text-stone-800">
                      {u.full_name || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">{u.username}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          ROLE_TONE[u.role] ?? 'bg-stone-100 text-stone-700 ring-stone-200'
                        }`}
                      >
                        {u.role.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{deptName(u.department_id)}</td>
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
