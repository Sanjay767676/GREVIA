import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';

export function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#fffdf6] px-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="mb-8 inline-flex justify-center">
          <Logo size={40} subtitle="Grievance redressal" />
        </Link>
        <p className="font-mono text-6xl font-extrabold text-amber-300">404</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-stone-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          The page you are looking for does not exist or may have moved.
        </p>
        <Link to="/" className="btn-primary mt-6">
          <Icon name="home" className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
