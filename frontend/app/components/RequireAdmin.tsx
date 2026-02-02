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
      <div className="min-h-screen flex items-center justify-center bg-theme-page">
        <div className="relative flex flex-col items-center justify-center px-8">
          <div className="pointer-events-none absolute -inset-24 bg-theme-hero-overlay blur-3xl opacity-60" />

          <div className="relative flex flex-col items-center gap-6">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border-2 border-border/40" />
              <div className="absolute inset-1 rounded-full border-2 border-primary/50 border-t-primary animate-spin" />
              <div className="absolute inset-[18px] rounded-full bg-surface/90" />
              <div className="absolute left-1/2 top-[6px] h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-theme-sm" />
            </div>

            <div className="relative h-1.5 w-40 overflow-hidden rounded-full bg-muted border border-border shadow-theme-sm">
              <div className="loader-bar-inner absolute inset-y-0 w-1/3 rounded-full bg-primary" />
            </div>

            <div className="mt-1 text-center space-y-1">
              <p className="text-xs font-semibold tracking-[0.35em] text-muted uppercase">
                Loading Admin Panel
              </p>
              <p className="text-sm text-muted">
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
