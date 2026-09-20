import Link from 'next/link';
import type { SessionPayload } from '@/lib/session';
import { NotificationBell } from './NotificationBell';
import { SignOutButton } from './SignOutButton';
import { Logo } from './Logo';

export interface NavItem {
  href: string;
  label: string;
}

export function PortalShell({
  user,
  portalName,
  nav,
  children,
}: {
  user: SessionPayload;
  portalName: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const displayName = user.full_name || user.username;
  const initials = displayName
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen">
      {/* Accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-gold-400" />

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href={nav[0]?.href ?? '/'} className="flex items-center">
              <Logo size={38} subtitle={portalName} />
            </Link>
            <nav className="hidden gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                <p className="text-[11px] font-medium text-slate-500">
                  {user.role.replaceAll('_', ' ')}
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                {initials}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
