'use client';

import RequireAdmin from '../components/RequireAdmin';
import AdminHeader from '../components/AdminHeader';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
      <AdminHeader />
      <div className="relative min-h-screen overflow-hidden bg-page text-fg network-grid-bg">
        <div className="relative arbix-page-enter">{children}</div>
      </div>
    </RequireAdmin>
  );
}
