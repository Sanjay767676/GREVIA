import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { PortalShell } from '@/components/PortalShell';

export default async function HodLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([ROLES.HOD]);
  return (
    <PortalShell
      user={user}
      portalName="HOD portal"
      nav={[
        { href: '/hod', label: 'Dashboard' },
        { href: '/hod/escalated', label: 'Escalated' },
      ]}
    >
      {children}
    </PortalShell>
  );
}
