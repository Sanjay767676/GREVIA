import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { useAuth } from '../lib/auth';

const DEMO_ACCOUNTS = [
  { username: 'student', label: 'Student', role: 'Report & track' },
  { username: 'faculty', label: 'Faculty', role: 'Report & track' },
  { username: 'worker.network', label: 'Technician', role: 'Work queue' },
  { username: 'hod.cse', label: 'HOD', role: 'Department' },
  { username: 'Principle', label: 'Principal', role: 'Admin' },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fillDemoAccount(name: string) {
    setUsername(name);
    setPassword('sns');
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const redirect = await login(username, password);
      navigate(params.get('redirect') || redirect || '/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffdf6] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-yellow-200/30 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3 text-stone-900">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm">
            <img
              src="/SNSCT.png"
              alt="SNS College of Technology"
              width={36}
              height={36}
              className="rounded-full object-contain"
            />
          </span>
          <span>
            <span className="block font-display text-lg font-extrabold leading-none">Grievia</span>
            <span className="mt-1 block text-xs font-medium text-stone-800/70">
              SNS College of Technology
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-stone-900">
            Every campus issue has an owner.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-800/80">
            Report it, watch it move, and confirm the fix. Grievia keeps students, technicians,
            HODs, and the Principal on the same page.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              'Automatic routing to the right technician',
              'Live SLA timers with three-tier escalation',
              'Photo proof and complainant verification',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-stone-900">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-900/10 text-stone-900">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs font-medium text-stone-800/60">
          Sincerity · Nobility · Service
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8 lg:min-h-0 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/">
              <Logo size={36} />
            </Link>
            <Link to="/" className="text-sm font-medium text-amber-800 hover:underline">
              Home
            </Link>
          </div>

          <div className="animate-fade-up">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-900">
              Sign in
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Use your campus username and password to open your portal.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                required
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. student"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-amber-700/60 transition-colors hover:text-amber-900"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'shield' : 'search'} className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                'Signing in…'
              ) : (
                <>
                  Sign in
                  <Icon name="arrowRight" className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
              <Icon name="spark" className="h-3.5 w-3.5" />
              Demo accounts
            </div>
            <p className="mt-1 text-xs text-amber-800/70">
              Click an account to fill the form. Password for all demo users is{' '}
              <span className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold text-amber-900 ring-1 ring-amber-200">
                sns
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => fillDemoAccount(account.username)}
                  className="group rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:border-amber-400 hover:bg-yellow-50"
                  title={account.role}
                >
                  <span className="block text-[11px] font-bold text-stone-800 group-hover:text-amber-900">
                    {account.label}
                  </span>
                  <span className="block font-mono text-[10px] text-stone-400">
                    {account.username}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-stone-400">
            Trouble signing in? Contact the Principal&apos;s office.
          </p>
        </div>
      </div>
    </div>
  );
}
