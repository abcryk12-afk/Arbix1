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
        'group relative overflow-hidden rounded-2xl border border-border/80 bg-surface/50 p-4 shadow-theme-sm transition-all duration-200 ' +
        'hover:-translate-y-1 hover:border-border2 hover:shadow-theme-md ' +
        'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 motion-reduce:transform-none'
      }
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted">
            {label}
          </p>
          <p
            className={
              'mt-1 text-xl font-semibold leading-none text-heading ' +
              (loading ? 'animate-pulse' : '')
            }
          >
            {value}
          </p>
          <p className="mt-2 text-[11px] text-subtle">{subLabel}</p>
        </div>
        <div
          className={
            'mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-4 border-surface/50 ' +
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface/50 p-3 shadow-theme-sm transition-all duration-200 hover:-translate-y-1 hover:border-border2 hover:shadow-theme-md motion-reduce:transform-none">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted">{label}</p>
          <p className="mt-1 text-lg font-semibold leading-none text-heading">
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={
            'mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-4 border-surface/50 ' +
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
  const [referralCode, setReferralCode] = useState('');
  const [referralCopied, setReferralCopied] = useState(false);
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

  const referralLink = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://arbix.cloud') ||
      'https://arbix.cloud';
    if (!referralCode) return `${base}/auth/signup`;
    return `${base}/auth/signup?ref=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

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
          setReferralCode(u?.referral_code || u?.referralCode || '');
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
            const total = data?.wallet?.totalBalance;
            setWalletBalance(Number(total ?? data?.wallet?.balance ?? 0));
          } else {
            setWalletBalance(0);
          }
        }
      } catch {
        if (!cancelled) setWalletBalance(0);
      }

      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled && data?.success && data?.user) {
          const code = data.user?.referral_code || data.user?.referralCode || '';
          setReferralCode(code);
          try {
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
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

  const handleCopyReferralLink = async () => {
    try {
      setReferralCopied(false);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const el = document.createElement('textarea');
        el.value = referralLink;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setReferralCopied(true);
      window.setTimeout(() => setReferralCopied(false), 2000);
    } catch {
      setReferralCopied(false);
    }
  };

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
    <div className="text-fg">
      {/* Welcome Block */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <p className="text-sm font-semibold text-heading">
            Welcome Back, <span className="arbix-name-glow">{userName || 'User'}</span> 👋{' '}
            {isLoading ? <span className="text-[11px] text-subtle">(loading...)</span> : null}
          </p>
          <p className="mt-1 text-xs text-muted md:text-sm">
            Here&apos;s your overview for today.
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid grid-cols-3 gap-2 text-xs text-muted sm:gap-3">
            <a
              href="/dashboard/deposit"
              className={
                'arbix-card arbix-3d relative overflow-hidden rounded-2xl p-3 transition-all duration-200 ' +
                'hover:-translate-y-0.5 motion-reduce:transform-none'
              }
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/55 to-transparent" />
              <p className="text-[10px] font-semibold tracking-wide text-muted">TOTAL USER BALANCE</p>
              <p className={"mt-1 text-sm font-semibold text-heading " + (isLoading ? 'animate-pulse' : '')}>
                {isLoading ? '$--' : `$${Number(walletBalance || 0).toFixed(2)}`}
              </p>
              <p className="mt-1 text-[10px] text-subtle">Wallet balance</p>
            </a>

            <a
              href="/dashboard/deposit"
              className={
                'arbix-card arbix-3d arbix-3d-emerald arbix-shine group relative overflow-hidden rounded-2xl p-3 text-center transition-all duration-200 ' +
                'hover:-translate-y-0.5 hover:shadow-theme-md motion-reduce:transform-none'
              }
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />
              <p className="text-[10px] font-semibold tracking-wide text-muted">DEPOSIT</p>
              <p className="mt-1 text-sm font-semibold text-secondary">Add Funds</p>
              <p className="mt-1 text-[10px] text-subtle">USDT (BEP20)</p>
            </a>

            <a
              href="/dashboard/withdraw"
              className={
                'arbix-card arbix-3d arbix-3d-red arbix-shine arbix-shine-red group relative overflow-hidden rounded-2xl p-3 text-center transition-all duration-200 ' +
                'hover:-translate-y-0.5 hover:shadow-theme-md motion-reduce:transform-none'
              }
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-danger/70 to-transparent" />
              <p className="text-[10px] font-semibold tracking-wide text-muted">WITHDRAW</p>
              <p className="mt-1 text-sm font-semibold text-danger">Cash Out</p>
              <p className="mt-1 text-[10px] text-subtle">To wallet</p>
            </a>
          </div>
        </div>
      </section>

      {/* Top Summary Cards */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid grid-cols-2 gap-3 text-xs text-muted sm:grid-cols-2 md:grid-cols-4">
            <KpiCard
              href="/dashboard/invest"
              label="Today Earnings"
              value={isLoading ? '$--' : `$${kpiDisplay.todayEarnings.toFixed(2)}`}
              subLabel="Estimated from your active packages"
              accentClassName="bg-secondary"
              loading={isLoading}
            />
            <KpiCard
              href="/dashboard/invest"
              label="Total Active Capital"
              value={isLoading ? '$--' : `$${kpiDisplay.activeCapital.toFixed(2)}`}
              subLabel="Capital in active packages"
              accentClassName="bg-secondary"
              loading={isLoading}
            />
            <KpiCard
              href="/dashboard/team"
              label="Network Earnings Today"
              value={isLoading ? '$--' : `$${kpiDisplay.networkToday.toFixed(2)}`}
              subLabel="From your team activity"
              accentClassName="bg-accent"
              loading={isLoading}
            />
            <KpiCard
              href="/dashboard/invest"
              label="Total Earnings (All Time)"
              value={isLoading ? '$--' : `$${kpiDisplay.totalEarnings.toFixed(2)}`}
              subLabel="Trading + network combined"
              accentClassName="bg-primary"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* Fourth Section: Mini Action Buttons */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/dashboard/invest"
              className={
                'arbix-card arbix-3d arbix-3d-emerald arbix-shine group relative flex min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-center transition-all duration-200 ' +
                'hover:-translate-y-0.5 hover:shadow-theme-md motion-reduce:transform-none'
              }
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0 text-secondary"
              >
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.1z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
              <span className="min-w-0 truncate text-[11px] font-semibold text-heading">Invest Now</span>
            </a>

            <a
              href="/dashboard/daily-rewards"
              className={
                'arbix-card arbix-3d arbix-3d-amber arbix-shine group relative flex min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-center transition-all duration-200 ' +
                'hover:-translate-y-0.5 hover:shadow-theme-md motion-reduce:transform-none'
              }
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warning/70 to-transparent" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0 text-warning"
              >
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8v13" />
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 12 8a4.8 8 0 0 1 4.5 5" />
              </svg>
              <span className="min-w-0 truncate text-[11px] font-semibold text-heading">Daily Check-in</span>
            </a>
          </div>
        </div>
      </section>

      {/* Earnings Breakdown */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid gap-3 text-xs text-muted md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface/50 p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-1 hover:border-border2 hover:shadow-theme-md">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />
              <p className="text-[11px] font-semibold text-heading">
                My Trading Earnings
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-muted">Today</p>
                  <p className="font-semibold text-secondary">
                    ${myTradingToday.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">This Month</p>
                  <p className="font-semibold text-heading">
                    ${myTradingMonth.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">All Time</p>
                  <p className="font-semibold text-heading">
                    ${myTradingAll.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface/50 p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-1 hover:border-border2 hover:shadow-theme-md">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
              <p className="text-[11px] font-semibold text-heading">
                My Network Earnings
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-muted">Today</p>
                  <p className="font-semibold text-accent">
                    ${networkToday.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">This Month</p>
                  <p className="font-semibold text-heading">
                    ${networkMonth.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">All Time</p>
                  <p className="font-semibold text-heading">
                    ${networkAll.toFixed(2)}
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/team"
                className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-primary-hover"
              >
                My Team &amp; Earnings
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div
            className={
              'arbix-card arbix-3d arbix-shine group relative overflow-hidden rounded-2xl p-3 transition-all duration-200 ' +
              'hover:-translate-y-0.5 hover:shadow-theme-md motion-reduce:transform-none'
            }
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-border/40" />
            <div className="pointer-events-none absolute -inset-0.5 rounded-[18px] opacity-60 blur-md transition-opacity duration-200 group-hover:opacity-100 bg-theme-hero-overlay" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold tracking-wide text-muted">REFERRAL LINK</div>
                  <div className="mt-1 truncate text-[11px] font-medium text-heading">{referralLink}</div>
                  <div className="mt-1 text-[10px] text-subtle">Invite friends and earn referral rewards.</div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyReferralLink}
                  className={
                    'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all ' +
                    'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 ' +
                    (referralCopied
                      ? 'border-secondary/40 bg-secondary/10 text-secondary'
                      : 'border-border/70 bg-surface/40 text-fg hover:border-border2 hover:shadow-theme-sm')
                  }
                  aria-label="Copy referral link"
                >
                  <span>{referralCopied ? 'Copied' : 'Copy'}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    {referralCopied ? (
                      <path d="M20 6 9 17l-5-5" />
                    ) : (
                      <>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </>
                    )}
                  </svg>
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-[10px] font-medium text-subtle">Share</div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface/40 text-muted transition-colors hover:border-border2 hover:shadow-theme-sm"
                    aria-label="Share on Facebook"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(referralLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface/40 text-muted transition-colors hover:border-border2 hover:shadow-theme-sm"
                    aria-label="Share on WhatsApp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M20 12a8 8 0 0 1-13.3 6L4 20l2.2-2.7A8 8 0 1 1 20 12z" />
                      <path d="M9.5 10.5c1.2 2.3 2.7 3.8 5 5" />
                    </svg>
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface/40 text-muted transition-colors hover:border-border2 hover:shadow-theme-sm"
                    aria-label="Share on Telegram"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M22 2 11 13" />
                      <path d="M22 2 15 22 11 13 2 9 22 2z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Packages Overview */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Active Packages Overview
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-sm">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent opacity-80" />
              <p className="text-[11px] text-muted">Total Active Packages</p>
              <p className="mt-1 text-base font-semibold text-heading sm:text-lg">
                {activePackagesCount}
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-sm">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-80" />
              <p className="text-[11px] text-muted">Total Active Capital</p>
              <p className="mt-1 text-base font-semibold text-heading sm:text-lg">
                ${activeCapital.toFixed(2)}
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-sm">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warning/70 to-transparent opacity-80" />
              <p className="text-[11px] text-muted">Estimated Daily Profit</p>
              <p className="mt-1 text-base font-semibold text-secondary sm:text-lg">
                ${estimatedDailyProfit.toFixed(2)}
              </p>
            </div>
          </div>

          <a
            href="/dashboard/invest"
            className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-primary-hover"
          >
            View All Investments
          </a>
        </div>
      </section>

      {/* Team Snapshot */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Team Snapshot
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStatCard label="Level 1" value={l1Count} accentClassName="bg-secondary" />
            <MiniStatCard label="Level 2" value={l2Count} accentClassName="bg-primary" />
            <MiniStatCard label="Level 3" value={l3Count} accentClassName="bg-accent" />
            <MiniStatCard label="Total Team" value={teamTotal} accentClassName="bg-muted" />
          </div>
          <div className="mt-3 text-[11px] text-muted">
            <p>
              Today&apos;s Network Earnings:{' '}
              <span className="font-semibold text-accent">
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
            className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-primary-hover"
          >
            My Team &amp; Earnings
          </a>
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Recent Activity
          </h2>
          {activitySummary ? (
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-2xl border border-border bg-surface/60 p-3 shadow-theme-sm">
                <div className="text-muted">Today L1</div>
                <div className="mt-1 font-semibold text-secondary">${Number(activitySummary.todayByLevel.l1 || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface/60 p-3 shadow-theme-sm">
                <div className="text-muted">Today L2</div>
                <div className="mt-1 font-semibold text-primary">${Number(activitySummary.todayByLevel.l2 || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface/60 p-3 shadow-theme-sm">
                <div className="text-muted">Today L3</div>
                <div className="mt-1 font-semibold text-accent">${Number(activitySummary.todayByLevel.l3 || 0).toFixed(2)}</div>
              </div>
            </div>
          ) : null}
          {activities.length > activityPageSize ? (
            <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
              <div className="text-subtle">
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
                      ? 'border-border text-subtle opacity-60'
                      : 'border-border text-fg hover:border-border2 hover:shadow-theme-sm')
                  }
                >
                  Prev
                </button>
                <div className="text-subtle">
                  Page {activityPage + 1} / {activityPageCount}
                </div>
                <button
                  type="button"
                  disabled={activityPage + 1 >= activityPageCount}
                  onClick={() => setActivityPage((p) => Math.min(activityPageCount - 1, p + 1))}
                  className={
                    'rounded-lg border px-3 py-1 text-[11px] ' +
                    (activityPage + 1 >= activityPageCount
                      ? 'border-border text-subtle opacity-60'
                      : 'border-border text-fg hover:border-border2 hover:shadow-theme-sm')
                  }
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-3 text-[11px] text-muted">
            {visibleActivities.length ? (
              <>
                <div className="md:hidden overflow-hidden rounded-2xl border border-border/80 bg-surface/60 shadow-theme-sm">
                  <div className="grid grid-cols-[1fr_92px] gap-2 border-b border-border px-3 py-2 text-[10px] text-muted">
                    <div>Activity</div>
                    <div className="text-right">Amount</div>
                  </div>
                  <div className="divide-y divide-border">
                    {visibleActivities.map((a) => (
                      <div key={a.id} className="grid grid-cols-[1fr_92px] gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-heading">{a.label}</div>
                          {a.description ? (
                            <div className="mt-0.5 truncate text-[10px] text-muted">{a.description}</div>
                          ) : null}
                          <div className="mt-0.5 truncate text-[10px] text-subtle">{new Date(a.createdAt).toLocaleString()}</div>
                        </div>
                        <div
                          className={
                            'text-right font-semibold ' +
                            (a.direction === 'in'
                              ? 'text-secondary'
                              : a.direction === 'out'
                                ? 'text-danger'
                                : 'text-fg')
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
                      className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface/60 p-2.5 shadow-theme-sm transition-all duration-200 hover:-translate-y-1 hover:border-border2 hover:shadow-theme-md"
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-heading">{a.label}</p>
                          {a.description ? <p className="mt-1 text-muted">{a.description}</p> : null}
                        </div>
                        <div
                          className={
                            'shrink-0 text-right font-semibold ' +
                            (a.direction === 'in'
                              ? 'text-secondary'
                              : a.direction === 'out'
                                ? 'text-danger'
                                : 'text-fg')
                          }
                        >
                          {(a.direction === 'in' ? '+' : a.direction === 'out' ? '-' : '') +
                            `$${Number(a.amount || 0).toFixed(2)}`}
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-subtle">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface/60 p-3 text-muted shadow-theme-sm">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                No recent activity yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Legal Strip */}
      <section className="bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-4 text-[11px] text-subtle md:text-xs">
          Trading involves market risk. Read{' '}
          <a href="/terms" className="text-muted hover:text-heading">
            Terms
          </a>{' '}
          |{' '}
          <a href="/privacy" className="text-muted hover:text-heading">
            Privacy
          </a>{' '}
          |{' '}
          <a
            href="/risk-disclosure"
            className="text-muted hover:text-heading"
          >
            Risk Disclosure
          </a>
          .
        </div>
      </section>
    </div>
  );
}
