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
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-xs text-slate-400">Checking admin access...</div>
      </div>
    );
  }

  return <>{children}</>;
}
