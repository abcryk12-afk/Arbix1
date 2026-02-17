'use client';

import { useEffect, useState } from 'react';
import DashboardBottomNav from './DashboardBottomNav';

type Props = {
  children: React.ReactNode;
};

export default function DashboardAppShell({ children }: Props) {
  const [showSplash, setShowSplash] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/public/site-assets', { method: 'GET', cache: 'no-store' });
        const data = await res.json().catch(() => null);
        const nextUrl = data?.success ? (data?.assets?.logo?.url || null) : null;
        if (!cancelled) setLogoUrl(nextUrl);
      } catch {
        if (!cancelled) setLogoUrl(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const key = 'arbix_dashboard_splash_seen_v1';
      const seen = sessionStorage.getItem(key);
      if (seen === '1') return;
      sessionStorage.setItem(key, '1');
      setShowSplash(true);
      const t = window.setTimeout(() => setShowSplash(false), 700);
      return () => window.clearTimeout(t);
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden text-fg network-grid-bg arbix-dashboard-bg">
        <div className="relative pb-24 arbix-page-enter">{children}</div>
      </div>
      <DashboardBottomNav />

      {showSplash ? (
        <div className="pointer-events-none fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-theme-page" />
          <div className="absolute inset-0 bg-theme-hero-overlay opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="arbix-card flex flex-col items-center justify-center rounded-3xl px-10 py-10 shadow-theme-lg">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Arbix" className="h-12 w-12 object-contain" />
                ) : (
                  <span className="text-2xl font-extrabold">AX</span>
                )}
              </div>
              <div className="mt-4 text-sm font-semibold tracking-tight text-heading">Arbix</div>
              <div className="mt-1 text-[11px] text-muted">Loading your dashboard…</div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
