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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative flex flex-col items-center justify-center px-6">
          <div className="pointer-events-none absolute -inset-20 bg-gradient-to-br from-emerald-500/25 via-cyan-500/10 to-sky-500/25 blur-3xl opacity-70 animate-pulse" />

          <div className="relative flex flex-col items-center">
            <div className="absolute -top-2 inset-x-0 mx-auto h-1 w-28 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300 opacity-90 shadow-[0_0_25px_rgba(56,189,248,0.8)]" />

            <div className="relative h-20 w-20 rounded-[30px] border border-emerald-400/50 bg-slate-950/70 shadow-[0_0_40px_rgba(16,185,129,0.7),0_0_60px_rgba(56,189,248,0.6)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-[3px] rounded-[26px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950" />

              <div className="relative h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-400 to-cyan-300 animate-spin shadow-[0_0_30px_rgba(16,185,129,0.9)]" />
            </div>

            <div className="mt-6 text-center space-y-1">
              <p className="text-xs font-semibold tracking-[0.35em] text-emerald-300/80 uppercase">
                Loading Dashboard
              </p>
              <p className="text-sm text-slate-300/90">
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
