import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { currentUser, portalForRole } from '@/lib/auth';

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(portalForRole(user.role));

  const portals = [
    { title: 'User portal', desc: 'Students & faculty submit and track complaints.', icon: '🎓' },
    { title: 'Worker portal', desc: 'Technicians accept, work and resolve issues.', icon: '🛠️' },
    { title: 'HOD portal', desc: 'Department oversight, reassignment, escalation.', icon: '🏛️' },
    { title: 'Admin portal', desc: 'Principal & admin analytics and configuration.', icon: '📊' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-gold-400" />

      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-14 text-center">
          <span className="mx-auto mb-5 grid h-24 w-24 place-items-center rounded-full bg-white shadow-lg ring-1 ring-slate-200">
            <Image
              src="/SNSCT.png"
              alt="SNS College of Technology"
              width={88}
              height={88}
              className="rounded-full object-contain"
              priority
            />
          </span>
          <h1 className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
            Grievia
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-slate-600">
            AI-assisted campus grievance management &amp; automatic escalation.
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            SNS College of Technology · Sincerity · Nobility · Service
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link href="/login" className="btn-primary px-6 py-3 text-base">
              Sign in to continue
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portals.map((c) => (
            <div key={c.title} className="card card-hover p-5">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-xl">
                {c.icon}
              </div>
              <p className="font-semibold text-slate-800">{c.title}</p>
              <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 rounded-2xl border border-slate-200 bg-white/60 p-6 sm:grid-cols-3">
          {[
            { k: 'Deterministic core', v: 'Assignment, SLA & escalation run without any AI dependency.' },
            { k: 'AI-assisted routing', v: 'Optional multi-provider classification with rule-engine fallback.' },
            { k: 'Full audit trail', v: 'Every action is logged with an immutable history timeline.' },
          ].map((f) => (
            <div key={f.k}>
              <p className="section-title">{f.k}</p>
              <p className="mt-2 text-sm text-slate-500">{f.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
