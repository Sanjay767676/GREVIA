import { redirect } from 'next/navigation';
import { currentUser, portalForRole } from '@/lib/auth';

export default async function PostLogin() {
  const user = await currentUser();
  if (!user) redirect('/login');
  redirect(portalForRole(user.role));
}
