import { Outlet } from 'react-router-dom';
import { PortalGuard } from './components/PortalGuard';
import type { NavItem } from './components/PortalShell';
import { ROLES } from './lib/constants';

const USER_NAV: NavItem[] = [
  { href: '/user', label: 'Dashboard', icon: 'home' },
  { href: '/user/new', label: 'New complaint', icon: 'plus' },
  { href: '/user/complaints', label: 'My complaints', icon: 'list' },
];

const WORKER_NAV: NavItem[] = [
  { href: '/worker', label: 'My queue', icon: 'wrench' },
];

const HOD_NAV: NavItem[] = [
  { href: '/hod', label: 'Dashboard', icon: 'home' },
  { href: '/hod/escalated', label: 'Escalated', icon: 'alert' },
];

const PRINCIPAL_NAV: NavItem[] = [
  { href: '/principal', label: 'Overview', icon: 'chart' },
  { href: '/principal/complaints', label: 'Complaints', icon: 'list' },
  { href: '/principal/staff', label: 'Staff', icon: 'users' },
  { href: '/principal/config', label: 'SLA & Config', icon: 'settings' },
  { href: '/principal/audit', label: 'Audit log', icon: 'document' },
];

export function UserPortalLayout() {
  return (
    <PortalGuard
      roles={[ROLES.STUDENT, ROLES.FACULTY]}
      portalName="User portal"
      nav={USER_NAV}
    >
      <Outlet />
    </PortalGuard>
  );
}

export function WorkerPortalLayout() {
  return (
    <PortalGuard roles={[ROLES.TECHNICIAN]} portalName="Worker portal" nav={WORKER_NAV}>
      <Outlet />
    </PortalGuard>
  );
}

export function HodPortalLayout() {
  return (
    <PortalGuard roles={[ROLES.HOD]} portalName="HOD portal" nav={HOD_NAV}>
      <Outlet />
    </PortalGuard>
  );
}

export function PrincipalPortalLayout() {
  return (
    <PortalGuard
      roles={[ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]}
      portalName="Principal portal"
      nav={PRINCIPAL_NAV}
    >
      <Outlet />
    </PortalGuard>
  );
}
