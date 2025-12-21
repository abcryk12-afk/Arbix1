'use client';

import { useEffect, useState } from 'react';

type StatCardProps = {
  label: string;
  value: string;
  subLabel: string;
};

function StatCard({ label, value, subLabel }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{subLabel}</div>
    </div>
  );
}

export default function DashboardFooter() {
  const [stats, setStats] = useState<{
    system: { daily: number; total: number };
    team: { daily: number; total: number };
    updatedAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (!cancelled) {
            setStats(null);
            setLoading(false);
          }
          return;
        }

        const res = await fetch('/api/user/footer-stats', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled) {
          if (data?.success && data?.stats) {
            setStats(data.stats);
          } else {
            setStats(null);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const systemDailyWithdrawals = stats?.system?.daily ?? 0;
  const systemTotalWithdrawals = stats?.system?.total ?? 0;
  const teamDailyWithdrawals = stats?.team?.daily ?? 0;
  const teamTotalWithdrawals = stats?.team?.total ?? 0;
  const updatedLabel = loading
    ? 'Updating...'
    : stats?.updatedAt
      ? `Updated: ${new Date(stats.updatedAt).toLocaleString()}`
      : 'Updated: just now';

  return (
    <footer className="mt-10 border-t border-slate-800 bg-slate-950/95">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-slate-100">Arbix Dashboard</div>
            <div className="mt-1 text-[11px] text-slate-400">
              System &amp; team withdrawal overview
            </div>
          </div>
          <div className="text-[11px] text-slate-500">{updatedLabel}</div>
        </div>

        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Daily Withdrawals (System)"
            value={`$${systemDailyWithdrawals.toFixed(2)}`}
            subLabel="All users today"
          />
          <StatCard
            label="Total Withdrawals (System)"
            value={`$${systemTotalWithdrawals.toFixed(2)}`}
            subLabel="All-time"
          />
          <StatCard
            label="Daily Withdrawals (Team)"
            value={`$${teamDailyWithdrawals.toFixed(2)}`}
            subLabel="Your network today"
          />
          <StatCard
            label="Total Withdrawals (Team)"
            value={`$${teamTotalWithdrawals.toFixed(2)}`}
            subLabel="Your network all-time"
          />
        </div>

        <div className="mt-5 border-t border-slate-800 pt-4 text-[11px] text-slate-500">
          © 2023 Arbix. Dashboard area.
        </div>
      </div>
    </footer>
  );
}
