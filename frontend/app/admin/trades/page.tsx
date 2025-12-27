'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type TradeLogConfig = {
  minDepositUsdt: number;
  confirmations: number;
  pollingEnabled: boolean;
  streamId: string | null;
};

type TradeLogCounts = {
  usersWithAddress: number;
  chainEvents: number;
  depositRequests: number;
  moralisDepositTransactions: number;
};

type TradeLogEvent = {
  id: number;
  createdAt: string;
  updatedAt: string;
  chain: string;
  token: string;
  userId: number | null;
  userName: string;
  email: string;
  referralCode: string;
  walletAddress: string | null;
  address: string;
  amount: number;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  credited: boolean;
  creditedAt: string | null;
  relatedDepositRequests: Array<{
    id: number;
    userId: number;
    amount: number;
    status: string;
    address: string;
    txHash: string | null;
    createdAt: string;
  }>;
};

type TradeLogDepositRequest = {
  id: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
  email: string;
  referralCode: string;
  walletAddress: string | null;
  address: string;
  amount: number;
  status: string;
  txHash: string | null;
  userNote: string | null;
  adminNote: string | null;
};

type TradeLogTransaction = {
  id: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
  email: string;
  type: string;
  amount: number;
  createdBy: string | null;
  note: string | null;
};

type TradeLogsResponse = {
  success: boolean;
  message?: string;
  config?: TradeLogConfig;
  checkpoints?: Record<string, any>;
  counts?: TradeLogCounts;
  events?: TradeLogEvent[];
  depositRequests?: TradeLogDepositRequest[];
  transactions?: TradeLogTransaction[];
};

function shortAddr(addr?: string | null) {
  if (!addr) return '-';
  const s = String(addr);
  if (s.length <= 14) return s;
  return `${s.slice(0, 10)}...${s.slice(-4)}`;
}

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return String(value).slice(0, 19).replace('T', ' ');
}

export default function AdminTradesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');

  const [config, setConfig] = useState<TradeLogConfig | null>(null);
  const [checkpoints, setCheckpoints] = useState<Record<string, any>>({});
  const [counts, setCounts] = useState<TradeLogCounts | null>(null);
  const [events, setEvents] = useState<TradeLogEvent[]>([]);
  const [depositRequests, setDepositRequests] = useState<TradeLogDepositRequest[]>([]);
  const [transactions, setTransactions] = useState<TradeLogTransaction[]>([]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }

      const params = new URLSearchParams();
      params.set('limit', '200');
      if (query.trim()) params.set('q', query.trim());
      if (String(userId || '').trim()) params.set('userId', String(userId).trim());

      const res = await fetch(`/api/admin/trade-logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as TradeLogsResponse;
      if (!res.ok || !data?.success) {
        setError(String(data?.message || 'Failed to load trade logs'));
        setConfig(null);
        setCounts(null);
        setCheckpoints({});
        setEvents([]);
        setDepositRequests([]);
        setTransactions([]);
        return;
      }

      setConfig(data.config || null);
      setCounts(data.counts || null);
      setCheckpoints(data.checkpoints || {});
      setEvents(Array.isArray(data.events) ? data.events : []);
      setDepositRequests(Array.isArray(data.depositRequests) ? data.depositRequests : []);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch {
      setError('Failed to load trade logs');
      setConfig(null);
      setCounts(null);
      setCheckpoints({});
      setEvents([]);
      setDepositRequests([]);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const creditedCount = useMemo(() => events.filter((e) => e.credited).length, [events]);
  const pendingCreditCount = useMemo(() => events.filter((e) => !e.credited).length, [events]);

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Trade Logs</h1>
              <p className="text-xs text-slate-400">
                Deposit system diagnostics (Moralis → Events → Worker Credit → Requests)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchLogs}
                className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-100 hover:border-slate-500 hover:bg-slate-900/60"
              >
                Refresh
              </button>
              <a
                href="/admin"
                className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-200 hover:border-slate-600"
              >
                Back
              </a>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-[11px] text-slate-400">Config</div>
              <div className="mt-2 space-y-1 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Stream ID</span>
                  <span className="text-slate-100">{config?.streamId || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Min Deposit</span>
                  <span className="text-slate-100">{Number(config?.minDepositUsdt || 0)} USDT</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Confirmations</span>
                  <span className="text-slate-100">{Number(config?.confirmations || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Polling Enabled</span>
                  <span className={config?.pollingEnabled ? 'text-amber-300' : 'text-emerald-300'}>
                    {config?.pollingEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-[11px] text-slate-400">Checkpoints</div>
              <div className="mt-2 space-y-1 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">moralis_stream_last_user_id</span>
                  <span className="text-slate-100">{String(checkpoints?.moralis_stream_last_user_id ?? '-')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">moralis_poll_last_user_id</span>
                  <span className="text-slate-100">{String(checkpoints?.moralis_poll_last_user_id ?? '-')}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-[11px] text-slate-400">Counts</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2">
                  <div className="text-[10px] text-slate-500">Users w/ Address</div>
                  <div className="text-slate-100 font-medium">{Number(counts?.usersWithAddress || 0)}</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2">
                  <div className="text-[10px] text-slate-500">Chain Events</div>
                  <div className="text-slate-100 font-medium">{Number(counts?.chainEvents || 0)}</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2">
                  <div className="text-[10px] text-slate-500">Credited</div>
                  <div className="text-emerald-300 font-medium">{creditedCount}</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2">
                  <div className="text-[10px] text-slate-500">Pending Credit</div>
                  <div className="text-amber-300 font-medium">{pendingCreditCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">Search</div>
                <div className="text-[11px] text-slate-400">Filter by tx hash / address and optional user id.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tx hash or address"
                  className="w-64 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[12px] text-slate-100 placeholder:text-slate-600"
                />
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="User ID (optional)"
                  className="w-40 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[12px] text-slate-100 placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-100 hover:border-slate-500 hover:bg-slate-900/60"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-700/40 bg-rose-500/10 p-4 text-[12px] text-rose-100">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-6 text-[12px] text-slate-300">
              Loading logs...
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 p-4">
            <div className="text-sm font-semibold">Chain Deposit Events</div>
            <div className="text-[11px] text-slate-400">These rows must exist before worker can credit.</div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="text-[11px] text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="p-3">Time</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Credited</th>
                  <th className="p-3">Block</th>
                  <th className="p-3">Tx</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Req</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && events.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-4 text-slate-400">
                      No chain deposit events found.
                    </td>
                  </tr>
                )}
                {events.map((e) => (
                  <tr key={String(e.id)} className="border-b border-slate-900/80">
                    <td className="p-3 whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-100">{e.userName || '-'}</div>
                      <div className="text-[11px] text-slate-500">#{e.userId || '-'} {e.email || ''}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{Number(e.amount || 0).toFixed(2)} USDT</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={e.credited ? 'text-emerald-300' : 'text-amber-300'}>
                        {e.credited ? 'YES' : 'NO'}
                      </span>
                      <div className="text-[11px] text-slate-500">{fmtDate(e.creditedAt)}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{e.blockNumber}</td>
                    <td className="p-3">
                      <div className="text-slate-100">{shortAddr(e.txHash)}</div>
                      <div className="text-[11px] text-slate-500">log {e.logIndex}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-100">{shortAddr(e.address)}</div>
                      <div className="text-[11px] text-slate-500">user wallet: {shortAddr(e.walletAddress)}</div>
                    </td>
                    <td className="p-3">
                      {Array.isArray(e.relatedDepositRequests) && e.relatedDepositRequests.length ? (
                        <div className="space-y-1">
                          {e.relatedDepositRequests.slice(0, 2).map((r) => (
                            <div key={String(r.id)} className="text-[11px]">
                              <span className="text-slate-100">#{r.id}</span>{' '}
                              <span className="text-slate-400">{Number(r.amount || 0).toFixed(2)}</span>{' '}
                              <span className="text-slate-500">({String(r.status || '')})</span>
                            </div>
                          ))}
                          {e.relatedDepositRequests.length > 2 && (
                            <div className="text-[11px] text-slate-500">+{e.relatedDepositRequests.length - 2} more</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 p-4">
            <div className="text-sm font-semibold">Deposit Requests</div>
            <div className="text-[11px] text-slate-400">If tx hash is attached, it should be “processing” until credited.</div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="text-[11px] text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="p-3">Time</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tx</th>
                  <th className="p-3">Address</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && depositRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-slate-400">
                      No deposit requests found.
                    </td>
                  </tr>
                )}
                {depositRequests.map((r) => (
                  <tr key={String(r.id)} className="border-b border-slate-900/80">
                    <td className="p-3 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-100">{r.userName || '-'}</div>
                      <div className="text-[11px] text-slate-500">#{r.userId} {r.email || ''}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{Number(r.amount || 0).toFixed(2)} USDT</td>
                    <td className="p-3 whitespace-nowrap">{String(r.status || '-')}</td>
                    <td className="p-3">{r.txHash ? shortAddr(r.txHash) : '-'}</td>
                    <td className="p-3">{shortAddr(r.address)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 p-4">
            <div className="text-sm font-semibold">Moralis-Created Deposit Transactions</div>
            <div className="text-[11px] text-slate-400">These appear only after the worker credits the wallet.</div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="text-[11px] text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="p-3">Time</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-slate-400">
                      No moralis deposit transactions found.
                    </td>
                  </tr>
                )}
                {transactions.map((t) => (
                  <tr key={String(t.id)} className="border-b border-slate-900/80">
                    <td className="p-3 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-100">{t.userName || '-'}</div>
                      <div className="text-[11px] text-slate-500">#{t.userId} {t.email || ''}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{Number(t.amount || 0).toFixed(2)} USDT</td>
                    <td className="p-3 text-slate-200">{t.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
