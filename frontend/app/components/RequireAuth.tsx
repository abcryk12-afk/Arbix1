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
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-xs text-slate-400">Checking session...</div>
      </div>
    );
  }

  return <>{children}</>;
}
