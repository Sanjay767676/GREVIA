import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROLE_LABEL } from '../lib/constants';
import type { SessionUser } from '../lib/types';
import { NotificationBell } from './NotificationBell';
import { SignOutButton } from './SignOutButton';
import { Logo } from './Logo';
import { PortalNav, type NavItem } from './PortalNav';
import { Icon } from './Icon';

export type { NavItem };

export function PortalShell({
  user,
  portalName,
  nav,
  children,
}: {
  user: SessionUser;
  portalName: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const displayName = user.full_name || user.username;
  const initials = displayName
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#fffdf6] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-amber-200/70 bg-white lg:flex">
        <div className="flex h-20 items-center border-b border-amber-100 px-5">
          <Link to={nav[0]?.href ?? '/'} aria-label="Grievia home">
            <Logo size={40} subtitle={portalName} />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 font-display text-[11px] font-semibold uppercase tracking-wider text-amber-700/60">
            Workspace
          </p>
          <PortalNav items={nav} />
        </div>

        <div className="border-t border-amber-100 p-3">
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100/70 p-3 ring-1 ring-amber-200/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              SLA engine active
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800/70">
              Escalations run automatically every 60 seconds.
            </p>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
              <p className="truncate text-[11px] font-medium text-amber-800/60">
                {ROLE_LABEL[user.role] ?? user.role.replaceAll('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-white/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="lg:hidden">
                <Link to={nav[0]?.href ?? '/'} aria-label="Grievia home">
                  <Logo size={34} wordmark={false} />
                </Link>
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-stone-900">
                  {portalName}
                </p>
                <p className="hidden truncate text-xs text-amber-800/60 sm:block">
                  SNS College of Technology · Grievia
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <span className="hidden h-8 w-px bg-amber-200 sm:block" />
              <div className="hidden items-center gap-2 sm:flex">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                  {initials}
                </span>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold leading-none text-stone-900">{displayName}</p>
                  <p className="mt-1 text-[11px] leading-none text-amber-800/60">
                    {ROLE_LABEL[user.role] ?? user.role.replaceAll('_', ' ')}
                  </p>
                </div>
              </div>
              <SignOutButton />
            </div>
          </div>

          <div className="border-t border-amber-100 px-4 py-2 sm:px-6 lg:hidden">
            <PortalNav items={nav} variant="mobile" />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <footer className="border-t border-amber-100 px-6 py-4 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-amber-800/50">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="shield" className="h-3.5 w-3.5" />
              Closed-loop grievance redressal
            </span>
            <span>Grievia · SNS College of Technology</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
