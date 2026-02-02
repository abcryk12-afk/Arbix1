'use client';

import { useEffect, useMemo, useState } from 'react';

type PackageItem = {
  id: number;
  packageId: string;
  name: string;
  capital: number;
  dailyRoi: number;
  durationDays: number;
  startAt: string;
  endAt: string;
  status: string;
  totalEarned: number;
  daysLeft: number;
  todayEarnings: number;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!token) {
          if (!cancelled) {
            setPackages([]);
            setLoading(false);
          }
          return;
        }

        setLoading(true);

        const pkgRes = await fetch('/api/user/packages', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        const pkgData = await pkgRes.json();

        if (!cancelled) {
          setPackages(pkgData?.success && Array.isArray(pkgData?.packages) ? pkgData.packages : []);
        }
      } catch {
        if (!cancelled) {
          setPackages([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const activePackages = useMemo(() => packages.filter((p) => String(p.status).toLowerCase() === 'active'), [packages]);

  const totals = useMemo(() => {
    const totalCapital = packages.reduce((sum, p) => sum + Number(p.capital || 0), 0);
    const activeCapital = activePackages.reduce((sum, p) => sum + Number(p.capital || 0), 0);
    const totalEarned = packages.reduce((sum, p) => sum + Number(p.totalEarned || 0), 0);
    const todayEarned = packages.reduce((sum, p) => sum + Number(p.todayEarnings || 0), 0);
    return {
      totalCapital,
      activeCapital,
      totalEarned,
      todayEarned,
    };
  }, [activePackages, packages]);

  const formatMoney = (n: number) => `$${Number(n || 0).toFixed(2)}`;

  return (
    <div className="bg-transparent text-fg">
      <section className="border-b border-border bg-theme-hero backdrop-blur-sm">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            PACKAGES
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-heading sm:text-2xl md:text-3xl">
            Your Packages
          </h1>
          <p className="mt-2 text-sm text-muted md:text-base">
            Track active capital, earnings, and package status.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <section className="grid gap-3 text-xs text-muted sm:grid-cols-2 md:grid-cols-4">
          <div className="arbix-card arbix-3d rounded-2xl p-4">
            <div className="text-[11px] text-muted">Active Packages</div>
            <div className={'mt-1 text-lg font-semibold text-heading ' + (loading ? 'animate-pulse' : '')}>
              {loading ? '—' : activePackages.length}
            </div>
            <div className="mt-1 text-[11px] text-subtle">Only status = active</div>
          </div>

          <div className="arbix-card arbix-3d rounded-2xl p-4">
            <div className="text-[11px] text-muted">Total Capital</div>
            <div className={'mt-1 text-lg font-semibold text-heading ' + (loading ? 'animate-pulse' : '')}>
              {loading ? '—' : formatMoney(totals.totalCapital)}
            </div>
            <div className="mt-1 text-[11px] text-subtle">All packages combined</div>
          </div>

          <div className="arbix-card arbix-3d rounded-2xl p-4">
            <div className="text-[11px] text-muted">Active Capital</div>
            <div className={'mt-1 text-lg font-semibold text-heading ' + (loading ? 'animate-pulse' : '')}>
              {loading ? '—' : formatMoney(totals.activeCapital)}
            </div>
            <div className="mt-1 text-[11px] text-subtle">In active packages</div>
          </div>

          <div className="arbix-card arbix-3d rounded-2xl p-4">
            <div className="text-[11px] text-muted">Earnings (Today)</div>
            <div className={'mt-1 text-lg font-semibold text-warning ' + (loading ? 'animate-pulse' : '')}>
              {loading ? '—' : formatMoney(totals.todayEarned)}
            </div>
            <div className="mt-1 text-[11px] text-subtle">From all packages</div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-surface/40 p-4 shadow-theme-sm">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-heading">My Packages</div>
              <div className="text-xs text-muted">Fetched from /api/user/packages</div>
            </div>
            <div className="text-[11px] text-muted">Total earned: {loading ? '—' : formatMoney(totals.totalEarned)}</div>
          </div>

          {!loading && packages.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface/30 p-4 text-xs text-muted">
              No packages found.
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {packages.map((p) => (
                  <div
                    key={p.id}
                    className="arbix-card arbix-3d group relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-4 shadow-theme-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-theme-md"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/40" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-heading">{p.name}</div>
                        <div className="mt-0.5 text-[11px] text-muted">#{p.id}</div>
                      </div>
                      <span
                        className={
                          'shrink-0 rounded-full border px-2 py-1 text-[11px] ' +
                          (String(p.status).toLowerCase() === 'active'
                            ? 'border-success/40 bg-success/10 text-success'
                            : 'border-border bg-muted text-fg')
                        }
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted">
                      <div>
                        <div className="text-subtle">Capital</div>
                        <div className="font-semibold text-heading">{formatMoney(p.capital)}</div>
                      </div>
                      <div>
                        <div className="text-subtle">Daily ROI</div>
                        <div className="font-semibold text-success">{Number(p.dailyRoi || 0)}%</div>
                      </div>
                      <div>
                        <div className="text-subtle">Today</div>
                        <div className="font-semibold text-warning">{formatMoney(p.todayEarnings)}</div>
                      </div>
                      <div>
                        <div className="text-subtle">Days Left</div>
                        <div className="font-semibold text-heading">{Number(p.daysLeft || 0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[860px] w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="text-muted">
                      <th className="py-2">Package</th>
                      <th className="py-2">Capital</th>
                      <th className="py-2">Daily ROI</th>
                      <th className="py-2">Today</th>
                      <th className="py-2">Total Earned</th>
                      <th className="py-2">Days Left</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((p) => (
                      <tr key={p.id} className="border-t border-border/60 text-fg">
                        <td className="py-2">
                          <div className="font-medium text-heading">{p.name}</div>
                          <div className="text-[11px] text-muted">#{p.id}</div>
                        </td>
                        <td className="py-2">{formatMoney(p.capital)}</td>
                        <td className="py-2 text-success">{Number(p.dailyRoi || 0)}%</td>
                        <td className="py-2 text-warning">{formatMoney(p.todayEarnings)}</td>
                        <td className="py-2">{formatMoney(p.totalEarned)}</td>
                        <td className="py-2">{Number(p.daysLeft || 0)}</td>
                        <td className="py-2">
                          <span
                            className={
                              'rounded-full border px-2 py-1 text-[11px] ' +
                              (String(p.status).toLowerCase() === 'active'
                                ? 'border-success/40 bg-success/10 text-success'
                                : 'border-border bg-muted text-fg')
                            }
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
