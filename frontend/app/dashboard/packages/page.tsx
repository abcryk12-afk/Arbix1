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
    <div className="bg-transparent text-slate-50">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950/60 via-slate-950/50 to-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            PACKAGES
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Your Packages
          </h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Track active capital, earnings, and package status.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <section className="grid gap-3 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 via-slate-950/70 to-slate-950 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_18px_50px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/35 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_24px_70px_rgba(16,185,129,0.10)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="text-[11px] text-slate-400">Active Packages</div>
            <div className={'mt-1 text-lg font-semibold text-slate-100 ' + (loading ? 'animate-pulse' : '')}>
              {loading ? '—' : activePackages.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Only status = active</div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 via-slate-950/70 to-slate-950 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_18px_50px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/35 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.22),0_24px_70px_rgba(56,189,248,0.10)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-500/10 blur-2xl" />
            <div className="text-[11px] text-slate-400">Total Capital</div>
            <div className={'mt-1 text-lg font-semibold text-slate-100 ' + (loading ? 'animate-pulse' : '')}>
              {loading ? '—' : formatMoney(totals.totalCapital)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">All packages combined</div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 via-slate-950/70 to-slate-950 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_18px_50px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/35 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.22),0_24px_70px_rgba(139,92,246,0.10)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="text-[11px] text-slate-400">Active Capital</div>
            <div className={'mt-1 text-lg font-semibold text-slate-100 ' + (loading ? 'animate-pulse' : '')}>
              {loading ? '—' : formatMoney(totals.activeCapital)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">In active packages</div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 via-slate-950/70 to-slate-950 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_18px_50px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/35 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.22),0_24px_70px_rgba(245,158,11,0.10)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="text-[11px] text-slate-400">Earnings (Today)</div>
            <div className={'mt-1 text-lg font-semibold text-amber-400 ' + (loading ? 'animate-pulse' : '')}>
              {loading ? '—' : formatMoney(totals.todayEarned)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">From all packages</div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-100">My Packages</div>
              <div className="text-xs text-slate-500">Fetched from /api/user/packages</div>
            </div>
            <div className="text-[11px] text-slate-500">Total earned: {loading ? '—' : formatMoney(totals.totalEarned)}</div>
          </div>

          {!loading && packages.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
              No packages found.
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {packages.map((p) => (
                  <div
                    key={p.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 via-slate-950/70 to-slate-950 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_18px_55px_rgba(0,0,0,0.38)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_28px_90px_rgba(56,189,248,0.10)]"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">{p.name}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">#{p.id}</div>
                      </div>
                      <span
                        className={
                          'shrink-0 rounded-full border px-2 py-1 text-[11px] ' +
                          (String(p.status).toLowerCase() === 'active'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-700 bg-slate-700/30 text-slate-200')
                        }
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div>
                        <div className="text-slate-400">Capital</div>
                        <div className="font-semibold text-slate-100">{formatMoney(p.capital)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Daily ROI</div>
                        <div className="font-semibold text-emerald-300">{Number(p.dailyRoi || 0)}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Today</div>
                        <div className="font-semibold text-amber-300">{formatMoney(p.todayEarnings)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Days Left</div>
                        <div className="font-semibold text-slate-100">{Number(p.daysLeft || 0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-[860px] w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="text-slate-400">
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
                      <tr key={p.id} className="border-t border-slate-800/80 text-slate-200">
                        <td className="py-2">
                          <div className="font-medium text-slate-100">{p.name}</div>
                          <div className="text-[11px] text-slate-500">#{p.id}</div>
                        </td>
                        <td className="py-2">{formatMoney(p.capital)}</td>
                        <td className="py-2">{Number(p.dailyRoi || 0)}%</td>
                        <td className="py-2">{formatMoney(p.todayEarnings)}</td>
                        <td className="py-2">{formatMoney(p.totalEarned)}</td>
                        <td className="py-2">{Number(p.daysLeft || 0)}</td>
                        <td className="py-2">
                          <span
                            className={
                              'rounded-full border px-2 py-1 text-[11px] ' +
                              (String(p.status).toLowerCase() === 'active'
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                                : 'border-slate-700 bg-slate-700/30 text-slate-200')
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
