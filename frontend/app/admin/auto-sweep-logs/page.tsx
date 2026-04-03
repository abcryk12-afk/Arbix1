'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type SweepLogRow = {
  id: string | number;
  timestamp: string;
  wallet: string;
  index: number | null;
  action: string;
  status: 'success' | 'pending' | 'failed';
  details: string | null;
  source?: string | null;
};

type LogsResponse = {
  success: boolean;
  message?: string;
  logs?: SweepLogRow[];
  totalCount?: number;
  limit?: number;
  offset?: number;
};

function fmtTime(value?: string | null) {
  if (!value) return '-';
  return String(value).slice(0, 19).replace('T', ' ');
}

function shortAddr(addr?: string | null) {
  if (!addr) return '-';
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

function statusBadge(status: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'success') return 'bg-emerald-600/20 text-emerald-300';
  if (s === 'failed') return 'bg-red-600/20 text-red-300';
  return 'bg-amber-600/20 text-amber-300';
}

export default function AdminAutoSweepLogsPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [rows, setRows] = useState<SweepLogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [q, setQ] = useState('');
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [limit, setLimit] = useState(200);
  const [offset, setOffset] = useState(0);

  const buildQuery = () => {
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    sp.set('offset', String(offset));

    const cleanQ = String(q || '').trim();
    const cleanWallet = String(wallet || '').trim();

    if (cleanQ) sp.set('q', cleanQ);
    if (cleanWallet) sp.set('wallet', cleanWallet);
    if (status !== 'all') sp.set('status', status);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);

    return sp.toString();
  };

  const load = async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    try {
      if (!silent) setIsLoading(true);
      setIsRefreshing(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const qs = buildQuery();
      const res = await fetch(`/api/admin/auto-sweep-logs${qs ? `?${qs}` : ''}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json().catch(() => null)) as LogsResponse | null;
      if (!res.ok || !data?.success) {
        setRows([]);
        setTotalCount(0);
        setError(data?.message || `Failed to load logs (HTTP ${res.status})`);
        return;
      }

      setRows(Array.isArray(data.logs) ? data.logs : []);
      setTotalCount(Number(data.totalCount || 0));
    } catch {
      setRows([]);
      setTotalCount(0);
      setError('Failed to load auto sweep logs. Please try again.');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (cancelled) return;
      await load();
    };
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    setOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, wallet, status, from, to, limit]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await load({ silent: true });
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const pageInfo = useMemo(() => {
    const fromN = totalCount === 0 ? 0 : offset + 1;
    const toN = Math.min(offset + limit, totalCount);
    return { fromN, toN };
  }, [offset, limit, totalCount]);

  return (
    <div className="min-h-screen text-slate-50">
      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Auto Sweep Logs</h1>
              <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                View step-by-step auto sweep worker activity.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => load({ silent: true })}
                disabled={isRefreshing}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-100 hover:border-slate-500 disabled:opacity-60"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-slate-600"
              placeholder="Search (action/details/wallet)..."
            />
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-slate-600"
              placeholder="Filter by wallet address"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
              <option value="200">200 / page</option>
              <option value="500">500 / page</option>
            </select>
          </div>

          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-slate-600"
            />
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-slate-600"
            />
            <div className="md:col-span-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
              <div>
                Showing <span className="text-slate-200">{pageInfo.fromN}</span>-<span className="text-slate-200">{pageInfo.toN}</span> of{' '}
                <span className="text-slate-200">{totalCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={offset <= 0 || isRefreshing}
                  onClick={() => setOffset((v) => Math.max(0, v - limit))}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-200 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={offset + limit >= totalCount || isRefreshing}
                  onClick={() => setOffset((v) => v + limit)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-600/60 bg-red-950/20 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="arbix-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                <thead className="bg-slate-950/90 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Timestamp</th>
                    <th className="px-3 py-2 text-left">Wallet</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                        No auto sweep logs found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={String(r.id)} className="align-top">
                        <td className="px-3 py-2 whitespace-nowrap">{fmtTime(r.timestamp)}</td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-[10px] text-slate-100 break-all">{r.wallet}</div>
                          <div className="text-[10px] text-slate-500">
                            {shortAddr(r.wallet)} {r.index === null ? '' : `• idx ${r.index}`}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-200">
                            {r.action}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusBadge(r.status)}`}>{r.status}</span>
                        </td>
                        <td className="px-3 py-2 max-w-[34rem]">
                          <div className="whitespace-pre-wrap break-words text-slate-300">
                            {r.details ? r.details : '-'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
