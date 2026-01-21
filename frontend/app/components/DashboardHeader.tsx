'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type UserThemePref = 'default' | 'light' | 'dark';

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
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [hasRewardReady, setHasRewardReady] = useState(false);
  const [themePref, setThemePref] = useState<UserThemePref>('default');
  const [themeBusy, setThemeBusy] = useState(false);

  const effectiveTheme = useMemo<'light' | 'dark'>(() => {
    if (themePref === 'light' || themePref === 'dark') return themePref;
    const fromDom =
      typeof document !== 'undefined'
        ? (document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null)
        : null;
    return fromDom === 'light' ? 'light' : 'dark';
  }, [themePref]);

  const nextTheme = effectiveTheme === 'dark' ? 'light' : 'dark';

  const normalizeThemePref = (v: any): UserThemePref => {
    if (v === 'light') return 'light';
    if (v === 'dark') return 'dark';
    return 'default';
  };

  const applyThemeToDocument = (theme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  };

  const applyGlobalTheme = async () => {
    try {
      const res = await fetch('/api/public/site-theme', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      const t = data?.theme === 'light' ? 'light' : 'dark';
      applyThemeToDocument(t);
    } catch {
      applyThemeToDocument('dark');
    }
  };

  useEffect(() => {
    const refresh = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setDisplayName('');
          return;
        }
        const u = JSON.parse(storedUser);
        setDisplayName(u?.name || u?.email || '');
      } catch {
        // ignore
      }
    };

    refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') refresh();
    };

    const onUserUpdated = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener('arbix-user-updated', onUserUpdated);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('arbix-user-updated', onUserUpdated);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPref = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setThemePref('default');
          return;
        }

        const res = await fetch('/api/user/theme', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;

        const pref = normalizeThemePref(data?.themePreference);
        setThemePref(pref);

        if (pref === 'light' || pref === 'dark') {
          applyThemeToDocument(pref);
        }
      } catch {
        if (!cancelled) setThemePref('default');
      }
    };

    loadPref();

    const onThemeUpdated = () => loadPref();
    window.addEventListener('arbix-theme-updated', onThemeUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('arbix-theme-updated', onThemeUpdated);
    };
  }, []);

  const toggleThemePref = () => nextTheme;

  const saveThemePref = async (next: UserThemePref) => {
    if (themeBusy) return;
    setThemeBusy(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setThemePref('default');
        await applyGlobalTheme();
        return;
      }

      const res = await fetch('/api/user/theme', {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: next === 'default' ? 'default' : next }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        return;
      }

      setThemePref(next);

      if (next === 'light' || next === 'dark') {
        applyThemeToDocument(next);
      } else {
        await applyGlobalTheme();
      }

      window.dispatchEvent(new Event('arbix-theme-updated'));
    } finally {
      setThemeBusy(false);
    }
  };

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

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasUnreadNotifications(false);
          return;
        }

        const res = await fetch('/api/user/notifications?limit=20', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok || !data?.success || !Array.isArray(data?.notifications)) {
          setHasUnreadNotifications(false);
          return;
        }

        const anyUnread = data.notifications.some((n: any) => !Boolean(n?.isRead));
        setHasUnreadNotifications(anyUnread);
      } catch {
        setHasUnreadNotifications(false);
      }
    };

    fetchUnread();

    const onUpdate = () => fetchUnread();
    window.addEventListener('arbix-notifications-updated', onUpdate);
    return () => window.removeEventListener('arbix-notifications-updated', onUpdate);
  }, []);

  useEffect(() => {
    const fetchReward = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasRewardReady(false);
          return;
        }

        const res = await fetch('/api/user/daily-checkin/status', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
          setHasRewardReady(false);
          return;
        }

        setHasRewardReady(Boolean(data?.canClaim));
      } catch {
        setHasRewardReady(false);
      }
    };

    fetchReward();

    const onUpdate = () => fetchReward();
    window.addEventListener('arbix-daily-reward-updated', onUpdate);
    return () => window.removeEventListener('arbix-daily-reward-updated', onUpdate);
  }, []);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: 'Dashboard', href: '/dashboard', match: 'exact' },
      { label: 'Deposit', href: '/dashboard/deposit', match: 'prefix' },
      { label: 'Packages', href: '/dashboard/packages', match: 'prefix' },
      { label: 'Invest', href: '/dashboard/invest', match: 'prefix' },
      { label: 'Team', href: '/dashboard/team', match: 'prefix' },
      { label: 'Withdraw', href: '/dashboard/withdraw', match: 'prefix' },
      { label: 'Education', href: '/education', match: 'prefix' },
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
          <button
            type="button"
            onClick={() => saveThemePref(toggleThemePref())}
            disabled={themeBusy}
            className={
              'relative inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950/40 p-2 text-slate-100 ' +
              'transition-colors duration-150 hover:border-slate-500 hover:bg-slate-900/50 ' +
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:transition-none ' +
              (themeBusy ? 'opacity-70' : '')
            }
            aria-label="Toggle theme"
            title={`Switch to ${nextTheme}`}
          >
            {nextTheme === 'light' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.464m10.9 10.9l1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                />
              </svg>
            )}

            <span className="sr-only">Switch to {nextTheme}</span>
          </button>

          <Link
            href="/dashboard/daily-rewards"
            className={
              'relative inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950/40 p-2 text-slate-100 ' +
              'transition-colors duration-150 hover:border-slate-500 hover:bg-slate-900/50 ' +
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:transition-none'
            }
            aria-label="Daily Rewards"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13c-1.5 0-3-1.6-3-3.2C9 3.8 10 3 11.1 3c.9 0 1.5.5 1.9 1.1.4-.6 1-1.1 1.9-1.1C16 3 17 3.8 17 4.8 17 6.4 15.5 8 14 8m-6 2h8m-11 0h14a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3a1 1 0 011-1z"
              />
            </svg>
            {hasRewardReady && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950" />
            )}
          </Link>

          <Link
            href="/dashboard/notifications"
            className={
              'relative inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950/40 p-2 text-slate-100 ' +
              'transition-colors duration-150 hover:border-slate-500 hover:bg-slate-900/50 ' +
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:transition-none'
            }
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
              />
            </svg>
            {hasUnreadNotifications && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            )}
          </Link>

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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveThemePref(toggleThemePref())}
                  disabled={themeBusy}
                  className={
                    'inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-[11px] text-slate-100 ' +
                    'transition-colors duration-150 hover:border-slate-500 hover:bg-slate-900/50 ' +
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:transition-none'
                  }
                >
                  {nextTheme === 'light' ? 'Light' : 'Dark'}
                </button>

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

              <Link
                href="/dashboard/notifications"
                onClick={() => setMobileOpen(false)}
                className={
                  (
                    'rounded-lg border px-3 py-2 text-xs transition-colors duration-150 ' +
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:transition-none '
                  ) +
                  (isActive({ label: 'Notifications', href: '/dashboard/notifications', match: 'prefix' })
                    ? 'border-slate-700 bg-slate-800 text-slate-50'
                    : 'border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900/50')
                }
              >
                Notifications
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
