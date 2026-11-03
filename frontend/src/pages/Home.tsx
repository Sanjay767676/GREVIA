import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/Logo';
import { useAuth } from '../lib/auth';
import { ROLE_PORTAL } from '../lib/constants';

const PORTALS: { title: string; desc: string; icon: IconName; tag: string }[] = [
  {
    title: 'Student & Faculty',
    desc: 'Report an issue with photos and follow every step until it is fixed.',
    icon: 'graduation',
    tag: 'Report · Track · Verify',
  },
  {
    title: 'Technician',
    desc: 'See assigned work, accept jobs, and submit photo proof of completion.',
    icon: 'wrench',
    tag: 'Accept · Repair · Prove',
  },
  {
    title: 'Head of Department',
    desc: 'Watch departmental SLAs, reassign workers, and clear escalations.',
    icon: 'building',
    tag: 'Oversee · Reassign',
  },
  {
    title: 'Principal',
    desc: 'College-wide analytics, SLA tuning, staff accounts, and audit trail.',
    icon: 'chart',
    tag: 'Govern · Configure',
  },
];

const STEPS: { title: string; desc: string; icon: IconName }[] = [
  {
    title: 'Report',
    desc: 'A student or faculty member files a grievance with location and photo evidence.',
    icon: 'document',
  },
  {
    title: 'Classify',
    desc: 'A rule-first engine sets the category and priority instantly. AI only helps when text is unclear.',
    icon: 'spark',
  },
  {
    title: 'Repair',
    desc: 'The right technician is assigned automatically and the SLA clock starts.',
    icon: 'wrench',
  },
  {
    title: 'Verify',
    desc: 'The complainant confirms the fix or reopens it. Nothing closes without their word.',
    icon: 'checkCircle',
  },
];

const SLA_ROWS = [
  { tier: 'Critical', worker: '4 hours', hod: '4 hours', width: 'w-1/4', color: 'bg-red-500' },
  { tier: 'High', worker: '12 hours', hod: '6 hours', width: 'w-2/5', color: 'bg-orange-500' },
  { tier: 'Medium', worker: '24 hours', hod: '12 hours', width: 'w-3/5', color: 'bg-amber-500' },
  { tier: 'Low', worker: '48 hours', hod: '24 hours', width: 'w-4/5', color: 'bg-yellow-400' },
];

export function Home() {
  const { user, loading } = useAuth();
  const portal = user ? ROLE_PORTAL[user.role] : null;

  return (
    <div className="min-h-screen bg-[#fffdf6] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Grievia home">
            <Logo size={38} subtitle="Grievance redressal" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-amber-900/70 md:flex">
            <a href="#how" className="transition-colors hover:text-amber-900">
              How it works
            </a>
            <a href="#portals" className="transition-colors hover:text-amber-900">
              Portals
            </a>
            <a href="#sla" className="transition-colors hover:text-amber-900">
              SLA &amp; escalation
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {!loading && portal ? (
              <Link to={portal} className="btn-primary">
                Open my portal
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-50 sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link to="/login" className="btn-primary">
                  Open portal
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-display text-xs font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                SNS College of Technology
              </span>

              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Campus issues,
                <span className="relative ml-2 inline-block">
                  <span className="relative z-10">resolved on time.</span>
                  <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-sm bg-amber-300/70" />
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
                Grievia is a closed-loop grievance system for SNS College. Report a problem, watch
                it get routed to the right worker, and verify the fix — with automatic escalation
                if the clock runs out.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to={portal ?? '/login'} className="btn-primary px-5 py-3 text-base">
                  {portal ? 'Go to my portal' : 'Sign in to continue'}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
                <a href="#how" className="btn-secondary px-5 py-3 text-base">
                  See how it works
                </a>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-amber-200/70 pt-6">
                {[
                  ['4', 'Role-based portals'],
                  ['<15ms', 'Rule-first triage'],
                  ['60s', 'Escalation sweep'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-2xl font-extrabold text-amber-900">{value}</dt>
                    <dd className="mt-0.5 text-xs font-medium text-stone-500">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Product preview */}
            <div className="relative mx-auto w-full max-w-lg animate-fade-up lg:max-w-none">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-200/60 via-yellow-100/40 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_24px_60px_-24px_rgba(180,120,0,0.35)]">
                <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[11px] text-amber-800/60">GRV-1042</span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-[11px] font-semibold uppercase tracking-wider text-amber-700/60">
                        Network / Internet
                      </p>
                      <h3 className="mt-1 font-display text-lg font-bold leading-tight">
                        WiFi down in CSE Lab 3
                      </h3>
                      <p className="mt-1 text-xs text-stone-500">CSE Block · Room 302</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 ring-1 ring-inset ring-orange-200">
                      HIGH
                    </span>
                  </div>

                  <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-900">
                        <Icon name="clock" className="h-4 w-4" />
                        SLA deadline
                      </span>
                      <span className="font-mono font-semibold text-orange-700">2h 14m left</span>
                    </div>
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-amber-200/70">
                      <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                    </div>
                  </div>

                  <ol className="mt-5 space-y-3">
                    {[
                      ['Submitted', 'Student uploaded a photo', true],
                      ['Assigned', 'Network technician · A. Kumar', true],
                      ['In progress', 'Switch replacement underway', true],
                      ['Verification', 'Waiting for student confirmation', false],
                    ].map(([title, sub, done], i) => (
                      <li key={title as string} className="flex gap-3">
                        <span className="flex flex-col items-center">
                          <span
                            className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                              done
                                ? 'bg-emerald-500 text-white'
                                : 'border-2 border-amber-300 bg-white text-amber-500'
                            }`}
                          >
                            {done ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
                          </span>
                          {i < 3 && (
                            <span
                              className={`mt-1 h-4 w-px ${done ? 'bg-emerald-200' : 'bg-amber-200'}`}
                            />
                          )}
                        </span>
                        <div className="pb-0.5">
                          <p className="text-sm font-semibold leading-tight">{title as string}</p>
                          <p className="mt-0.5 text-[11px] text-stone-500">{sub as string}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex items-center gap-2 border-t border-amber-100 bg-yellow-50/60 px-5 py-3 text-[11px] font-medium text-amber-800">
                  <Icon name="spark" className="h-3.5 w-3.5" />
                  Classified by rule engine · 12ms
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-amber-200/60 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Four steps. No lost complaints.
              </h2>
              <p className="mt-3 text-stone-600">
                Every grievance follows the same accountable path from report to verified closure.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="group relative rounded-2xl border border-amber-200/80 bg-[#fffdf6] p-5 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_12px_30px_-16px_rgba(180,120,0,0.4)]"
                >
                  <span className="absolute right-4 top-4 font-mono text-xs font-bold text-amber-300">
                    0{i + 1}
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portals */}
        <section id="portals" className="py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="eyebrow">Portals</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  One system, four clear views.
                </h2>
                <p className="mt-3 text-stone-600">
                  Each role sees only what it needs — nothing more, nothing less.
                </p>
              </div>
              <Link to="/login" className="btn-secondary">
                Sign in
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {PORTALS.map((portalCard) => (
                <Link
                  key={portalCard.title}
                  to="/login"
                  className="group flex items-start gap-4 rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-card-hover"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
                    <Icon name={portalCard.icon} className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-base font-bold">{portalCard.title}</span>
                      <Icon
                        name="arrowRight"
                        className="h-4 w-4 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-stone-600">
                      {portalCard.desc}
                    </span>
                    <span className="mt-3 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200">
                      {portalCard.tag}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SLA band */}
        <section id="sla" className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-stone-900 text-white">
            <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-amber-400">
                  SLA &amp; escalation
                </p>
                <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Deadlines that actually escalate.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-stone-300">
                  Every priority tier has a worker window and a HOD window. When a timer breaches,
                  the complaint moves up automatically — technician to HOD to Principal — and the
                  audit log records why.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Idempotent — never escalates twice to the same tier',
                    'Configurable by the Principal in seconds',
                    'Runs even if external AI services are offline',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-stone-300">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-display text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Resolution windows
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    ACTIVE
                  </span>
                </div>
                <div className="space-y-4">
                  {SLA_ROWS.map((row) => (
                    <div key={row.tier}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-200">{row.tier}</span>
                        <span className="text-stone-400">
                          {row.worker} <span className="text-stone-600">/</span> {row.hod}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${row.width} ${row.color}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-stone-500">
                  Worker window → HOD window. Configurable per priority.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-amber-200/60 bg-gradient-to-b from-yellow-50 to-amber-100/60 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-amber-200">
              <img
                src="/SNSCT.png"
                alt="SNS College of Technology"
                width={52}
                height={52}
                className="object-contain"
              />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Sincerity. Nobility. Service.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-stone-600">
              Sign in with your campus account to report an issue, manage your queue, or review
              departmental performance.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to={portal ?? '/login'} className="btn-primary px-6 py-3 text-base">
                {portal ? 'Open my portal' : 'Sign in to Grievia'}
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <a href="#portals" className="btn-secondary px-6 py-3 text-base">
                Explore portals
              </a>
            </div>
            <p className="mt-4 text-xs text-amber-800/60">
              Demo accounts are listed on the sign-in page.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-amber-200/70 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-stone-500 sm:flex-row sm:px-6 lg:px-8">
          <Logo size={30} subtitle="Grievance redressal" />
          <p>Grievia · SNS College of Technology · Coimbatore</p>
        </div>
      </footer>
    </div>
  );
}
