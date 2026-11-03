import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Icon } from './Icon';

export function SignOutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <button
      onClick={signOut}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-xs font-semibold text-amber-900 transition-colors hover:border-amber-300 hover:bg-amber-50"
      title="Sign out"
    >
      <Icon name="logout" className="h-4 w-4" />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
