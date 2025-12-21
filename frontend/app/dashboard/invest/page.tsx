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
  dailyRoi: number; // percent
  durationDays: number;
  bullets: string[];
};

const PACKAGES: PackageConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    capital: 10,
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
  const [dailyRewards, setDailyRewards] = useState(0);
  const [totalActiveCapital, setTotalActiveCapital] = useState(0);
  const [activePackages, setActivePackages] = useState<ActivePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activationError, setActivationError] = useState<string>('');

  const [selectedPackageId, setSelectedPackageId] = useState<PackageId | null>(
    null,
  );
  const [showActivation, setShowActivation] = useState(false);
  const [eliteCapital, setEliteCapital] = useState<number>(1000);

  const selectedConfig = useMemo(
    () => PACKAGES.find((p) => p.id === selectedPackageId) || null,
    [selectedPackageId],
  );

  const requiredCapital =
    selectedConfig?.capital === 'flex'
      ? eliteCapital
      : selectedConfig?.capital || 0;
  const hasEnoughBalance = availableBalance >= requiredCapital;

  const expectedDailyEarnings = useMemo(() => {
    if (!selectedConfig) return 0;
    const cap = selectedConfig.capital === 'flex' ? requiredCapital : selectedConfig.capital;
    return (cap * selectedConfig.dailyRoi) / 100;
  }, [selectedConfig, requiredCapital]);

  const handleActivateClick = (id: PackageId) => {
    setSelectedPackageId(id);
    setShowActivation(true);
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

    const cap = selectedConfig.capital === 'flex' ? eliteCapital : selectedConfig.capital;
    if (!Number.isFinite(cap) || cap <= 0) {
      setActivationError('Invalid capital amount.');
      return;
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
          capital: selectedConfig.capital === 'flex' ? cap : undefined,
        }),
      });

      const data = await res.json();
      if (!data?.success) {
        setActivationError(data?.message || 'Failed to activate package.');
        return;
      }

      setShowActivation(false);
      setAvailableBalance(Number(data?.wallet?.balance || 0));

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
    <div className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            INVESTMENTS
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Start Investment
          </h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Review your wallet balances, choose a package and activate your first
            Arbix investment.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Your Arbix Wallet
          </h2>
          <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Available Balance</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {isLoading ? '—' : `${availableBalance.toFixed(2)} USDT`}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Available to purchase new packages
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Daily Earnings</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">
                {isLoading ? '—' : `${dailyRewards.toFixed(2)} USDT`}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Earned from active packages (today)
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Total Active Capital</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {isLoading ? '—' : `${totalActiveCapital.toFixed(2)} USDT`}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Sum of all active packages
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Choose an Investment Package
          </h2>
          <p className="mt-2 text-xs text-slate-400 md:text-sm">
            Select a package that matches your budget and risk preference. You can
            always start small and grow over time.
          </p>

          <div className="mt-4 grid gap-4 text-xs text-slate-300 md:grid-cols-2">
            {PACKAGES.map((pkg) => {
              const capLabel =
                pkg.capital === 'flex'
                  ? '$1,000+' 
                  : `$${pkg.capital.toLocaleString()}`;
              const tagColor =
                pkg.id === 'starter'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                  : pkg.id === 'gold'
                  ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40'
                  : pkg.id === 'elite_plus'
                  ? 'bg-slate-100/10 text-slate-100 border-slate-300/40'
                  : 'bg-slate-500/10 text-slate-200 border-slate-500/40';

              const expectedDaily =
                pkg.capital === 'flex'
                  ? (1000 * pkg.dailyRoi) / 100
                  : (pkg.capital * pkg.dailyRoi) / 100;

              return (
                <div
                  key={pkg.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-100">
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
                    <p className="mt-2 text-[11px] text-slate-400">
                      Capital Required:{' '}
                      <span className="font-semibold text-slate-100">
                        {capLabel}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Daily ROI:{' '}
                      <span className="font-semibold text-emerald-400">
                        {pkg.dailyRoi}%
                      </span>{' '}
                      · Duration:{' '}
                      <span className="font-semibold text-slate-100">
                        {pkg.durationDays} days
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Estimated daily profit on base capital:{' '}
                      <span className="font-semibold text-emerald-300">
                        ${expectedDaily.toFixed(2)}
                      </span>
                    </p>
                    <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
                      {pkg.bullets.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleActivateClick(pkg.id)}
                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
                  >
                    Activate Package
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Daily ROI is projected based on historical performance. Profit
            percentages are not guaranteed. Invest at your own choice.
          </p>
        </div>
      </section>

      {selectedConfig && showActivation && (
        <section
          id="activation-panel"
          className="border-b border-slate-800 bg-slate-950"
        >
          <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <h2 className="text-sm font-semibold text-slate-50 md:text-base">
                Activate Package: {selectedConfig.name}
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-1 text-[11px] md:text-xs">
                  <p>
                    <span className="text-slate-400">Required Capital:</span>{' '}
                    <span className="font-semibold text-slate-100">
                      {selectedConfig.capital === 'flex'
                        ? '$1,000+'
                        : `$${selectedConfig.capital.toLocaleString()}`}
                    </span>
                  </p>
                  {selectedConfig.capital === 'flex' && (
                    <div className="mt-2">
                      <label className="block text-[11px] text-slate-400">
                        Enter Capital (min 1000)
                      </label>
                      <input
                        value={eliteCapital}
                        onChange={(e) => setEliteCapital(Number(e.target.value || 0))}
                        type="number"
                        min={1000}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                      />
                    </div>
                  )}
                  <p>
                    <span className="text-slate-400">Daily Profit %:</span>{' '}
                    <span className="font-semibold text-emerald-400">
                      {selectedConfig.dailyRoi}%
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Duration:</span>{' '}
                    <span className="font-semibold text-slate-100">
                      {selectedConfig.durationDays} days
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Expected Daily Earnings:</span>{' '}
                    <span className="font-semibold text-emerald-300">
                      ${expectedDailyEarnings.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="space-y-1 text-[11px] md:text-xs">
                  <p>
                    <span className="text-slate-400">Available Balance:</span>{' '}
                    <span className="font-semibold text-emerald-400">
                      {availableBalance.toFixed(2)} USDT
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Amount to Deduct:</span>{' '}
                    <span className="font-semibold text-slate-100">
                      {requiredCapital.toFixed(2)} USDT
                    </span>
                  </p>
                  {activationError && (
                    <p className="mt-1 text-red-400">✖ {activationError}</p>
                  )}
                  {hasEnoughBalance ? (
                    <p className="mt-1 text-emerald-400">
                      ✔ You have enough balance to activate this package.
                    </p>
                  ) : (
                    <p className="mt-1 text-red-400">
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
                    className="rounded-lg bg-primary px-5 py-2 font-medium text-white shadow-sm hover:bg-blue-500"
                  >
                    Confirm Activation
                  </button>
                ) : (
                  <a
                    href="/dashboard/deposit"
                    className="rounded-lg bg-primary px-5 py-2 font-medium text-white shadow-sm hover:bg-blue-500"
                  >
                    Deposit Now
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowActivation(false)}
                  className="rounded-lg border border-slate-700 px-5 py-2 text-slate-100 hover:border-slate-500"
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
        className="border-b border-slate-800 bg-slate-950"
      >
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Your Active Packages
          </h2>
          {activePackages.length === 0 ? (
            <p className="mt-3 text-slate-400">
              You do not have any active packages yet. Choose a package above to
              get started.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {activePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {pkg.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Start Date: {pkg.startDate}
                      </p>
                    </div>
                    <div className="text-[11px]">
                      <span
                        className={
                          pkg.status === 'active'
                            ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400'
                            : 'rounded-full bg-slate-500/10 px-2 py-0.5 text-slate-300'
                        }
                      >
                        {pkg.status === 'active' ? '🟢 Active' : 'Completed'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2 md:grid-cols-3">
                    <p>
                      <span className="text-slate-400">Capital:</span>{' '}
                      <span className="font-semibold text-slate-100">
                        ${pkg.capital.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Daily ROI:</span>{' '}
                      <span className="font-semibold text-emerald-400">
                        {pkg.dailyRoi}%
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Days Left:</span>{' '}
                      <span className="font-semibold text-slate-100">
                        {pkg.daysLeft} / 365
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Today&apos;s Earnings:</span>{' '}
                      <span className="font-semibold text-emerald-300">
                        ${pkg.todayEarnings.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Total Earned:</span>{' '}
                      <span className="font-semibold text-slate-100">
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

      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Daily Earnings Wallet
          </h2>
          <div className="mt-4 grid gap-3 text-[11px] text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Today&apos;s Earnings</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {dailyRewards.toFixed(2)} USDT
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Daily Earnings Wallet Balance</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {dailyRewards.toFixed(2)} USDT
              </p>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <button className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500">
                Withdraw
              </button>
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-500">
                Reinvest to Packages
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-[11px] text-slate-500 md:text-xs">
          <p>
            Past performance does not guarantee future results. Your capital is at
            risk. All packages typically run for 365 days unless otherwise stated.
          </p>
        </div>
      </section>
    </div>
  );
}
