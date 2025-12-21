'use client';

import { useEffect, useState } from 'react';

type StatCardProps = {
  label: string;
  value: string;
  subLabel: string;
  accentClassName?: string;
  loading?: boolean;
};

function StatCard({ label, value, subLabel, accentClassName, loading }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/50 motion-reduce:transform-none">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700/70 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-400">{label}</div>
          <div
            className={
              'mt-1 text-lg font-semibold text-slate-100 ' +
              (loading ? 'animate-pulse' : '')
            }
          >
            {value}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">{subLabel}</div>
        </div>
        <div className={
          'mt-1 h-2.5 w-2.5 rounded-full ring-4 ring-slate-900/50 ' +
          (accentClassName || 'bg-slate-600')
        } />
      </div>
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
    <footer className="mt-10 border-t border-slate-800 bg-gradient-to-b from-slate-950/80 via-slate-950/95 to-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-slate-100">Arbix Dashboard</div>
            <div className="mt-1 text-[11px] text-slate-400">
              System &amp; team withdrawal overview
            </div>
          </div>
          <div className="text-[11px] text-slate-500">{updatedLabel}</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="Daily Withdrawals (System)"
            value={`$${systemDailyWithdrawals.toFixed(2)}`}
            subLabel="All users today"
            accentClassName="bg-emerald-400"
            loading={loading}
          />
          <StatCard
            label="Total Withdrawals (System)"
            value={`$${systemTotalWithdrawals.toFixed(2)}`}
            subLabel="All-time"
            accentClassName="bg-slate-300"
            loading={loading}
          />
          <StatCard
            label="Daily Withdrawals (Team)"
            value={`$${teamDailyWithdrawals.toFixed(2)}`}
            subLabel="Your network today"
            accentClassName="bg-violet-400"
            loading={loading}
          />
          <StatCard
            label="Total Withdrawals (Team)"
            value={`$${teamTotalWithdrawals.toFixed(2)}`}
            subLabel="Your network all-time"
            accentClassName="bg-sky-400"
            loading={loading}
          />
        </div>

        <div className="mt-6 border-t border-slate-800/80 pt-4 text-[11px] text-slate-500">
          © 2023 Arbix. Dashboard area.
        </div>
      </div>
    </footer>
  );
}
