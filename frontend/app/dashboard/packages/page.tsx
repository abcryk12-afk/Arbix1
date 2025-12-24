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

type ScanLog = {
  id: number;
  chain: string;
  token: string;
  address: string;
  reason: string | null;
  status: string;
  latestBlock: number | null;
  confirmations: number | null;
  safeToBlock: number | null;
  cursorBefore: number | null;
  cursorAfter: number | null;
  fromBlock: number | null;
  toBlock: number | null;
  rounds: number | null;
  logsFound: number;
  creditedEvents: number;
  durationMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
};

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

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
            setLogs([]);
            setLoading(false);
            setLoadingLogs(false);
          }
          return;
        }

        setLoading(true);
        setLoadingLogs(true);

        const [pkgRes, logRes] = await Promise.all([
          fetch('/api/user/packages', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/user/deposit-scan-logs?limit=80', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [pkgData, logData] = await Promise.all([pkgRes.json(), logRes.json()]);

        if (!cancelled) {
          setPackages(pkgData?.success && Array.isArray(pkgData?.packages) ? pkgData.packages : []);
          setLogs(logData?.success && Array.isArray(logData?.logs) ? logData.logs : []);
        }
      } catch {
        if (!cancelled) {
          setPackages([]);
          setLogs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingLogs(false);
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
        <p className="text-sm text-slate-400">Your active packages and auto-deposit scanner logs.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-sm font-medium text-slate-100">Active Packages</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {loading ? '…' : activePackages.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Shows only packages with status = active.</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-sm font-medium text-slate-100">Last Deposit Scan</div>
          <div className="mt-2 text-xs text-slate-300">
            {loadingLogs ? 'Loading…' : logs.length ? fmtDate(logs[0]?.createdAt) : 'No scans yet'}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            If you see error like <span className="text-slate-300">BSC_RPC_URL_MISSING</span>, add it in backend .env.
          </div>
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

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold text-slate-100">Auto-Deposit Scanner Logs</div>
          <div className="text-xs text-slate-500">This shows which address was scanned and whether deposits were found/credited.</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse text-left text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="py-2">Time</th>
                <th className="py-2">Status</th>
                <th className="py-2">Reason</th>
                <th className="py-2">Address</th>
                <th className="py-2">Blocks</th>
                <th className="py-2">Found</th>
                <th className="py-2">Credited</th>
                <th className="py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {!loadingLogs && logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-3 text-slate-500">No scan logs yet. Refresh Deposit page to trigger scans.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-800/80 text-slate-200">
                    <td className="py-2 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                    <td className="py-2">
                      <span className={
                        'rounded-full px-2 py-1 text-[11px] border ' +
                        (l.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20'
                          : l.status === 'up_to_date'
                            ? 'bg-sky-500/10 text-sky-200 border-sky-500/20'
                            : l.status === 'skipped'
                              ? 'bg-slate-700/30 text-slate-200 border-slate-700'
                              : 'bg-rose-500/10 text-rose-200 border-rose-500/20')
                      }>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2">{l.reason || '—'}</td>
                    <td className="py-2 font-mono text-[11px]">{l.address}</td>
                    <td className="py-2">
                      {l.fromBlock != null && l.toBlock != null ? `${l.fromBlock} → ${l.toBlock}` : '—'}
                    </td>
                    <td className="py-2">{Number(l.logsFound || 0)}</td>
                    <td className="py-2">{Number(l.creditedEvents || 0)}</td>
                    <td className="py-2">
                      {l.errorCode ? (
                        <div>
                          <div className="text-rose-200">{l.errorCode}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-2">{l.errorMessage || ''}</div>
                        </div>
                      ) : (
                        '—'
                      )}
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
