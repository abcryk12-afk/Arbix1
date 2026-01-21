'use client';

import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import RequireAuth from '../components/RequireAuth';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardHeader />
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-slate-50 network-grid-bg">
        <div className="relative arbix-page-enter">{children}</div>
        <DashboardFooter />
      </div>
    </RequireAuth>
  );
}
