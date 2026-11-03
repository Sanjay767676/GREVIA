import { Link, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

export interface NavItem {
  href: string;
  label: string;
  icon?: IconName;
}

function isActive(pathname: string, href: string, firstHref: string) {
  if (href === firstHref) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalNav({
  items,
  variant = 'sidebar',
}: {
  items: NavItem[];
  variant?: 'sidebar' | 'mobile';
}) {
  const { pathname } = useLocation();
  const firstHref = items[0]?.href ?? '/';

  if (variant === 'mobile') {
    return (
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Portal navigation">
        {items.map((item) => {
          const active = isActive(pathname, item.href, firstHref);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-amber-800/70 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              {item.icon && <Icon name={item.icon} className="h-4 w-4" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1" aria-label="Portal navigation">
      {items.map((item) => {
        const active = isActive(pathname, item.href, firstHref);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? 'bg-amber-100 text-amber-900 shadow-sm ring-1 ring-amber-200'
                : 'text-amber-900/70 hover:bg-amber-50 hover:text-amber-900'
            }`}
          >
            {item.icon && (
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                  active
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 group-hover:bg-amber-100'
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
              </span>
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
