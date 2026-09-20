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
          <h1 className="text-5xl font-extrabold tracking-tight text-black">
            Grievia
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-black/70">
            AI-assisted campus grievance management &amp; automatic escalation.
          </p>
          <p className="mt-1 text-sm font-medium text-black/60">
            SNS College of Technology · Sincerity · Nobility · Service
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link href="/login" className="btn-primary px-6 py-3 text-base">
              Sign in to continue
            </Link>
          </div>
        </div>



      </div>
    </div>
  );
}
