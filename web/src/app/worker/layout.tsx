import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { PortalShell } from '@/components/PortalShell';

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([ROLES.TECHNICIAN]);
  return (
    <PortalShell user={user} portalName="Worker portal" nav={[{ href: '/worker', label: 'My queue' }]}>
      {children}
    </PortalShell>
  );
}
