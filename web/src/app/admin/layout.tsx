import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { PortalShell } from '@/components/PortalShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole([ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
  const isSuperAdmin = profile.role === ROLES.SUPER_ADMIN;

  const nav = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/complaints', label: 'Complaints' },
    ...(isSuperAdmin
      ? [{ href: '/admin/config', label: 'Configuration' }]
      : []),
    { href: '/admin/audit', label: 'Audit log' },
  ];

  return (
    <PortalShell
      profile={profile}
      portalName={isSuperAdmin ? 'Admin portal' : 'Principal portal'}
      nav={nav}
    >
      {children}
    </PortalShell>
  );
}
