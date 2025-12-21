'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type NavItem = {
  label: string;
  href: string;
  match?: 'exact' | 'prefix';
};

export default function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const u = JSON.parse(storedUser);
      setDisplayName(u?.name || u?.email || '');
    } catch {
      // ignore
    }
  }, []);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: 'Dashboard', href: '/dashboard', match: 'exact' },
      { label: 'Deposit', href: '/dashboard/deposit', match: 'prefix' },
      { label: 'Invest', href: '/dashboard/invest', match: 'prefix' },
      { label: 'Team', href: '/dashboard/team', match: 'prefix' },
      { label: 'Withdraw', href: '/dashboard/withdraw', match: 'prefix' },
      { label: 'Profile', href: '/profile', match: 'prefix' },
    ],
    []
  );

  const isActive = (item: NavItem) => {
    if (!pathname) return false;
    if ((item.match || 'prefix') === 'exact') return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
    router.replace('/auth/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              AX
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-100">Arbix</div>
              <div className="text-[11px] text-slate-400">Dashboard</div>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 text-xs text-slate-200 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item)
                  ? 'rounded-lg bg-slate-800 px-3 py-2 text-slate-50'
                  : 'rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900 hover:text-slate-100'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right text-[11px] text-slate-300 md:block">
            <div className="font-medium text-slate-100">{displayName || 'Account'}</div>
            <div className="text-slate-500">Logged in</div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-medium text-slate-100 hover:border-slate-500 md:inline-flex"
          >
            Logout
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex rounded-lg border border-slate-700 p-2 text-slate-100 hover:border-slate-500 md:hidden"
            aria-label="Toggle dashboard menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-800 bg-slate-950 md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-slate-200">{displayName || 'Account'}</div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-100 hover:border-slate-500"
              >
                Logout
              </button>
            </div>

            <nav className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={
                    isActive(item)
                      ? 'rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-50'
                      : 'rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-200 hover:border-slate-700'
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
