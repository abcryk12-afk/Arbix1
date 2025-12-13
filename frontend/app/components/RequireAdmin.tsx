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
      const token = localStorage.getItem('token');

      if (!token) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/')}`);
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
          router.replace('/dashboard');
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          if (data?.success) {
            setIsAllowed(true);
            return;
          }
          router.replace('/dashboard');
        }
      } catch (e) {
        router.replace('/dashboard');
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
        <div className="text-xs text-slate-400">Checking admin access...</div>
      </div>
    );
  }

  return <>{children}</>;
}
