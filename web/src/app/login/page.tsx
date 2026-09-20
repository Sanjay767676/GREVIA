'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { publicEnv } from '@/lib/env';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/post-login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-white shadow-md ring-1 ring-slate-200">
            <Image
              src="/SNSCT.png"
              alt="SNS College of Technology"
              width={72}
              height={72}
              className="rounded-full object-contain"
              priority
            />
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Sign in to Grievia
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            SNS College of Technology · Grievance portal
          </p>
        </div>

        {!configured && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Supabase is not configured yet. Set the environment variables in
            <code className="mx-1">.env.local</code> and restart.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sns.edu"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading || !configured} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Demo accounts are listed in the project README.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
