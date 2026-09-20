import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { PortalShell } from '@/components/PortalShell';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole([ROLES.STUDENT, ROLES.FACULTY]);
  return (
    <PortalShell
      profile={profile}
      portalName="User portal"
      nav={[
        { href: '/user', label: 'Dashboard' },
        { href: '/user/new', label: 'New complaint' },
        { href: '/user/complaints', label: 'My complaints' },
      ]}
    >
      {children}
    </PortalShell>
  );
}
