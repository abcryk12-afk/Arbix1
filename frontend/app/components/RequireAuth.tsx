'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type RequireAuthProps = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/')}`);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/')}`);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          if (data?.success && data?.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          setIsAllowed(true);
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/')}`);
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
                Loading Dashboard
              </p>
              <p className="text-sm text-muted">
                Checking your secure session...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
