'use client';

import { useEffect, useMemo, useState } from 'react';

type PackageId =
  | 'starter'
  | 'basic'
  | 'growth'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'elite_plus';

type PackageConfig = {
  id: PackageId;
  name: string;
  capital: number | 'flex';
  minCapital?: number;
  maxCapital?: number;
  dailyRoi: number; // percent
  durationDays: number;
  bullets: string[];
};

const DEFAULT_PACKAGES: PackageConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    capital: 10,
    maxCapital: 30,
    dailyRoi: 1,
    durationDays: 365,
    bullets: [
      'Basic trading allocation',
      'Daily trading updates',
      'Standard support',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    capital: 30,
    maxCapital: 50,
    dailyRoi: 1.3,
    durationDays: 365,
    bullets: [
      'Improved strategy usage',
      'Portfolio risk control',
      'Performance tracking',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    capital: 50,
    maxCapital: 100,
    dailyRoi: 1.5,
    durationDays: 365,
    bullets: [
      'Medium-risk managed trades',
      'Weekly insight report',
      'Chat / email support',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    capital: 100,
    maxCapital: 500,
    dailyRoi: 2,
    durationDays: 365,
    bullets: [
      'Advanced strategy',
      'Priority support',
      'Weekly performance summary',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    capital: 500,
    maxCapital: 1000,
    dailyRoi: 3,
    durationDays: 365,
    bullets: [
      'High-level portfolio handling',
      'VIP updates',
      'Faster processing',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    capital: 1000,
    maxCapital: 5000,
    dailyRoi: 4,
    durationDays: 365,
    bullets: [
      'Premium trading strategy',
      'One-on-one support',
      'Advanced analytics',
    ],
  },
  {
    id: 'elite_plus',
    name: 'Elite+',
    capital: 'flex',
    minCapital: 1000,
    dailyRoi: 4.5,
    durationDays: 365,
    bullets: [
      'Fully managed portfolio',
      'VIP research access',
      'Dedicated support manager',
    ],
  },
];

type ActivePackage = {
  id: string;
  configId: PackageId;
  name: string;
  capital: number;
  dailyRoi: number;
  startDate: string;
  daysLeft: number;
  todayEarnings: number;
  totalEarned: number;
  status: 'active' | 'completed';
};

export default function StartInvestmentPage() {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [dailyRewards, setDailyRewards] = useState(0);
  const [totalActiveCapital, setTotalActiveCapital] = useState(0);
  const [activePackages, setActivePackages] = useState<ActivePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activationError, setActivationError] = useState<string>('');

  const [packagesConfig, setPackagesConfig] = useState<PackageConfig[]>(DEFAULT_PACKAGES);

  const [selectedPackageId, setSelectedPackageId] = useState<PackageId | null>(
    null,
  );
  const [showActivation, setShowActivation] = useState(false);
  const [eliteCapital, setEliteCapital] = useState<number>(1000);
  const [manualCapital, setManualCapital] = useState<number>(0);

  const selectedConfig = useMemo(
    () => packagesConfig.find((p) => p.id === selectedPackageId) || null,
    [packagesConfig, selectedPackageId],
  );

  useEffect(() => {
    let cancelled = false;

    const loadPublicConfig = async () => {
      try {
        const res = await fetch('/api/public/investment-packages', { method: 'GET', cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;

        const remote = data?.success && data?.packages && typeof data.packages === 'object'
          ? data.packages
          : null;
        if (!remote) return;

        setPackagesConfig((prev) =>
          prev.map((p) => {
            const r = remote[p.id];
            if (!r || typeof r !== 'object') return p;

            const name = typeof r.name === 'string' && r.name.trim() ? String(r.name) : p.name;

            let capital: number | 'flex' = p.capital;
            if (r.capital === 'flex') {
              capital = 'flex';
            } else if (r.capital != null) {
              const n = Number(r.capital);
              if (Number.isFinite(n) && n > 0) capital = n;
            }

            const dailyRoi = Number(r.dailyRoi);
            const durationDays = Number(r.durationDays);

            let minCapital: number | undefined = p.minCapital;
            if (capital === 'flex') {
              const m = Number(r.minCapital);
              if (Number.isFinite(m) && m > 0) minCapital = m;
              if (!Number.isFinite(Number(minCapital)) || Number(minCapital) <= 0) minCapital = 1000;
            } else {
              minCapital = undefined;
            }

            let maxCapital: number | undefined = p.maxCapital;
            const mx = Number(r.maxCapital);
            if (Number.isFinite(mx) && mx > 0) {
              maxCapital = mx;
            }

            return {
              ...p,
              name,
              capital,
              dailyRoi: Number.isFinite(dailyRoi) && dailyRoi > 0 ? dailyRoi : p.dailyRoi,
              durationDays: Number.isFinite(durationDays) && durationDays > 0 ? Math.floor(durationDays) : p.durationDays,
              ...(capital === 'flex' ? { minCapital } : { minCapital: undefined }),
              ...(maxCapital != null ? { maxCapital } : { maxCapital: undefined }),
            };
          })
        );
      } catch {
        // ignore
      }
    };

    loadPublicConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  const requiredCapital =
    selectedConfig?.capital === 'flex'
      ? eliteCapital
      : manualCapital > 0
      ? manualCapital
      : selectedConfig?.capital || 0;
  const hasEnoughBalance = availableBalance + rewardBalance >= requiredCapital;

  const expectedDailyEarnings = useMemo(() => {
    if (!selectedConfig) return 0;
    const cap = selectedConfig.capital === 'flex' ? requiredCapital : selectedConfig.capital;
    return (cap * selectedConfig.dailyRoi) / 100;
  }, [selectedConfig, requiredCapital]);

  const handleActivateClick = (id: PackageId) => {
    const pkg = packagesConfig.find((p) => p.id === id);
    setSelectedPackageId(id);
    setShowActivation(true);
    if (pkg?.capital === 'flex') {
      setEliteCapital(Number(pkg.minCapital || 1000));
      setManualCapital(0);
    } else {
      setManualCapital(Number(pkg?.capital || 0));
    }
    const el = document.getElementById('activation-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConfirmActivation = async () => {
    setActivationError('');
    if (!selectedConfig) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setActivationError('Please login again.');
      return;
    }

    const cap = selectedConfig.capital === 'flex'
      ? eliteCapital
      : manualCapital > 0
      ? manualCapital
      : Number(selectedConfig.capital);
    if (!Number.isFinite(cap) || cap <= 0) {
      setActivationError('Invalid capital amount.');
      return;
    }

    if (selectedConfig.capital === 'flex') {
      const minCap = Number(selectedConfig.minCapital || 1000);
      if (Number.isFinite(minCap) && cap < minCap) {
        setActivationError(`Capital must be at least ${minCap}.`);
        return;
      }
    } else {
      const minCap = Number(selectedConfig.capital || 0);
      const maxCap = selectedConfig.maxCapital != null ? Number(selectedConfig.maxCapital) : null;
      if (Number.isFinite(minCap) && minCap > 0 && cap < minCap) {
        setActivationError(`Capital must be at least ${minCap}.`);
        return;
      }
      if (maxCap !== null && Number.isFinite(maxCap) && maxCap > 0 && cap > maxCap) {
        setActivationError(`Capital must be at most ${maxCap}.`);
        return;
      }
    }

    try {
      const res = await fetch('/api/user/activate-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: selectedConfig.id,
          capital: cap,
        }),
      });

      const data = await res.json();
      if (!data?.success) {
        setActivationError(data?.message || 'Failed to activate package.');
        return;
      }

      setShowActivation(false);
      setAvailableBalance(Number(data?.wallet?.balance || 0));
      setRewardBalance(Number(data?.wallet?.rewardBalance || 0));

      const listRes = await fetch('/api/user/packages', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const listData = await listRes.json();
      if (listData?.success && Array.isArray(listData?.packages)) {
        const pkgs: ActivePackage[] = listData.packages
          .filter((p: any) => p?.status === 'active')
          .map((p: any) => ({
            id: String(p.id),
            configId: String(p.packageId) as PackageId,
            name: String(p.name || '—'),
            capital: Number(p.capital || 0),
            dailyRoi: Number(p.dailyRoi || 0),
            startDate: p.startAt ? String(p.startAt).slice(0, 10) : '—',
            daysLeft: Number(p.daysLeft || 0),
            todayEarnings: Number(p.todayEarnings || 0),
            totalEarned: Number(p.totalEarned || 0),
            status: p.status === 'completed' ? 'completed' : 'active',
          }));
        setActivePackages(pkgs);
      }

      const el = document.getElementById('active-packages');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setActivationError('Failed to activate package.');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cancelled) setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const summaryRes = await fetch('/api/user/summary', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const summary = await summaryRes.json();
        if (!cancelled && summary?.success) {
          setAvailableBalance(Number(summary?.wallet?.balance || 0));
          setRewardBalance(Number(summary?.wallet?.rewardBalance || 0));
        }

        const packagesRes = await fetch('/api/user/packages', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const packagesData = await packagesRes.json();
        if (!cancelled && packagesData?.success && Array.isArray(packagesData?.packages)) {
          const pkgs: ActivePackage[] = packagesData.packages
            .filter((p: any) => p?.status === 'active')
            .map((p: any) => ({
              id: String(p.id),
              configId: String(p.packageId) as PackageId,
              name: String(p.name || '—'),
              capital: Number(p.capital || 0),
              dailyRoi: Number(p.dailyRoi || 0),
              startDate: p.startAt ? String(p.startAt).slice(0, 10) : '—',
              daysLeft: Number(p.daysLeft || 0),
              todayEarnings: Number(p.todayEarnings || 0),
              totalEarned: Number(p.totalEarned || 0),
              status: p.status === 'completed' ? 'completed' : 'active',
            }));
          setActivePackages(pkgs);
          setDailyRewards(pkgs.reduce((sum, p) => sum + Number(p.todayEarnings || 0), 0));
          setTotalActiveCapital(pkgs.reduce((sum, p) => sum + Number(p.capital || 0), 0));
        }
      } catch {
        // ignore
      }
      if (!cancelled) setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="relative overflow-hidden border-b border-border bg-theme-hero backdrop-blur-sm">
        <div className="absolute inset-0 bg-theme-hero-overlay opacity-60" />
        <div className="relative mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            INVESTMENTS
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Start Investment
          </h1>
          <p className="mt-2 text-sm text-muted md:text-base">
            Review your wallet balances, choose a package and activate your first
            Arbix investment.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Your Arbix Wallet
          </h2>
          <div className="mt-4 grid gap-3 text-xs text-muted sm:grid-cols-4">
            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-[11px] text-muted">Available Balance</p>
              <p className="mt-1 text-lg font-semibold text-secondary">
                {isLoading ? '—' : `${availableBalance.toFixed(2)} USDT`}
              </p>
              <p className="mt-1 text-[11px] text-subtle">
                Available to purchase new packages
              </p>
            </div>

            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-[11px] text-muted">Reward Balance</p>
              <p className="mt-1 text-lg font-semibold text-accent">
                {isLoading ? '—' : `${rewardBalance.toFixed(2)} USDT`}
              </p>
              <p className="mt-1 text-[11px] text-subtle">
                Bonus wallet (used first when activating)
              </p>
            </div>

            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-[11px] text-muted">Daily Earnings</p>
              <p className="mt-1 text-lg font-semibold text-warning">
                {isLoading ? '—' : `${dailyRewards.toFixed(2)} USDT`}
              </p>
              <p className="mt-1 text-[11px] text-subtle">
                Earned from active packages (today)
              </p>
            </div>

            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-[11px] text-muted">Total Active Capital</p>
              <p className="mt-1 text-lg font-semibold text-heading">
                {isLoading ? '—' : `${totalActiveCapital.toFixed(2)} USDT`}
              </p>
              <p className="mt-1 text-[11px] text-subtle">
                Sum of all active packages
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Choose an Investment Package
          </h2>
          <p className="mt-2 text-xs text-muted md:text-sm">
            Select a package that matches your budget and risk preference. You can
            always start small and grow over time.
          </p>

          <div className="mt-4 grid gap-4 text-xs text-muted sm:grid-cols-2">
            {packagesConfig.map((pkg) => {
              const minCap = Number(pkg.minCapital || 1000);
              const maxCap = pkg.maxCapital != null ? Number(pkg.maxCapital) : null;
              const capLabel =
                pkg.capital === 'flex'
                  ? `$${minCap.toLocaleString()}+`
                  : maxCap !== null && Number.isFinite(maxCap) && maxCap > 0
                  ? `$${Number(pkg.capital).toLocaleString()} - $${maxCap.toLocaleString()}`
                  : `$${Number(pkg.capital).toLocaleString()}`;
              const tagColor =
                pkg.id === 'starter'
                  ? 'bg-info/10 text-info border-info/40'
                  : pkg.id === 'gold'
                  ? 'bg-warning/10 text-warning border-warning/40'
                  : pkg.id === 'elite_plus'
                  ? 'bg-surface/60 text-heading border-border2/40'
                  : 'bg-surface/40 text-muted border-border/40';

              const expectedDaily =
                pkg.capital === 'flex'
                  ? (minCap * pkg.dailyRoi) / 100
                  : (pkg.capital * pkg.dailyRoi) / 100;

              return (
                <div
                  key={pkg.id}
                  className={
                    'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface/60 bg-theme-card p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md active:translate-y-0'
                  }
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-border/70" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-heading">
                        {pkg.name}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${tagColor}`}
                      >
                        {pkg.name === 'Gold'
                          ? 'Recommended'
                          : pkg.name === 'Starter'
                          ? 'Best for new users'
                          : 'Premium plan'}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-muted">
                      Capital Required:{' '}
                      <span className="font-semibold text-heading">
                        {capLabel}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Daily ROI:{' '}
                      <span className="font-semibold text-secondary">
                        {pkg.dailyRoi}%
                      </span>{' '}
                      · Duration:{' '}
                      <span className="font-semibold text-heading">
                        {pkg.durationDays} days
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Estimated daily profit on base capital:{' '}
                      <span className="font-semibold text-secondary">
                        ${expectedDaily.toFixed(2)}
                      </span>
                    </p>
                    <ul className="mt-2 space-y-1 text-[11px] text-muted">
                      {pkg.bullets.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleActivateClick(pkg.id)}
                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-theme-primary px-4 py-2 text-xs font-medium text-primary-fg shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-theme-md hover:opacity-95 active:translate-y-0"
                  >
                    Activate Package
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-subtle">
            Daily ROI is projected based on historical performance. Profit
            percentages are not guaranteed. Invest at your own choice.
          </p>
        </div>
      </section>

      {selectedConfig && showActivation && (
        <section
          id="activation-panel"
          className="border-b border-border bg-surface/30 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 bg-theme-card p-4 shadow-theme-sm">
              <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border/70" />
              <h2 className="text-sm font-semibold text-heading md:text-base">
                Activate Package: {selectedConfig.name}
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-1 text-[11px] md:text-xs">
                  <p>
                    <span className="text-muted">Required Capital:</span>{' '}
                    <span className="font-semibold text-heading">
                      {selectedConfig.capital === 'flex'
                        ? `$${Number(selectedConfig.minCapital || 1000).toLocaleString()}+`
                        : `$${selectedConfig.capital.toLocaleString()}`}
                    </span>
                  </p>
                  {selectedConfig.capital === 'flex' && (
                    <div className="mt-2">
                      <label className="block text-[11px] text-muted">
                        Enter Capital (min {Number(selectedConfig.minCapital || 1000)})
                      </label>
                      <input
                        value={eliteCapital}
                        onChange={(e) => setEliteCapital(Number(e.target.value || 0))}
                        type="number"
                        min={Number(selectedConfig.minCapital || 1000)}
                        className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-fg outline-none transition focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
                      />
                    </div>
                  )}
                  {selectedConfig.capital !== 'flex' && (
                    <div className="mt-2">
                      <label className="block text-[11px] text-muted">
                        Enter Capital (min {Number(selectedConfig.capital)}
                        {selectedConfig.maxCapital != null ? ` · max ${Number(selectedConfig.maxCapital)}` : ''})
                      </label>
                      <input
                        value={manualCapital}
                        onChange={(e) => setManualCapital(Number(e.target.value || 0))}
                        type="number"
                        min={Number(selectedConfig.capital)}
                        max={selectedConfig.maxCapital != null ? Number(selectedConfig.maxCapital) : undefined}
                        className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-fg outline-none transition focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
                      />
                    </div>
                  )}
                  <p>
                    <span className="text-muted">Daily Profit %:</span>{' '}
                    <span className="font-semibold text-secondary">
                      {selectedConfig.dailyRoi}%
                    </span>
                  </p>
                  <p>
                    <span className="text-muted">Duration:</span>{' '}
                    <span className="font-semibold text-heading">
                      {selectedConfig.durationDays} days
                    </span>
                  </p>
                  <p>
                    <span className="text-muted">Expected Daily Earnings:</span>{' '}
                    <span className="font-semibold text-secondary">
                      ${expectedDailyEarnings.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="space-y-1 text-[11px] md:text-xs">
                  <p>
                    <span className="text-muted">Available Balance:</span>{' '}
                    <span className="font-semibold text-secondary">
                      {availableBalance.toFixed(2)} USDT
                    </span>
                  </p>
                  <p>
                    <span className="text-muted">Reward Balance:</span>{' '}
                    <span className="font-semibold text-accent">
                      {rewardBalance.toFixed(2)} USDT
                    </span>
                  </p>
                  <p>
                    <span className="text-muted">Amount to Deduct:</span>{' '}
                    <span className="font-semibold text-heading">
                      {requiredCapital.toFixed(2)} USDT
                    </span>
                  </p>
                  {activationError && (
                    <p className="mt-1 text-danger">✖ {activationError}</p>
                  )}
                  {hasEnoughBalance ? (
                    <p className="mt-1 text-success">
                      ✔ You have enough balance to activate this package.
                    </p>
                  ) : (
                    <p className="mt-1 text-danger">
                      ✖ Insufficient balance. Please deposit first.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                {hasEnoughBalance ? (
                  <button
                    type="button"
                    onClick={handleConfirmActivation}
                    className="rounded-lg bg-theme-primary px-5 py-2 font-medium text-primary-fg shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-theme-md hover:opacity-95 active:translate-y-0"
                  >
                    Confirm Activation
                  </button>
                ) : (
                  <a
                    href="/dashboard/deposit"
                    className="rounded-lg bg-theme-primary px-5 py-2 font-medium text-primary-fg shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-theme-md hover:opacity-95 active:translate-y-0"
                  >
                    Deposit Now
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowActivation(false)}
                  className="rounded-lg border border-border px-5 py-2 text-fg transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-sm active:translate-y-0"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section
        id="active-packages"
        className="border-b border-border bg-surface/30 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Your Active Packages
          </h2>
          {activePackages.length === 0 ? (
            <p className="mt-3 text-muted">
              You do not have any active packages yet. Choose a package above to
              get started.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {activePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 bg-theme-card p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent opacity-70" />
                  <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-secondary/10 blur-3xl opacity-70" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-heading">
                        {pkg.name}
                      </p>
                      <p className="text-[11px] text-muted">
                        Start Date: {pkg.startDate}
                      </p>
                    </div>
                    <div className="text-[11px]">
                      <span
                        className={
                          pkg.status === 'active'
                            ? 'rounded-full bg-success/10 px-2 py-0.5 text-success'
                            : 'rounded-full bg-surface/40 px-2 py-0.5 text-muted'
                        }
                      >
                        {pkg.status === 'active' ? '🟢 Active' : 'Completed'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                    <p>
                      <span className="text-muted">Capital:</span>{' '}
                      <span className="font-semibold text-heading">
                        ${pkg.capital.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Daily ROI:</span>{' '}
                      <span className="font-semibold text-secondary">
                        {pkg.dailyRoi}%
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Days Left:</span>{' '}
                      <span className="font-semibold text-heading">
                        {pkg.daysLeft} / 365
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Today&apos;s Earnings:</span>{' '}
                      <span className="font-semibold text-secondary">
                        ${pkg.todayEarnings.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Total Earned:</span>{' '}
                      <span className="font-semibold text-heading">
                        ${pkg.totalEarned.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Daily Earnings Wallet
          </h2>
          <div className="mt-4 grid gap-3 text-[11px] text-muted sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 bg-theme-card p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-secondary/10 blur-2xl" />
              <p className="text-muted">Today&apos;s Earnings</p>
              <p className="mt-1 text-lg font-semibold text-secondary">
                {dailyRewards.toFixed(2)} USDT
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 bg-theme-card p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
              <p className="text-muted">Daily Earnings Wallet Balance</p>
              <p className="mt-1 text-lg font-semibold text-heading">
                {dailyRewards.toFixed(2)} USDT
              </p>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <button className="rounded-lg bg-theme-primary px-4 py-2 text-xs font-medium text-primary-fg shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-theme-md hover:opacity-95 active:translate-y-0">
                Withdraw
              </button>
              <button className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-fg transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-sm active:translate-y-0">
                Reinvest to Packages
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-[11px] text-subtle md:text-xs">
          <p>
            Past performance does not guarantee future results. Your capital is at
            risk. Always invest responsibly.
          </p>
        </div>
      </section>
    </div>
  );

}
