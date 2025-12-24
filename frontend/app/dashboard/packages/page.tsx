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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-100">Packages</h1>
        <p className="text-sm text-slate-400">Your packages and active package status.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-sm font-medium text-slate-100">Active Packages</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {loading ? '…' : activePackages.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Shows only packages with status = active.</div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">My Packages</div>
            <div className="text-xs text-slate-500">Fetched from /api/user/packages</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-left text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="py-2">Package</th>
                <th className="py-2">Capital</th>
                <th className="py-2">Daily ROI</th>
                <th className="py-2">Today</th>
                <th className="py-2">Days Left</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-slate-500">No packages found.</td>
                </tr>
              ) : (
                packages.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800/80 text-slate-200">
                    <td className="py-2">
                      <div className="font-medium text-slate-100">{p.name}</div>
                      <div className="text-[11px] text-slate-500">#{p.id}</div>
                    </td>
                    <td className="py-2">{Number(p.capital || 0).toLocaleString()}</td>
                    <td className="py-2">{Number(p.dailyRoi || 0)}%</td>
                    <td className="py-2">{Number(p.todayEarnings || 0).toLocaleString()}</td>
                    <td className="py-2">{Number(p.daysLeft || 0)}</td>
                    <td className="py-2">
                      <span className={
                        'rounded-full px-2 py-1 text-[11px] ' +
                        (String(p.status).toLowerCase() === 'active'
                          ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'
                          : 'bg-slate-700/30 text-slate-200 border border-slate-700')
                      }>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
