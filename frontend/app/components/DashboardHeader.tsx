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
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/public/branding', { method: 'GET' });
        const data = await res.json();
        if (!cancelled && data?.success) {
          setLogoDataUrl(data?.branding?.logoDataUrl || null);
        }
      } catch {
        if (!cancelled) setLogoDataUrl(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white overflow-hidden">
              {logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDataUrl} alt="Arbix" className="h-9 w-9 object-contain" />
              ) : (
                'AX'
              )}
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
                (
                  'relative rounded-lg px-3 py-2 transition-colors duration-150 ' +
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 ' +
                  'motion-reduce:transition-none '
                ) +
                (isActive(item)
                  ? 'bg-slate-800 text-slate-50 after:absolute after:inset-x-2 after:bottom-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/70 after:to-transparent'
                  : 'text-slate-300 hover:bg-slate-900/60 hover:text-slate-100')
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
            className={
              'hidden rounded-lg border border-rose-900/60 bg-rose-500/5 px-3 py-2 text-[11px] font-medium text-rose-100 ' +
              'transition-colors duration-150 hover:border-rose-500/70 hover:bg-rose-500/10 ' +
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/30 motion-reduce:transition-none md:inline-flex'
            }
          >
            Logout
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={
              'inline-flex rounded-lg border border-slate-700 bg-slate-950/40 p-2 text-slate-100 ' +
              'transition-colors duration-150 hover:border-slate-500 hover:bg-slate-900/50 ' +
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:transition-none md:hidden'
            }
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
                className={
                  'rounded-lg border border-rose-900/60 bg-rose-500/5 px-3 py-1.5 text-[11px] text-rose-100 ' +
                  'transition-colors duration-150 hover:border-rose-500/70 hover:bg-rose-500/10 ' +
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/30 motion-reduce:transition-none'
                }
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
                    (
                      'rounded-lg border px-3 py-2 text-xs transition-colors duration-150 ' +
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:transition-none '
                    ) +
                    (isActive(item)
                      ? 'border-slate-700 bg-slate-800 text-slate-50'
                      : 'border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900/50')
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
