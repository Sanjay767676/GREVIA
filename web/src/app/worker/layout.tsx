import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { PortalShell } from '@/components/PortalShell';

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole([ROLES.TECHNICIAN]);
  return (
    <PortalShell
      profile={profile}
      portalName="Worker portal"
      nav={[{ href: '/worker', label: 'My queue' }]}
    >
      {children}
    </PortalShell>
  );
}
