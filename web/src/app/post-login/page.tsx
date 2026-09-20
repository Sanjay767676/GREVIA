import { redirect } from 'next/navigation';
import { getSessionProfile, portalForRole } from '@/lib/auth';

// Landing target after login — routes the user to their role's portal.
export default async function PostLogin() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login');
  redirect(portalForRole(profile.role));
}
