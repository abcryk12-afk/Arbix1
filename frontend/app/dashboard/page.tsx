'use client';

import { useEffect, useMemo, useState } from 'react';

type Activity = {
  id: string;
  text: string;
  time: string;
};

type Announcement = {
  id: string;
  title: string;
  text: string;
};

type KpiCardProps = {
  href: string;
  label: string;
  value: string;
  subLabel: string;
  accentClassName: string;
  loading?: boolean;
};

function KpiCard({ href, label, value, subLabel, accentClassName, loading }: KpiCardProps) {
  return (
    <a
      href={href}
      className={
        'group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-all duration-200 ' +
        'hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/50 ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:transform-none'
      }
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700/70 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-slate-400">
            {label}
          </p>
          <p
            className={
              'mt-1 text-xl font-semibold leading-none text-slate-100 ' +
              (loading ? 'animate-pulse' : '')
            }
          >
            {value}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">{subLabel}</p>
        </div>
        <div
          className={
            'mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-slate-900/50 ' +
            accentClassName
          }
        />
      </div>
    </a>
  );
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [kpiHasAnimated, setKpiHasAnimated] = useState(false);
  const [kpiDisplay, setKpiDisplay] = useState({
    availableBalance: 0,
    todayEarnings: 0,
    networkToday: 0,
    totalEarnings: 0,
  });

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  }, []);

  const todayEarnings = 0;
  const networkToday = 0;
  const totalEarnings = 0;

  const myTradingToday = 0;
  const myTradingMonth = 0;
  const myTradingAll = 0;

  const networkMonth = 0;
  const networkAll = 0;

  const activePackagesCount = 0;
  const activeCapital = 0;
  const estimatedDailyProfit = 0;

  const l1Count = 0;
  const l2Count = 0;
  const l3Count = 0;
  const teamTodayEarnings = 0;

  const activities: Activity[] = [];
  const announcements: Announcement[] = [];

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setUserName(u?.name || u?.email || '');
        }
      } catch {
        // ignore
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const res = await fetch('/api/user/summary', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled) {
          if (data?.success) {
            setAvailableBalance(Number(data?.wallet?.balance || 0));
          } else {
            setAvailableBalance(0);
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setAvailableBalance(0);
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const teamTotal = l1Count + l2Count + l3Count;

  useEffect(() => {
    if (isLoading) return;

    const target = {
      availableBalance,
      todayEarnings,
      networkToday,
      totalEarnings,
    };

    if (prefersReducedMotion) {
      setKpiDisplay(target);
      return;
    }

    if (kpiHasAnimated) {
      setKpiDisplay(target);
      return;
    }

    setKpiHasAnimated(true);

    const durationMs = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const easeOut = 1 - Math.pow(1 - t, 3);

      setKpiDisplay({
        availableBalance: target.availableBalance * easeOut,
        todayEarnings: target.todayEarnings * easeOut,
        networkToday: target.networkToday * easeOut,
        totalEarnings: target.totalEarnings * easeOut,
      });

      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [
    availableBalance,
    isLoading,
    kpiHasAnimated,
    networkToday,
    prefersReducedMotion,
    todayEarnings,
    totalEarnings,
  ]);

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Welcome Block */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <p className="text-sm font-semibold text-slate-50">
            Welcome Back, {userName || 'User'} 👋 {isLoading ? <span className="text-[11px] text-slate-500">(loading...)</span> : null}
          </p>
          <p className="mt-1 text-xs text-slate-400 md:text-sm">
            Here&apos;s your overview for today.
          </p>
        </div>
      </section>

      {/* Top Summary Cards */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 sm:grid-cols-2 md:grid-cols-4">
            <KpiCard
              href="/dashboard/withdraw"
              label="Available Balance"
              value={isLoading ? '$--' : `$${kpiDisplay.availableBalance.toFixed(2)}`}
              subLabel="Ready to withdraw or invest"
              accentClassName="bg-emerald-400"
              loading={isLoading}
            />
            <KpiCard
              href="/dashboard/invest"
              label="My Today&apos;s Earnings"
              value={isLoading ? '$--' : `$${kpiDisplay.todayEarnings.toFixed(2)}`}
              subLabel="From trading & packages"
              accentClassName="bg-emerald-300"
              loading={isLoading}
            />
            <KpiCard
              href="/dashboard/team"
              label="Network Earnings Today"
              value={isLoading ? '$--' : `$${kpiDisplay.networkToday.toFixed(2)}`}
              subLabel="From your team activity"
              accentClassName="bg-violet-400"
              loading={isLoading}
            />
            <KpiCard
              href="/dashboard/invest"
              label="Total Earnings (All Time)"
              value={isLoading ? '$--' : `$${kpiDisplay.totalEarnings.toFixed(2)}`}
              subLabel="Trading + network combined"
              accentClassName="bg-sky-400"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* Earnings Breakdown */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid gap-3 text-xs text-slate-300 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold text-slate-100">
                My Trading Earnings
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-slate-400">Today</p>
                  <p className="font-semibold text-emerald-300">
                    ${myTradingToday.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">This Month</p>
                  <p className="font-semibold text-slate-100">
                    ${myTradingMonth.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">All Time</p>
                  <p className="font-semibold text-slate-100">
                    ${myTradingAll.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold text-slate-100">
                My Network Earnings
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-slate-400">Today</p>
                  <p className="font-semibold text-violet-300">
                    ${networkToday.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">This Month</p>
                  <p className="font-semibold text-slate-100">
                    ${networkMonth.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">All Time</p>
                  <p className="font-semibold text-slate-100">
                    ${networkAll.toFixed(2)}
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/team"
                className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-blue-400"
              >
                My Team &amp; Earnings
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Quick Actions
          </h2>
          <div className="mt-3 grid gap-3 text-xs text-slate-300 sm:grid-cols-2 md:grid-cols-4">
            <a
              href="/dashboard/deposit"
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 hover:border-slate-600"
            >
              Deposit Funds
            </a>
            <a
              href="/dashboard/invest"
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 hover:border-slate-600"
            >
              Start Investment
            </a>
            <a
              href="/dashboard/withdraw"
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 hover:border-slate-600"
            >
              Withdraw Funds
            </a>
            <a
              href="/dashboard/team"
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 hover:border-slate-600"
            >
              My Team &amp; Earnings
            </a>
          </div>
        </div>
      </section>

      {/* Active Packages Overview */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Active Packages Overview
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Total Active Packages</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {activePackagesCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Total Active Capital</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                ${activeCapital.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Estimated Daily Profit</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                ${estimatedDailyProfit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-[11px] text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="font-semibold text-slate-100">Gold • $500 • 3% daily</p>
              <p className="text-slate-400">Today&apos;s profit: $15.00 • Days left: 310</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="font-semibold text-slate-100">Silver • $100 • 2% daily</p>
              <p className="text-slate-400">Today&apos;s profit: $2.00 • Days left: 360</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="font-semibold text-slate-100">Starter • $50 • 1.5% daily</p>
              <p className="text-slate-400">Today&apos;s profit: $0.75 • Days left: 365</p>
            </div>
          </div>

          <a
            href="/dashboard/invest"
            className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-blue-400"
          >
            View All Investments
          </a>
        </div>
      </section>

      {/* Team Snapshot */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Team Snapshot
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 1</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">{l1Count}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 2</p>
              <p className="mt-1 text-lg font-semibold text-sky-400">{l2Count}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 3</p>
              <p className="mt-1 text-lg font-semibold text-violet-400">{l3Count}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Total Team</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{teamTotal}</p>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            <p>
              Today&apos;s Network Earnings:{' '}
              <span className="font-semibold text-violet-300">
                ${teamTodayEarnings.toFixed(2)}
              </span>
            </p>
            <p className="mt-1">
              Remember: for any referral with a package of $500 or more, you earn an
              extra 60% of their daily profit as a high-tier bonus.
            </p>
          </div>
          <a
            href="/dashboard/team"
            className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-blue-400"
          >
            My Team &amp; Earnings
          </a>
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Recent Activity
          </h2>
          <div className="mt-3 space-y-2 text-[11px] text-slate-300">
            {activities.length ? (
              activities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
                >
                  <p>{a.text}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{a.time}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-slate-400">
                No recent activity yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Announcements / Notifications */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Announcements &amp; Notifications
          </h2>
          <div className="mt-3 space-y-2 text-[11px] text-slate-300">
            {announcements.length ? (
              announcements.map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
                >
                  <p className="font-semibold text-slate-100">{n.title}</p>
                  <p className="mt-1 text-slate-400">{n.text}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-slate-400">
                No announcements right now.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Legal Strip */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 text-[11px] text-slate-500 md:text-xs">
          Trading involves market risk. Read{' '}
          <a href="/terms" className="text-slate-300 hover:text-slate-100">
            Terms
          </a>{' '}
          |{' '}
          <a href="/privacy" className="text-slate-300 hover:text-slate-100">
            Privacy
          </a>{' '}
          |{' '}
          <a
            href="/risk-disclosure"
            className="text-slate-300 hover:text-slate-100"
          >
            Risk Disclosure
          </a>
          .
        </div>
      </section>
    </div>
  );
}
