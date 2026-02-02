"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SiteTheme = 'light' | 'dark' | 'colorful';
type SiteThemeSetting = SiteTheme | null;

function normalizeTheme(theme: unknown): SiteThemeSetting {
  if (theme === null || theme === undefined || theme === '' || theme === 'default' || theme === 'system') return null;
  if (theme === 'light' || theme === 'dark' || theme === 'colorful') return theme;
  return null;
}

function requestThemeChange(theme: SiteThemeSetting) {
  try {
    window.dispatchEvent(new CustomEvent('arbix-theme-change', { detail: { theme, persist: 'clear', scope: 'site' } }));
  } catch {
    // ignore
  }
}

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [siteTheme, setSiteTheme] = useState<SiteThemeSetting>(null);
  const [themeLoading, setThemeLoading] = useState(false);

  const themeLabel = siteTheme === null ? 'Default' : siteTheme === 'colorful' ? 'Colorful' : siteTheme === 'dark' ? 'Dark' : 'Light';

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminUser");
      if (!stored) return;
      const obj = JSON.parse(stored);
      setAdminName(obj?.name || obj?.email || "");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    const loadTheme = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        setThemeLoading(true);
        const res = await fetch('/api/admin/site-theme', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => null);
        const theme = normalizeTheme(data?.theme);
        if (!cancelled) {
          setSiteTheme(theme);
          requestThemeChange(theme);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setThemeLoading(false);
      }
    };

    loadTheme();
    return () => {
      cancelled = true;
    };
  }, []);

  if ((pathname || "").startsWith("/admin/login")) return null;

  const handleLogout = () => {
    try {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    } catch {
      // ignore
    }
    router.push("/admin/login");
  };

  const handleToggleTheme = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const themeOrder: SiteThemeSetting[] = [null, 'light', 'dark', 'colorful'];
      const nextTheme = themeOrder[(themeOrder.indexOf(siteTheme) + 1) % themeOrder.length];
      setThemeLoading(true);

      const res = await fetch('/api/admin/site-theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme: nextTheme }),
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        const saved = normalizeTheme(data?.theme);
        setSiteTheme(saved);
        requestThemeChange(saved);
      }
    } catch {
      // ignore
    } finally {
      setThemeLoading(false);
    }
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navItems = [
    { label: "Overview", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Wallets", href: "/admin/user-wallets" },
    { label: "KYC", href: "/admin/kyc" },
    { label: "Withdrawals", href: "/admin/withdrawals" },
    { label: "Packages", href: "/admin/packages" },
    { label: "Trade Logs", href: "/admin/trades" },
    { label: "Notifications", href: "/admin/notifications" },
    { label: "Logs", href: "/admin/logs" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur shadow-theme-sm">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="relative flex items-center gap-2 group">
            <span className="absolute -inset-2 rounded-2xl bg-theme-hero-overlay opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-primary text-sm font-bold text-primary-fg shadow-theme-md animate-pulse [animation-duration:2.4s]">
              AX
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-heading">
                Arbix Admin
              </div>
              <div className="text-[11px] text-muted">
                Control Center for your platform
              </div>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 text-[11px] text-muted md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "group relative overflow-hidden rounded-lg px-3 py-2 transition-colors duration-200 " +
                (isActive(item.href)
                  ? "bg-card text-heading"
                  : "text-muted hover:text-heading")
              }
            >
              <span className="absolute inset-x-1 bottom-0 h-px translate-y-full bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right text-[11px] text-muted md:block">
            <div className="font-medium text-heading">
              {adminName || "Admin"}
            </div>
            <div className="text-subtle">Secure access</div>
          </div>
          <button
            type="button"
            onClick={handleToggleTheme}
            disabled={themeLoading}
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-1.5 text-[11px] text-muted transition-colors duration-150 hover:border-border2 hover:shadow-theme-sm disabled:opacity-60 md:inline-flex"
            aria-label="Toggle site theme"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center">
              {siteTheme === 'dark' ? (
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
            </span>
            <span>{themeLabel}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-[11px] font-medium text-danger transition-colors duration-150 hover:border-danger/60 hover:shadow-theme-sm md:inline-flex"
          >
            Logout
          </button>
          <Link
            href="/"
            className="hidden rounded-lg border border-border bg-surface/40 px-3 py-1.5 text-[11px] text-muted transition-colors duration-150 hover:border-border2 hover:shadow-theme-sm md:inline-flex"
          >
            View Site
          </Link>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={handleToggleTheme}
              disabled={themeLoading}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface/40 px-2 text-[11px] text-muted disabled:opacity-60"
              aria-label="Toggle site theme"
            >
              {themeLabel}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-border bg-surface/40 px-2 py-1 text-[11px] text-muted transition-colors duration-150 hover:border-border2 hover:shadow-theme-sm"
            >
              Site
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface/80 text-fg"
              aria-label="Toggle admin menu"
            >
              <span className="flex flex-col gap-0.5">
                <span
                  className={
                    "h-0.5 w-4 rounded bg-fg/70 transition-transform duration-200 " +
                    (mobileOpen ? "translate-y-[3px] rotate-45" : "")
                  }
                />
                <span
                  className={
                    "h-0.5 w-4 rounded bg-fg/70 transition-opacity duration-200 " +
                    (mobileOpen ? "opacity-0" : "opacity-100")
                  }
                />
                <span
                  className={
                    "h-0.5 w-4 rounded bg-fg/70 transition-transform duration-200 " +
                    (mobileOpen ? "-translate-y-[3px] -rotate-45" : "")
                  }
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/80 bg-surface md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <nav className="flex flex-col gap-1 text-[12px] text-fg">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "flex items-center justify-between rounded-md px-2 py-1.5 text-left " +
                    (isActive(item.href)
                      ? "bg-card text-heading"
                      : "text-muted hover:text-heading")
                  }
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted">
              <div>
                <div className="font-medium text-heading">
                  {adminName || "Admin"}
                </div>
                <div className="text-subtle">Secure access</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-[11px] font-medium text-danger transition-colors duration-150 hover:border-danger/60 hover:shadow-theme-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border/80 bg-surface/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[10px] text-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Live admin environment
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Monitor users, wallets &amp; payouts in real-time
            </span>
          </div>
          <span className="hidden text-[10px] text-subtle md:inline">
            Admin activity is logged for security &amp; compliance.
          </span>
        </div>
      </div>
    </header>
  );
}
