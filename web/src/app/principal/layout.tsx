import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { PortalShell } from '@/components/PortalShell';

export default async function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole([ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);

  const nav = [
    { href: '/principal', label: 'Overview' },
    { href: '/principal/complaints', label: 'Complaints' },
    { href: '/principal/staff', label: 'Staff' },
    { href: '/principal/config', label: 'SLA & Config' },
    { href: '/principal/audit', label: 'Audit log' },
  ];

  return (
    <PortalShell user={user} portalName="Principal portal" nav={nav}>
      {children}
    </PortalShell>
  );
}
