'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminLogRow = {
  id: string;
  time: string;
  adminEmail: string;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  success: boolean;
  ip?: string | null;
  userAgent?: string | null;
  details?: any;
};

type WorkerEvent = {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  meta?: any;
};

type AutoWithdrawWorkerStatus = {
  lastSeenAt?: string | null;
  startedAt?: string | null;
  pid?: number | null;
  withdrawalAddress?: string | null;
  tokenContract?: string | null;
  confirmations?: number | null;
  loopMs?: number | null;
  idleMs?: number | null;
  lastError?: string | null;
  events?: WorkerEvent[];
};

type LogsResponse = {
  success: boolean;
  logs?: AdminLogRow[];
  autoWithdrawWorker?: AutoWithdrawWorkerStatus;
  message?: string;
};

function fmtTime(value?: string | null) {
  if (!value) return '-';
  return String(value).slice(0, 19).replace('T', ' ');
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [logs, setLogs] = useState<AdminLogRow[]>([]);
  const [worker, setWorker] = useState<AutoWithdrawWorkerStatus | null>(null);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'auto_withdraw'>('admin');

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

      const res = await fetch('/api/admin/logs?limit=200', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json().catch(() => null)) as LogsResponse | null;
      if (!res.ok || !data?.success) {
        setLogs([]);
        setWorker(null);
        setError(data?.message || `Failed to load logs (HTTP ${res.status})`);
        return;
      }

      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setWorker(data.autoWithdrawWorker || null);
    } catch {
      setLogs([]);
      setWorker(null);
      setError('Failed to load logs. Please try again.');
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

  const filteredLogs = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const blob = JSON.stringify({
        id: l.id,
        time: l.time,
        adminEmail: l.adminEmail,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        success: l.success,
        ip: l.ip,
        details: l.details,
      }).toLowerCase();
      return blob.includes(q);
    });
  }, [logs, query]);

  const workerEvents = useMemo(() => {
    const src = Array.isArray(worker?.events) ? worker!.events! : [];
    const q = String(query || '').trim().toLowerCase();
    if (!q) return src;
    return src.filter((e) => {
      const blob = JSON.stringify(e).toLowerCase();
      return blob.includes(q);
    });
  }, [worker, query]);

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      <section className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Admin Logs</h1>
              <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                Monitor admin activity and auto-withdraw worker health.
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

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/60 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={
                  'rounded-lg px-3 py-1.5 transition-colors ' +
                  (activeTab === 'admin' ? 'bg-slate-200 text-slate-900' : 'text-slate-300 hover:bg-slate-900/60')
                }
              >
                Admin Activity
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('auto_withdraw')}
                className={
                  'rounded-lg px-3 py-1.5 transition-colors ' +
                  (activeTab === 'auto_withdraw'
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-300 hover:bg-slate-900/60')
                }
              >
                Auto Withdraw Worker
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-80 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-slate-600"
              placeholder="Search logs..."
            />
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-600/60 bg-red-950/20 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          {activeTab === 'admin' ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
                <div className="text-xs font-semibold text-slate-100">Recent Admin Activity</div>
                <div className="text-[11px] text-slate-500">
                  Showing {filteredLogs.length} events
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                  <thead className="bg-slate-950/90 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Admin</th>
                      <th className="px-3 py-2 text-left">Action</th>
                      <th className="px-3 py-2 text-left">Target</th>
                      <th className="px-3 py-2 text-left">Result</th>
                      <th className="px-3 py-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                          No admin logs found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((l) => (
                        <tr key={l.id} className="align-top">
                          <td className="px-3 py-2 whitespace-nowrap">{fmtTime(l.time)}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-100">{l.adminEmail || 'Admin'}</div>
                            <div className="text-[10px] text-slate-500">{l.ip || '-'}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-200">
                              {l.action}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-slate-200">{l.entity || '-'}</div>
                            <div className="text-[10px] text-slate-500">{l.entityId || ''}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                'rounded-full px-2 py-0.5 text-[10px] ' +
                                (l.success ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300')
                              }
                            >
                              {l.success ? 'success' : 'failed'}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-[26rem]">
                            <div className="whitespace-pre-wrap break-words text-slate-300">
                              {l.details == null ? '-' : typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-100">Auto Withdraw Worker Status</div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Last seen: <span className="text-slate-200">{fmtTime(worker?.lastSeenAt || null)}</span>
                    </div>
                  </div>
                  <div className="text-[11px]">
                    <span
                      className={
                        'rounded-full px-2 py-0.5 ' +
                        (worker?.lastSeenAt ? 'bg-emerald-600/20 text-emerald-300' : 'bg-amber-600/20 text-amber-300')
                      }
                    >
                      {worker?.lastSeenAt ? 'reporting' : 'no data'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-[11px]">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-slate-400">PID</div>
                    <div className="mt-1 font-semibold text-slate-100">{worker?.pid ?? '-'}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-slate-400">Withdrawal Address</div>
                    <div className="mt-1 font-mono text-[10px] text-slate-100 break-all">{worker?.withdrawalAddress || '-'}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-slate-400">Token Contract</div>
                    <div className="mt-1 font-mono text-[10px] text-slate-100 break-all">{worker?.tokenContract || '-'}</div>
                  </div>
                </div>

                {worker?.lastError && (
                  <div className="mt-3 rounded-xl border border-red-600/60 bg-red-950/20 p-3 text-[11px] text-red-200 whitespace-pre-wrap break-words">
                    {worker.lastError}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
                  <div className="text-xs font-semibold text-slate-100">Recent Worker Events</div>
                  <div className="text-[11px] text-slate-500">Showing {workerEvents.length} events</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                    <thead className="bg-slate-950/90 text-slate-400">
                      <tr>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Level</th>
                        <th className="px-3 py-2 text-left">Message</th>
                        <th className="px-3 py-2 text-left">Meta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                            Loading...
                          </td>
                        </tr>
                      ) : workerEvents.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                            No worker events found.
                          </td>
                        </tr>
                      ) : (
                        workerEvents.map((e, idx) => (
                          <tr key={`${e.time}-${idx}`} className="align-top">
                            <td className="px-3 py-2 whitespace-nowrap">{fmtTime(e.time)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  'rounded-full px-2 py-0.5 text-[10px] ' +
                                  (e.level === 'error'
                                    ? 'bg-red-600/20 text-red-300'
                                    : e.level === 'warn'
                                    ? 'bg-amber-600/20 text-amber-300'
                                    : 'bg-emerald-600/20 text-emerald-300')
                                }
                              >
                                {e.level}
                              </span>
                            </td>
                            <td className="px-3 py-2 max-w-[32rem] whitespace-pre-wrap break-words text-slate-200">
                              {e.message}
                            </td>
                            <td className="px-3 py-2 max-w-[28rem] whitespace-pre-wrap break-words text-slate-400">
                              {e.meta == null ? '-' : typeof e.meta === 'string' ? e.meta : JSON.stringify(e.meta)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
