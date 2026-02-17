'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch('/api/public/site-assets', { method: 'GET', cache: 'no-store' });
        const data = await res.json().catch(() => null);
        const nextLogo = data?.success ? (data?.assets?.logo?.url || null) : null;
        if (!cancelled) setLogoUrl(nextLogo);
      } catch {
        if (!cancelled) setLogoUrl(null);
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (!cancelled) setChecking(false);
          return;
        }

        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!cancelled && res.ok) {
          router.replace('/dashboard');
          return;
        }
      } catch {
        // ignore
      }

      if (!cancelled) setChecking(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-theme-page flex items-center justify-center">
        <div className="arbix-card rounded-3xl px-8 py-8 shadow-theme-lg">
          <div className="text-sm font-semibold text-heading">Opening Arbix…</div>
          <div className="mt-1 text-[11px] text-muted">Checking your session</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-page text-fg">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-info/20 to-secondary/25" />
        <div className="absolute inset-0 opacity-70 bg-theme-hero-overlay" />

        <div className="relative mx-auto max-w-md px-5 pt-14 pb-24">
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 rounded-[28px] bg-surface/85 border border-border shadow-theme-md flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Arbix" className="h-14 w-14 object-contain" />
              ) : (
                <span className="text-2xl font-extrabold text-heading">AX</span>
              )}
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight text-heading">Arbix</div>
            <div className="mt-1 text-[12px] text-muted">Welcome</div>
          </div>
        </div>

        <svg
          className="absolute bottom-[-1px] left-0 right-0 w-full"
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
        >
          <path
            fill="rgb(var(--t-page))"
            d="M0,160 C240,220 480,220 720,160 C960,100 1200,100 1440,160 L1440,240 L0,240 Z"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-md px-5 -mt-14 pb-12">
        <div className="arbix-card rounded-3xl p-5 shadow-theme-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-heading">Welcome back!</div>
            <div className="mt-1 text-[12px] text-muted">Login or create your account to continue</div>
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => router.push('/auth/signup')}
              className="m3-ripple w-full rounded-2xl bg-theme-primary px-4 py-3 text-[13px] font-semibold text-primary-fg shadow-theme-md transition hover:shadow-theme-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
            >
              Create Account
            </button>

            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="m3-ripple w-full rounded-2xl border border-border bg-surface/50 px-4 py-3 text-[13px] font-semibold text-heading shadow-theme-sm transition hover:shadow-theme-md focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
            >
              Login
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <div className="text-[10px] uppercase tracking-[0.22em] text-subtle">Secure</div>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="mt-4 text-center text-[11px] text-muted">
            SSL Protected • Encrypted Login
          </div>
        </div>
      </div>
    </div>
  );
}
