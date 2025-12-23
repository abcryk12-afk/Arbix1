'use client';

import RequireAdmin from '../components/RequireAdmin';
import AdminHeader from '../components/AdminHeader';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
      <AdminHeader />
      {children}
    </RequireAdmin>
  );
}
