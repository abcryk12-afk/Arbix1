'use client';

import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import RequireAuth from '../components/RequireAuth';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardHeader />
      {children}
      <DashboardFooter />
    </RequireAuth>
  );
}
