'use client';

import { useEffect, useMemo, useState } from 'react';

type Activity = {
  id: string;
  label: string;
  description: string;
  amount: number;
  direction: 'in' | 'out' | 'neutral';
  createdAt: string;
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
        'group relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9)] transition-all duration-200 ' +
        'hover:-translate-y-1 hover:border-emerald-400/80 hover:bg-slate-900/90 hover:shadow-[0_0_45px_rgba(45,212,191,0.55)] ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 motion-reduce:transform-none'
      }
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/40 via-sky-500/80 to-cyan-400/40" />
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

type MiniStatCardProps = {
  label: string;
  value: number;
  accentClassName: string;
};

function MiniStatCard({ label, value, accentClassName }: MiniStatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3 shadow-[0_0_0_1px_rgba(15,23,42,0.9)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/80 hover:bg-slate-900/90 hover:shadow-[0_0_45px_rgba(45,212,191,0.55)] motion-reduce:transform-none">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/40 via-sky-500/80 to-cyan-400/40" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-lg font-semibold leading-none text-slate-100">
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={
            'mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-slate-900/50 ' +
            accentClassName
          }
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [teamCounts, setTeamCounts] = useState({ l1: 0, l2: 0, l3: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitySummary, setActivitySummary] = useState<{ todayByLevel: { l1: number; l2: number; l3: number } } | null>(null);
  const [activityPage, setActivityPage] = useState(0);
  const [kpiHasAnimated, setKpiHasAnimated] = useState(false);
  const [kpiDisplay, setKpiDisplay] = useState({
    totalCapital: 0,
    activeCapital: 0,
    todayEarnings: 0,
    networkToday: 0,
    totalEarnings: 0,
  });

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  }, []);

  const [todayEarnings, setTodayEarnings] = useState(0);
  const [networkToday, setNetworkToday] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [myTradingToday, setMyTradingToday] = useState(0);
  const myTradingMonth = 0;
  const [myTradingAll, setMyTradingAll] = useState(0);

  const networkMonth = 0;
  const [networkAll, setNetworkAll] = useState(0);

  const [activePackagesCount, setActivePackagesCount] = useState(0);
  const [totalCapital, setTotalCapital] = useState(0);
  const [activeCapital, setActiveCapital] = useState(0);
  const [estimatedDailyProfit, setEstimatedDailyProfit] = useState(0);

  const l1Count = teamCounts.l1;
  const l2Count = teamCounts.l2;
  const l3Count = teamCounts.l3;
  const teamTodayEarnings = networkToday;

  const activityPageSize = 8;
  const activityPageCount = Math.max(1, Math.ceil(activities.length / activityPageSize));
  const visibleActivities = activities.slice(
    activityPage * activityPageSize,
    activityPage * activityPageSize + activityPageSize,
  );

  useEffect(() => {
    if (activityPage <= 0) return;
    if (activityPage * activityPageSize < activities.length) return;
    setActivityPage(0);
  }, [activities.length, activityPage]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let myTradingTodayValue = 0;
      let myTradingAllValue = 0;
      let networkTodayValue = 0;
      let networkAllValue = 0;

      const token = localStorage.getItem('token');
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

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
        const res = await fetch('/api/user/summary', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled) {
          if (data?.success) {
            setWalletBalance(Number(data?.wallet?.balance || 0));
          } else {
            setWalletBalance(0);
          }
        }
      } catch {
        if (!cancelled) setWalletBalance(0);
      }

      try {
        const res = await fetch('/api/user/referrals', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled && data?.success && data?.counts) {
          setTeamCounts({
            l1: Number(data.counts?.l1 || 0),
            l2: Number(data.counts?.l2 || 0),
            l3: Number(data.counts?.l3 || 0),
          });
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch('/api/user/packages', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const packagesData = await res.json();
        if (!cancelled && packagesData?.success && Array.isArray(packagesData?.packages)) {
          const active = packagesData.packages.filter((p: any) => p?.status === 'active');

          setActivePackagesCount(active.length);

          const totalCapAll = packagesData.packages.reduce(
            (sum: number, p: any) => sum + Number(p.capital || 0),
            0,
          );
          setTotalCapital(totalCapAll);

          const totalCap = active.reduce(
            (sum: number, p: any) => sum + Number(p.capital || 0),
            0,
          );
          setActiveCapital(totalCap);

          const totalDaily = active.reduce(
            (sum: number, p: any) =>
              sum + (Number(p.capital || 0) * Number(p.dailyRoi || 0)) / 100,
            0,
          );
          setEstimatedDailyProfit(totalDaily);

          myTradingTodayValue = totalDaily;

          const totalEarnedAll = packagesData.packages.reduce(
            (sum: number, p: any) => sum + Number(p.totalEarned || 0),
            0,
          );
          myTradingAllValue = totalEarnedAll;
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch('/api/user/referral-earnings', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const earningsData = await res.json();
        if (!cancelled && earningsData?.success && earningsData?.earnings) {
          networkTodayValue = Number(earningsData.earnings?.today || 0);
          networkAllValue = Number(earningsData.earnings?.allTime || 0);
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch('/api/user/activity?limit=30', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled && data?.success && Array.isArray(data?.items)) {
          const toDisplayName = (u: any) => u?.name || u?.email || (u?.id ? `User #${u.id}` : 'Unknown user');
          const shortAddress = (addr: string) => {
            const a = String(addr || '');
            if (a.length <= 16) return a;
            return `${a.slice(0, 10)}...${a.slice(-6)}`;
          };

          setActivitySummary(data?.summary?.todayByLevel ? { todayByLevel: data.summary.todayByLevel } : null);

          const mapped: Activity[] = data.items.map((it: any) => {
            if (it.kind === 'transaction') {
              const from = it.fromUser ? toDisplayName(it.fromUser) : '';
              const level = it.level ? `L${it.level}` : '';
              const extra = level && from ? `${level} from ${from}` : level ? level : from ? `from ${from}` : '';
              const description = extra || (it.note ? String(it.note) : '');
              return {
                id: String(it.id),
                label: String(it.label || 'Transaction'),
                description,
                amount: Number(it.amount || 0),
                direction: (it.direction === 'in' || it.direction === 'out') ? it.direction : 'neutral',
                createdAt: String(it.createdAt),
              };
            }

            if (it.kind === 'deposit_request') {
              return {
                id: String(it.id),
                label: 'Deposit Request',
                description: `${String(it.status || '').toUpperCase()} • Send USDT to ${shortAddress(it.address)}`,
                amount: Number(it.amount || 0),
                direction: 'neutral',
                createdAt: String(it.createdAt),
              };
            }

            if (it.kind === 'withdrawal_request') {
              return {
                id: String(it.id),
                label: 'Withdrawal Request',
                description: `${String(it.status || '').toUpperCase()} • To ${shortAddress(it.address)}`,
                amount: Number(it.amount || 0),
                direction: 'neutral',
                createdAt: String(it.createdAt),
              };
            }

            return {
              id: String(it.id || Math.random()),
              label: 'Activity',
              description: '',
              amount: Number(it.amount || 0),
              direction: 'neutral',
              createdAt: String(it.createdAt || new Date().toISOString()),
            };
          });

          setActivities(mapped);
        }
      } catch {
        // ignore
      }

      if (!cancelled) {
        setMyTradingToday(myTradingTodayValue);
        setMyTradingAll(myTradingAllValue);
        setNetworkToday(networkTodayValue);
        setNetworkAll(networkAllValue);
        setTodayEarnings(myTradingTodayValue);
        setTotalEarnings(myTradingAllValue + networkAllValue);
        setIsLoading(false);
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
      totalCapital,
      activeCapital,
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
        totalCapital: target.totalCapital * easeOut,
        activeCapital: target.activeCapital * easeOut,
        todayEarnings: target.todayEarnings * easeOut,
        networkToday: target.networkToday * easeOut,
        totalEarnings: target.totalEarnings * easeOut,
      });

      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [
    activeCapital,
    isLoading,
    kpiHasAnimated,
    networkToday,
    prefersReducedMotion,
    totalCapital,
    todayEarnings,
    totalEarnings,
  ]);

  return (
    <div className="bg-transparent text-slate-50">
      {/* Welcome Block */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <p className="text-sm font-semibold text-slate-50">
            Welcome Back, {userName || 'User'} 👋 {isLoading ? <span className="text-[11px] text-slate-500">(loading...)</span> : null}
          </p>
          <p className="mt-1 text-xs text-slate-400 md:text-sm">
            Here&apos;s your overview for today.
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 sm:gap-3">
            <a
              href="/dashboard/deposit"
              className={
                'arbix-card arbix-3d relative overflow-hidden rounded-2xl p-3 transition-all duration-200 ' +
                'hover:-translate-y-0.5 motion-reduce:transform-none'
              }
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/55 to-transparent" />
              <p className="text-[10px] font-semibold tracking-wide text-slate-400">TOTAL USER BALANCE</p>
              <p className={"mt-1 text-sm font-semibold text-slate-100 " + (isLoading ? 'animate-pulse' : '')}>
                {isLoading ? '$--' : `$${Number(walletBalance || 0).toFixed(2)}`}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">Wallet balance</p>
            </a>

            <a
              href="/dashboard/deposit"
              className={
                'arbix-card arbix-3d arbix-3d-emerald arbix-shine group relative overflow-hidden rounded-2xl p-3 text-center transition-all duration-200 ' +
                'hover:-translate-y-0.5 hover:shadow-[0_0_45px_rgba(45,212,191,0.45)] motion-reduce:transform-none'
              }
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
              <p className="text-[10px] font-semibold tracking-wide text-slate-400">DEPOSIT</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">Add Funds</p>
              <p className="mt-1 text-[10px] text-slate-500">USDT (BEP20)</p>
            </a>

            <a
              href="/dashboard/withdraw"
              className={
                'arbix-card arbix-3d arbix-3d-red arbix-shine arbix-shine-red group relative overflow-hidden rounded-2xl p-3 text-center transition-all duration-200 ' +
                'hover:-translate-y-0.5 hover:shadow-[0_0_45px_rgba(248,113,113,0.40)] motion-reduce:transform-none'
              }
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/70 to-transparent" />
              <p className="text-[10px] font-semibold tracking-wide text-slate-400">WITHDRAW</p>
              <p className="mt-1 text-sm font-semibold text-rose-300">Cash Out</p>
              <p className="mt-1 text-[10px] text-slate-500">To wallet</p>
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 md:py-4">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
            <a
              href="/dashboard/invest"
              className={
                'arbix-card arbix-3d arbix-3d-emerald arbix-shine arbix-shine-active arbix-card-emerald group relative overflow-hidden rounded-xl p-3 transition-all duration-200 ' +
                'hover:-translate-y-0.5 motion-reduce:transform-none'
              }
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
              <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/14 blur-3xl animate-pulse" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 h-44 w-44 rounded-full bg-sky-500/12 blur-3xl animate-pulse" />
              <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300/70">ACTIVE</p>
              <p className="mt-1 text-[12px] font-semibold text-emerald-200">🚀 Start Investment</p>
              <p className="mt-1 text-[10px] text-slate-300/75">Buy a package &amp; start earning.</p>
              <div className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[10px] font-semibold text-emerald-100 ring-1 ring-emerald-400/25 transition group-hover:bg-emerald-500/20">
                🚀 Invest Now
              </div>
            </a>

            <a
              href="/dashboard/daily-rewards"
              className={
                'arbix-card arbix-3d arbix-3d-amber arbix-shine arbix-shine-active arbix-shine-amber arbix-card-amber group relative overflow-hidden rounded-xl p-3 transition-all duration-200 ' +
                'hover:-translate-y-0.5 motion-reduce:transform-none'
              }
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
              <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-amber-400/13 blur-3xl animate-pulse" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 h-44 w-44 rounded-full bg-violet-500/11 blur-3xl animate-pulse" />
              <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300/70">BONUS</p>
              <p className="mt-1 text-[12px] font-semibold text-amber-200">🎁 Daily Check-in</p>
              <p className="mt-1 text-[10px] text-slate-300/75">Claim bonus every 24 hours.</p>
              <div className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-amber-500/15 px-3 py-1.5 text-[10px] font-semibold text-amber-100 ring-1 ring-amber-300/25 transition group-hover:bg-amber-500/20">
                🎁 Open Daily Bonus
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Top Summary Cards */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 sm:grid-cols-2 md:grid-cols-4">
            <KpiCard
              href="/dashboard/invest"
              label="Today Earnings"
              value={isLoading ? '$--' : `$${kpiDisplay.todayEarnings.toFixed(2)}`}
              subLabel="Estimated from your active packages"
              accentClassName="bg-emerald-400"
              loading={isLoading}
            />
            <KpiCard
              href="/dashboard/invest"
              label="Total Active Capital"
              value={isLoading ? '$--' : `$${kpiDisplay.activeCapital.toFixed(2)}`}
              subLabel="Capital in active packages"
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
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid gap-3 text-xs text-slate-300 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/80 hover:bg-slate-900/90 hover:shadow-[0_0_45px_rgba(45,212,191,0.55)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/40 via-sky-500/80 to-cyan-400/40" />
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

            <div className="group relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9)] transition-all duration-200 hover:-translate-y-1 hover:border-sky-500/80 hover:bg-slate-900/90 hover:shadow-[0_0_40px_rgba(56,189,248,0.55)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/70 to-transparent" />
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

      {/* Active Packages Overview */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Active Packages Overview
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/60">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-80" />
              <p className="text-[11px] text-slate-400">Total Active Packages</p>
              <p className="mt-1 text-base font-semibold text-slate-100 sm:text-lg">
                {activePackagesCount}
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/60">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent opacity-80" />
              <p className="text-[11px] text-slate-400">Total Active Capital</p>
              <p className="mt-1 text-base font-semibold text-slate-100 sm:text-lg">
                ${activeCapital.toFixed(2)}
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/60">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent opacity-80" />
              <p className="text-[11px] text-slate-400">Estimated Daily Profit</p>
              <p className="mt-1 text-base font-semibold text-emerald-400 sm:text-lg">
                ${estimatedDailyProfit.toFixed(2)}
              </p>
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
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Team Snapshot
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStatCard label="Level 1" value={l1Count} accentClassName="bg-emerald-400" />
            <MiniStatCard label="Level 2" value={l2Count} accentClassName="bg-sky-400" />
            <MiniStatCard label="Level 3" value={l3Count} accentClassName="bg-violet-400" />
            <MiniStatCard label="Total Team" value={teamTotal} accentClassName="bg-slate-300" />
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
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Recent Activity
          </h2>
          {activitySummary ? (
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-slate-400">Today L1</div>
                <div className="mt-1 font-semibold text-emerald-300">${Number(activitySummary.todayByLevel.l1 || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-slate-400">Today L2</div>
                <div className="mt-1 font-semibold text-sky-300">${Number(activitySummary.todayByLevel.l2 || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-slate-400">Today L3</div>
                <div className="mt-1 font-semibold text-violet-300">${Number(activitySummary.todayByLevel.l3 || 0).toFixed(2)}</div>
              </div>
            </div>
          ) : null}
          {activities.length > activityPageSize ? (
            <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
              <div className="text-slate-500">
                Showing {Math.min(activityPage * activityPageSize + 1, activities.length)}-
                {Math.min((activityPage + 1) * activityPageSize, activities.length)} of {activities.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activityPage <= 0}
                  onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
                  className={
                    'rounded-lg border px-3 py-1 text-[11px] ' +
                    (activityPage <= 0
                      ? 'border-slate-800 text-slate-600'
                      : 'border-slate-700 text-slate-200 hover:border-slate-500')
                  }
                >
                  Prev
                </button>
                <div className="text-slate-500">
                  Page {activityPage + 1} / {activityPageCount}
                </div>
                <button
                  type="button"
                  disabled={activityPage + 1 >= activityPageCount}
                  onClick={() => setActivityPage((p) => Math.min(activityPageCount - 1, p + 1))}
                  className={
                    'rounded-lg border px-3 py-1 text-[11px] ' +
                    (activityPage + 1 >= activityPageCount
                      ? 'border-slate-800 text-slate-600'
                      : 'border-slate-700 text-slate-200 hover:border-slate-500')
                  }
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-3 text-[11px] text-slate-300">
            {visibleActivities.length ? (
              <>
                <div className="md:hidden overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
                  <div className="grid grid-cols-[1fr_92px] gap-2 border-b border-slate-800 px-3 py-2 text-[10px] text-slate-400">
                    <div>Activity</div>
                    <div className="text-right">Amount</div>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {visibleActivities.map((a) => (
                      <div key={a.id} className="grid grid-cols-[1fr_92px] gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">{a.label}</div>
                          {a.description ? (
                            <div className="mt-0.5 truncate text-[10px] text-slate-400">{a.description}</div>
                          ) : null}
                          <div className="mt-0.5 truncate text-[10px] text-slate-500">{new Date(a.createdAt).toLocaleString()}</div>
                        </div>
                        <div
                          className={
                            'text-right font-semibold ' +
                            (a.direction === 'in'
                              ? 'text-emerald-300'
                              : a.direction === 'out'
                                ? 'text-rose-300'
                                : 'text-slate-200')
                          }
                        >
                          {(a.direction === 'in' ? '+' : a.direction === 'out' ? '-' : '') +
                            `$${Number(a.amount || 0).toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block space-y-2">
                  {visibleActivities.map((a) => (
                    <div
                      key={a.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-2.5 shadow-[0_0_0_1px_rgba(15,23,42,0.9)] transition-all duration-200 hover:-translate-y-1 hover:border-sky-500/80 hover:bg-slate-900/90 hover:shadow-[0_0_40px_rgba(56,189,248,0.55)]"
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/70 to-transparent" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-100">{a.label}</p>
                          {a.description ? <p className="mt-1 text-slate-400">{a.description}</p> : null}
                        </div>
                        <div
                          className={
                            'shrink-0 text-right font-semibold ' +
                            (a.direction === 'in'
                              ? 'text-emerald-300'
                              : a.direction === 'out'
                                ? 'text-rose-300'
                                : 'text-slate-200')
                          }
                        >
                          {(a.direction === 'in' ? '+' : a.direction === 'out' ? '-' : '') +
                            `$${Number(a.amount || 0).toFixed(2)}`}
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="group relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3 text-slate-400 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/70 to-transparent" />
                No recent activity yet.
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
