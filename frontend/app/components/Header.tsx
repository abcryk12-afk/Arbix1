"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'colorful' | 'aurora'>('light');
  const [themeLoading, setThemeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/public/site-assets', { method: 'GET', cache: 'no-store' });
        const data = await res.json().catch(() => null);
        const nextUrl = data?.success ? (data?.assets?.logo?.url || null) : null;
        if (!cancelled) setLogoDataUrl(nextUrl);
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
      const next = t === 'light' || t === 'dark' || t === 'colorful' || t === 'aurora' ? t : 'light';
      setTheme(next);
    };

    read();
    const observer = new MutationObserver(() => read());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/admin")
  )
    return null;

  const menuItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Profit Plan", href: "/plans" },
    { name: "Education", href: "/education" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
    { name: "Login", href: "/auth/login" },
    { name: "Join Now", href: "/auth/signup" },
  ];

  const requestThemeChange = (nextTheme: 'light' | 'dark' | 'colorful' | 'aurora', persist: 'override' | 'clear') => {
    try {
      window.dispatchEvent(new CustomEvent('arbix-theme-change', { detail: { theme: nextTheme, persist } }));
    } catch {
      // ignore
    }
  };

  const handleToggleTheme = async () => {
    const themeOrder: Array<'light' | 'dark' | 'colorful' | 'aurora'> = ['light', 'dark', 'colorful', 'aurora'];
    const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length] || 'light';
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
          requestThemeChange(nextTheme, 'override');
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
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur shadow-theme-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          {/* Logo + brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-fg overflow-hidden shadow-theme-sm">
              {logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDataUrl} alt="Arbix" className="h-9 w-9 object-contain" />
              ) : (
                'AX'
              )}
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-heading">Arbix</div>
              <div className="text-[11px] text-muted">
                Automated Arbitrage &amp; Passive Income Platform
              </div>
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-5 text-xs font-medium text-muted md:flex">
            <a href="/" className="hover:text-heading">Home</a>
            <a href="/about" className="hover:text-heading">About</a>
            <a href="/how-it-works" className="hover:text-heading">How It Works</a>
            <a href="/plans" className="hover:text-heading">Profit Plan</a>
            <a href="/education" className="hover:text-heading">Education</a>
            <a href="/testimonials" className="hover:text-heading">Testimonials</a>
            <a href="/faq" className="hover:text-heading">FAQ</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 text-xs md:flex md:text-sm">
            <button
              type="button"
              onClick={handleToggleTheme}
              disabled={themeLoading}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface/40 p-2 text-fg transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 disabled:opacity-60"
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
            <a
              href="/contact"
              className="hidden items-center gap-1 text-[11px] text-muted hover:text-heading md:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Need Help?
            </a>
            <a
              href="/auth/login"
              className="hidden rounded-lg border border-border px-3 py-1.5 text-muted transition hover:opacity-95 md:inline-block"
            >
              Login
            </a>
            <a
              href="/auth/signup"
              className="rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-fg shadow-theme-sm hover:shadow-theme-md"
            >
              Join Now
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg bg-primary p-2 text-primary-fg hover:shadow-theme-md md:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
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

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border bg-surface md:hidden">
            <div className="px-4 py-4">
              <button
                type="button"
                onClick={handleToggleTheme}
                disabled={themeLoading}
                className="mb-3 flex w-full items-center justify-between rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm font-medium text-fg transition-colors duration-150 hover:shadow-theme-sm hover:opacity-95 disabled:opacity-60"
              >
                <span>Theme</span>
                <span className="inline-flex items-center gap-2 text-xs text-muted">
                  {theme === 'dark' ? 'Dark' : theme === 'colorful' ? 'Colorful' : theme === 'aurora' ? 'Aurora' : 'Light'}
                  <span className="inline-flex h-4 w-4 items-center justify-center">
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
                  </span>
                </span>
              </button>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      item.name === "Join Now"
                        ? "bg-primary text-primary-fg hover:shadow-theme-md"
                      : item.name === "Login"
                        ? "border border-border text-muted hover:opacity-95"
                      : "text-muted hover:text-heading"
                    }`}
                  >
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="border-t border-border/60 bg-surface/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[10px] text-muted">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> SSL Secured
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-info" /> KYC Compliant
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" /> 24/7 Support
              </span>
            </div>
            <span className="hidden text-[10px] text-subtle md:inline">
              Trusted arbitrage engine for global investors
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
