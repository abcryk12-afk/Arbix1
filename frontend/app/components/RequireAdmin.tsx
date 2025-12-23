'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type RequireAdminProps = {
  children: React.ReactNode;
};

export default function RequireAdmin({ children }: RequireAdminProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if ((pathname || '').startsWith('/admin/login')) {
        if (!cancelled) setIsAllowed(true);
        return;
      }

      const token = localStorage.getItem('adminToken');

      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const res = await fetch('/api/admin/check', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.replace('/admin/login');
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          if (data?.success) {
            setIsAllowed(true);
            return;
          }
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.replace('/admin/login');
        }
      } catch (e) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.replace('/admin/login');
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative flex flex-col items-center justify-center px-8">
          <div className="pointer-events-none absolute -inset-24 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.35),transparent_60%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.38),transparent_55%)] blur-3xl opacity-90" />

          <div className="relative flex flex-col items-center gap-6">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border border-emerald-400/40 shadow-[0_0_42px_rgba(16,185,129,0.75)]" />
              <div className="absolute inset-4 rounded-full border border-sky-400/50 blur-[1px] opacity-80" />
              <div className="loader-orbit absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,rgba(56,189,248,0.12),rgba(16,185,129,0.7),rgba(56,189,248,0.12))] opacity-90" />
              <div className="absolute inset-[18px] rounded-full bg-slate-950/95" />
              <div className="absolute left-1/2 top-[6px] h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.95)]" />
            </div>

            <div className="relative h-1.5 w-40 overflow-hidden rounded-full bg-slate-900/90 border border-slate-700/80 shadow-[0_0_26px_rgba(15,23,42,0.95)]">
              <div className="loader-bar-inner absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.9)]" />
            </div>

            <div className="mt-1 text-center space-y-1">
              <p className="text-xs font-semibold tracking-[0.35em] text-emerald-300/80 uppercase">
                Loading Admin Panel
              </p>
              <p className="text-sm text-slate-300/90">
                Checking your admin access...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
