"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SiteTheme = 'light' | 'dark' | 'colorful' | 'aurora';
type SiteThemeSetting = SiteTheme | null;

const AURORA_TOKENS = [
  '--t-page',
  '--t-surface',
  '--t-surface-2',
  '--t-overlay',
  '--t-fg',
  '--t-heading',
  '--t-muted',
  '--t-subtle',
  '--t-border',
  '--t-border-2',
  '--t-ring',
  '--t-primary',
  '--t-primary-hover',
  '--t-on-primary',
  '--t-secondary',
  '--t-on-secondary',
  '--t-info',
  '--t-on-info',
  '--t-success',
  '--t-on-success',
  '--t-warning',
  '--t-on-warning',
  '--t-danger',
  '--t-on-danger',
  '--t-accent',
  '--t-on-accent',
  '--t-brand-1',
  '--t-brand-2',
  '--t-brand-3',
  '--t-white',
  '--t-shadow-rgb',
  '--t-dashboard-1',
  '--t-dashboard-2',
  '--t-dashboard-3',
  '--t-warning-deep',
  '--t-success-deep',
  '--t-danger-soft',
  '--t-danger-deep',
  '--t-border-soft',
] as const;

type AuroraToken = (typeof AURORA_TOKENS)[number];

function normalizeTheme(theme: unknown): SiteThemeSetting {
  if (theme === null || theme === undefined || theme === '' || theme === 'default' || theme === 'system') return null;
  if (theme === 'light' || theme === 'dark' || theme === 'colorful' || theme === 'aurora') return theme;
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

  const [auroraOverrides, setAuroraOverrides] = useState<Record<AuroraToken, string>>(() => {
    const out = {} as Record<AuroraToken, string>;
    for (const t of AURORA_TOKENS) out[t] = '';
    return out;
  });
  const [auroraLoading, setAuroraLoading] = useState(false);
  const [auroraSaving, setAuroraSaving] = useState(false);

  const themeLabel =
    siteTheme === null
      ? 'Default'
      : siteTheme === 'aurora'
        ? 'Aurora'
        : siteTheme === 'colorful'
          ? 'Colorful'
          : siteTheme === 'dark'
            ? 'Dark'
            : 'Light';

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

  useEffect(() => {
    let cancelled = false;

    const read = async () => {
      if (siteTheme !== 'aurora') return;

      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        setAuroraLoading(true);
        const res = await fetch('/api/admin/aurora-theme', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) return;

        const incoming = data?.overrides && typeof data.overrides === 'object' ? data.overrides : {};
        const next = {} as Record<AuroraToken, string>;
        for (const t of AURORA_TOKENS) {
          const v = (incoming as any)[t];
          next[t] = typeof v === 'string' ? v : '';
        }

        if (!cancelled) {
          setAuroraOverrides(next);
          for (const t of AURORA_TOKENS) {
            const v = next[t];
            if (v && document?.documentElement?.getAttribute('data-theme') === 'aurora') {
              document.documentElement.style.setProperty(t, v);
            }
          }
        }
      } catch {
      } finally {
        if (!cancelled) setAuroraLoading(false);
      }
    };

    read();
    return () => {
      cancelled = true;
    };
  }, [siteTheme]);

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

      const themeOrder: SiteThemeSetting[] = [null, 'light', 'dark', 'colorful', 'aurora'];
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
    { label: "CMS Pages", href: "/admin/cms-pages" },
    { label: "Site Settings", href: "/admin/site-settings" },
    { label: "SEO Settings", href: "/admin/seo-settings" },
  ];

  const rgbTripletToHex = (value: string) => {
    const raw = String(value || '').trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length !== 3) return null;
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
    const hex = nums
      .map((n) => Math.round(n).toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}`;
  };

  const readComputedTokenRgb = (token: AuroraToken) => {
    try {
      return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    } catch {
      return '';
    }
  };

  const hexToRgbTriplet = (hex: string) => {
    const raw = String(hex || '').trim();
    const m = raw.match(/^#?([0-9a-fA-F]{6})$/);
    if (!m) return null;
    const n = m[1];
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    if (![r, g, b].every((v) => Number.isFinite(v))) return null;
    return `${r} ${g} ${b}`;
  };

  const setTokenValue = (token: AuroraToken, rgbTriplet: string) => {
    setAuroraOverrides((prev) => {
      const next = { ...prev, [token]: rgbTriplet };
      return next;
    });

    try {
      if (document.documentElement.getAttribute('data-theme') === 'aurora') {
        document.documentElement.style.setProperty(token, rgbTriplet);
      }
    } catch {
    }
  };

  const handleSaveAurora = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      setAuroraSaving(true);

      const res = await fetch('/api/admin/aurora-theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ overrides: auroraOverrides }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) return;

      const incoming = data?.overrides && typeof data.overrides === 'object' ? data.overrides : {};
      const next = {} as Record<AuroraToken, string>;
      for (const t of AURORA_TOKENS) {
        const v = (incoming as any)[t];
        next[t] = typeof v === 'string' ? v : '';
      }
      setAuroraOverrides(next);
    } catch {
    } finally {
      setAuroraSaving(false);
    }
  };

  return (
    <div className="sticky top-0 z-50">
      <header className="border-b border-border bg-surface/90 backdrop-blur shadow-theme-sm">
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

      {siteTheme === 'aurora' && (
        <div className="border-b border-border bg-surface/70 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-heading">Aurora Theme Customizer</div>
                <div className="text-[11px] text-muted">Edit tokens live. Changes are saved only for the aurora theme.</div>
              </div>
              <button
                type="button"
                onClick={handleSaveAurora}
                disabled={auroraSaving || auroraLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-1.5 text-[11px] text-muted transition-colors duration-150 hover:shadow-theme-sm disabled:opacity-60"
              >
                {auroraSaving ? 'Saving…' : 'Save Aurora'}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {AURORA_TOKENS.map((token) => {
                const value = auroraOverrides[token] || '';
                const hex = rgbTripletToHex(value) || rgbTripletToHex(readComputedTokenRgb(token)) || rgbTripletToHex(readComputedTokenRgb('--t-page')) || '#000000';
                return (
                  <div key={token} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-medium text-heading">{token}</div>
                      <div className="truncate text-[10px] text-muted">{value || '—'}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => {
                          const rgb = hexToRgbTriplet(e.target.value);
                          if (!rgb) return;
                          setTokenValue(token, rgb);
                        }}
                        className="h-8 w-10 rounded-md border border-border bg-surface"
                        aria-label={`${token} color`}
                      />
                      <input
                        value={value}
                        onChange={(e) => setTokenValue(token, e.target.value)}
                        className="h-8 w-[120px] rounded-md border border-border bg-surface/60 px-2 text-[11px] text-fg"
                        placeholder="r g b"
                        aria-label={`${token} rgb`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
