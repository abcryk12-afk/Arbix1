'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TabKey = 'dashboard' | 'deposit' | 'invest' | 'team' | 'profile';

type Tab = {
  key: TabKey;
  label: string;
  href: string;
  match: 'exact' | 'prefix';
  icon: (active: boolean) => JSX.Element;
};

function isActivePath(pathname: string | null, href: string, match: 'exact' | 'prefix') {
  if (!pathname) return false;
  if (match === 'exact') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardBottomNav() {
  const pathname = usePathname();

  const tabs: Tab[] = [
    {
      key: 'dashboard',
      label: 'Home',
      href: '/dashboard',
      match: 'exact',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
          {active ? <path d="M9.5 21V14.8h5V21" /> : null}
        </svg>
      ),
    },
    {
      key: 'deposit',
      label: 'Deposit',
      href: '/dashboard/deposit',
      match: 'prefix',
      icon: () => (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" />
          <path d="M7 10l5-5 5 5" />
          <path d="M4 19h16" />
        </svg>
      ),
    },
    {
      key: 'invest',
      label: 'Invest',
      href: '/dashboard/invest',
      match: 'prefix',
      icon: () => (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" />
          <path d="M19 8c0-2.8-3.1-5-7-5S5 5.2 5 8s3.1 5 7 5 7 2.2 7 5-3.1 5-7 5-7-2.2-7-5" />
        </svg>
      ),
    },
    {
      key: 'team',
      label: 'Team',
      href: '/dashboard/team',
      match: 'prefix',
      icon: () => (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: 'profile',
      label: 'Profile',
      href: '/profile',
      match: 'prefix',
      icon: () => (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2">
        {tabs.map((t) => {
          const active = isActivePath(pathname, t.href, t.match);
          return (
            <Link
              key={t.key}
              href={t.href}
              className={
                'm3-ripple group relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium ' +
                (active ? 'text-heading' : 'text-muted')
              }
              aria-label={t.label}
            >
              <span
                className={
                  'flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-200 ' +
                  (active ? 'bg-primary/10 text-primary shadow-theme-sm' : 'text-muted group-hover:text-heading')
                }
              >
                {t.icon(active)}
              </span>
              <span className={active ? 'text-heading' : 'text-muted'}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
