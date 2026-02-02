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
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [hasRewardReady, setHasRewardReady] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'colorful'>('dark');
  const [themeLoading, setThemeLoading] = useState(false);

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
    const read = () => {
      const t = document.documentElement.getAttribute('data-theme');
      const next = t === 'light' || t === 'dark' || t === 'colorful' ? t : 'dark';
      setTheme(next);
    };

    read();
    const observer = new MutationObserver(() => read());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
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

  const requestThemeChange = (nextTheme: 'light' | 'dark' | 'colorful', persist: 'override' | 'clear') => {
    try {
      window.dispatchEvent(new CustomEvent('arbix-theme-change', { detail: { theme: nextTheme, persist } }));
    } catch {
      // ignore
    }
  };

  const handleToggleTheme = async () => {
    const themeOrder: Array<'light' | 'dark' | 'colorful'> = ['light', 'dark', 'colorful'];
    const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length] || 'dark';
    setThemeLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/user/theme', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ theme: nextTheme }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          requestThemeChange(nextTheme, 'clear');
          return;
        }
      }

      requestThemeChange(nextTheme, 'override');
    } catch {
      requestThemeChange(nextTheme, 'override');
    } finally {
      setThemeLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/30 backdrop-blur shadow-theme-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="arbix-3d arbix-shine flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary text-sm font-bold text-primary-fg shadow-theme-sm border border-border/20">
              {logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDataUrl} alt="Arbix" className="h-9 w-9 object-contain" />
              ) : (
                'AX'
              )}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-heading">Arbix</div>
              <div className="text-[11px] text-muted">Dashboard</div>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 text-xs text-muted md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                (
                  'relative rounded-lg px-3 py-2 transition-colors duration-150 ' +
                  'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
                  'motion-reduce:transition-none '
                ) +
                (isActive(item)
                  ? 'bg-card text-heading after:absolute after:inset-x-2 after:bottom-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/70 after:to-transparent'
                  : 'text-muted hover:text-heading')
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleTheme}
            disabled={themeLoading}
            className={
              'hidden items-center justify-center rounded-lg border border-border bg-surface/40 p-2 text-fg ' +
              'transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 disabled:opacity-60 md:inline-flex '
            }
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m9.9 9.9 1.414 1.414"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            )}
          </button>

          <Link
            href="/dashboard/daily-rewards"
            className={
              'relative inline-flex items-center justify-center rounded-lg border border-border bg-surface/40 p-2 text-fg ' +
              'transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 ' +
              'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none'
            }
            aria-label="Daily Rewards"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect x="3" y="8" width="18" height="4" rx="1" />
              <path d="M12 8v13" />
              <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
              <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 12 8a4.8 8 0 0 1 4.5 5" />
            </svg>
            {hasRewardReady && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-warning border-2 border-border" />
            )}
          </Link>

          <Link
            href="/dashboard/notifications"
            className={
              'relative inline-flex items-center justify-center rounded-lg border border-border bg-surface/40 p-2 text-fg ' +
              'transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 ' +
              'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none'
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
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-border" />
            )}
          </Link>

          <div className="hidden text-right text-[11px] text-muted md:block">
            <div className="font-medium text-heading">{displayName || 'Account'}</div>
            <div className="text-muted">Logged in</div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={
              'hidden rounded-lg border border-border bg-danger/10 px-3 py-2 text-[11px] font-medium text-fg ' +
              'transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 ' +
              'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none md:inline-flex'
            }
          >
            Logout
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={
              'inline-flex rounded-lg border border-border bg-surface/40 p-2 text-fg ' +
              'transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 ' +
              'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none md:hidden'
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
        <div className="border-t border-border bg-surface md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-muted">{displayName || 'Account'}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  disabled={themeLoading}
                  className={
                    'inline-flex items-center justify-center rounded-lg border border-border bg-surface/40 p-2 text-fg ' +
                    'transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 disabled:opacity-60'
                  }
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m9.9 9.9 1.414 1.414"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8a4 4 0 100 8 4 4 0 000-8z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={
                    'rounded-lg border border-border bg-danger/10 px-3 py-1.5 text-[11px] text-fg ' +
                    'transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 ' +
                    'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none'
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
                      'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none '
                    ) +
                    (isActive(item)
                      ? 'border-border bg-card text-heading'
                      : 'border-border text-muted hover:opacity-95')
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
                    'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none '
                  ) +
                  (isActive({ label: 'Notifications', href: '/dashboard/notifications', match: 'prefix' })
                    ? 'border-border bg-card text-heading'
                    : 'border-border text-muted hover:opacity-95')
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
