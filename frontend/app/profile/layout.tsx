'use client';

import DashboardHeader from '../components/DashboardHeader';
import RequireAuth from '../components/RequireAuth';
import DashboardAppShell from '../components/DashboardAppShell';
import type { ReactNode } from 'react';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardHeader />
      <DashboardAppShell>{children}</DashboardAppShell>
    </RequireAuth>
  );
}
