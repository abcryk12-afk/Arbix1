'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
    system: { daily: number; total: number; joiningsDaily?: number; joiningsTotal?: number };
    team: { daily: number; total: number; joiningsDaily?: number; joiningsTotal?: number };
    updatedAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [display, setDisplay] = useState({
    systemDailyWithdrawals: 0,
    systemTotalWithdrawals: 0,
    systemDailyJoinings: 0,
    systemTotalJoinings: 0,
  });
  const displayRef = useRef(display);
  const footerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  }, []);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

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

        const res = await fetch('/api/user/footer-demo-stats', {
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
    const interval = setInterval(run, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    setHasAnimated(false);
  }, [loading, stats?.updatedAt]);

  const systemDailyWithdrawals = Number(stats?.system?.daily ?? 0);
  const systemTotalWithdrawals = Number(stats?.system?.total ?? 0);
  const systemDailyJoinings = Number(stats?.system?.joiningsDaily ?? 0);
  const systemTotalJoinings = Number(stats?.system?.joiningsTotal ?? 0);

  const formatMoney = (n: number) => `$${n.toFixed(2)}`;
  const formatInt = (n: number) => Math.round(n).toLocaleString();
  const updatedLabel = loading
    ? 'Updating...'
    : stats?.updatedAt
      ? `Updated: ${new Intl.DateTimeFormat('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'UTC',
        }).format(new Date(stats.updatedAt))}`
      : 'Updated: just now';

  useEffect(() => {
    if (loading) return;

    const target = {
      systemDailyWithdrawals,
      systemTotalWithdrawals,
      systemDailyJoinings,
      systemTotalJoinings,
    };

    if (prefersReducedMotion) {
      setDisplay(target);
      setHasAnimated(true);
      return;
    }

    let raf = 0;
    const durationMs = hasAnimated ? 700 : 1400;
    const start = performance.now();
    const from = displayRef.current;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const easeOut = 1 - Math.pow(1 - t, 3);

      setDisplay({
        systemDailyWithdrawals: from.systemDailyWithdrawals + (target.systemDailyWithdrawals - from.systemDailyWithdrawals) * easeOut,
        systemTotalWithdrawals: from.systemTotalWithdrawals + (target.systemTotalWithdrawals - from.systemTotalWithdrawals) * easeOut,
        systemDailyJoinings: from.systemDailyJoinings + (target.systemDailyJoinings - from.systemDailyJoinings) * easeOut,
        systemTotalJoinings: from.systemTotalJoinings + (target.systemTotalJoinings - from.systemTotalJoinings) * easeOut,
      });

      if (t < 1) raf = requestAnimationFrame(tick);
      else setHasAnimated(true);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [
    loading,
    prefersReducedMotion,
    hasAnimated,
    systemDailyWithdrawals,
    systemTotalWithdrawals,
    systemDailyJoinings,
    systemTotalJoinings,
  ]);

  return (
    <footer
      ref={footerRef}
      className="mt-10 border-t border-slate-800 bg-gradient-to-b from-slate-900/60 via-slate-950/90 to-slate-950"
    >
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-slate-100">Arbix Overview</div>
            <div className="mt-1 text-[11px] text-slate-400">
              System performance snapshot
            </div>
          </div>
          <div className="text-[11px] text-slate-500">{updatedLabel}</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="Daily Withdrawals (System)"
            value={formatMoney(display.systemDailyWithdrawals)}
            subLabel="All users today"
            accentClassName="bg-emerald-400"
            loading={loading}
          />
          <StatCard
            label="Total Withdrawals (System)"
            value={formatMoney(display.systemTotalWithdrawals)}
            subLabel="All-time"
            accentClassName="bg-slate-300"
            loading={loading}
          />
          <StatCard
            label="Daily Joinings (System)"
            value={formatInt(display.systemDailyJoinings)}
            subLabel="All users today"
            accentClassName="bg-violet-400"
            loading={loading}
          />
          <StatCard
            label="Total Joinings (System)"
            value={formatInt(display.systemTotalJoinings)}
            subLabel="All users all-time"
            accentClassName="bg-sky-400"
            loading={loading}
          />
        </div>

        <div className="mt-6 border-t border-slate-800/80 pt-4 text-[11px] text-slate-500">
          © 2026 Arbix. Dashboard area.
        </div>
      </div>
    </footer>
  );
}
