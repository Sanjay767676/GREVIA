import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ROLE_PORTAL, type Role } from '../lib/constants';
import { PortalShell, type NavItem } from './PortalShell';

// Protects a portal subtree: requires a session and one of the allowed roles,
// then renders the shared portal chrome.
export function PortalGuard({
  roles,
  portalName,
  nav,
  children,
}: {
  roles: Role[];
  portalName: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fffdf6]">
        <div className="flex items-center gap-3 text-sm font-medium text-amber-800">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
          Opening portal…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return <Navigate to={ROLE_PORTAL[user.role] ?? '/login'} replace />;
  }

  return (
    <PortalShell user={user} portalName={portalName} nav={nav}>
      {children}
    </PortalShell>
  );
}
