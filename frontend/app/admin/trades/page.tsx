'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 6;

type TradeLogConfig = {
  rpcHost: string | null;
  minDepositUsdt: number;
  confirmations: number;
  maxBlocksPerScan: number;
  lookbackBlocks: number;
  userLookbackBlocks: number;
  userScanLimit: number;
  maxWindowsPerAddress: number;
  detectedLogRangeLimit: number | null;
};

type TradeLogCounts = {
  usersWithAddress: number;
  chainEvents: number;
  depositRequests: number;
  workerDepositTransactions: number;
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

  const [eventsPage, setEventsPage] = useState(1);
  const [depositRequestsPage, setDepositRequestsPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);

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

      setEventsPage(1);
      setDepositRequestsPage(1);
      setTransactionsPage(1);
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

  const eventsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(events.length / ITEMS_PER_PAGE)),
    [events.length],
  );
  const depositRequestsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(depositRequests.length / ITEMS_PER_PAGE)),
    [depositRequests.length],
  );
  const transactionsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE)),
    [transactions.length],
  );

  const pagedEvents = useMemo(() => {
    const start = (eventsPage - 1) * ITEMS_PER_PAGE;
    return events.slice(start, start + ITEMS_PER_PAGE);
  }, [events, eventsPage]);

  const pagedDepositRequests = useMemo(() => {
    const start = (depositRequestsPage - 1) * ITEMS_PER_PAGE;
    return depositRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [depositRequests, depositRequestsPage]);

  const pagedTransactions = useMemo(() => {
    const start = (transactionsPage - 1) * ITEMS_PER_PAGE;
    return transactions.slice(start, start + ITEMS_PER_PAGE);
  }, [transactions, transactionsPage]);

  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Trade Logs</h1>
              <p className="text-xs text-muted">
                Deposit system diagnostics (QuickNode RPC → Events → Worker Credit → Requests)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchLogs}
                className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-[11px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
              >
                Refresh
              </button>
              <a
                href="/admin"
                className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-[11px] text-muted shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
              >
                Back
              </a>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="arbix-card arbix-3d rounded-xl p-4">
              <div className="text-[11px] text-muted">Config</div>
              <div className="mt-2 space-y-1 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">RPC Host</span>
                  <span className="text-fg">{config?.rpcHost || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Min Deposit</span>
                  <span className="text-fg">{Number(config?.minDepositUsdt || 0)} USDT</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Confirmations</span>
                  <span className="text-fg">{Number(config?.confirmations || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">getLogs Limit</span>
                  <span className="text-fg">{config?.detectedLogRangeLimit ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Max Blocks/Scan</span>
                  <span className="text-fg">{Number(config?.maxBlocksPerScan || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Lookback</span>
                  <span className="text-fg">{Number(config?.lookbackBlocks || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">User Lookback</span>
                  <span className="text-fg">{Number(config?.userLookbackBlocks || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">User Scan Limit</span>
                  <span className="text-fg">{Number(config?.userScanLimit || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Windows/Address</span>
                  <span className="text-fg">{Number(config?.maxWindowsPerAddress || 0)}</span>
                </div>
              </div>
            </div>

            <div className="arbix-card arbix-3d rounded-xl p-4">
              <div className="text-[11px] text-muted">Checkpoints</div>
              <div className="mt-2 space-y-1 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">quicknode_last_user_id</span>
                  <span className="text-fg">{String(checkpoints?.quicknode_last_user_id ?? '-')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">quicknode_cursor_keys_count</span>
                  <span className="text-fg">{String(checkpoints?.quicknode_cursor_keys_count ?? '-')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">quicknode_detected_log_range_limit</span>
                  <span className="text-fg">{String(checkpoints?.quicknode_detected_log_range_limit ?? '-')}</span>
                </div>
              </div>
            </div>

            <div className="arbix-card arbix-3d rounded-xl p-4">
              <div className="text-[11px] text-muted">Counts</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-lg border border-border bg-surface/40 p-2">
                  <div className="text-[10px] text-muted">Users w/ Address</div>
                  <div className="text-fg font-medium">{Number(counts?.usersWithAddress || 0)}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface/40 p-2">
                  <div className="text-[10px] text-muted">Chain Events</div>
                  <div className="text-fg font-medium">{Number(counts?.chainEvents || 0)}</div>
                </div>
                <div className="rounded-lg border border-border bg-success/10 p-2">
                  <div className="text-[10px] text-muted">Credited</div>
                  <div className="text-fg font-medium">{creditedCount}</div>
                </div>
                <div className="rounded-lg border border-border bg-warning/10 p-2">
                  <div className="text-[10px] text-muted">Pending Credit</div>
                  <div className="text-fg font-medium">{pendingCreditCount}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface/40 p-2">
                  <div className="text-[10px] text-muted">Deposit Requests</div>
                  <div className="text-fg font-medium">{Number(counts?.depositRequests || 0)}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface/40 p-2">
                  <div className="text-[10px] text-muted">Deposit Tx</div>
                  <div className="text-fg font-medium">{Number(counts?.workerDepositTransactions || 0)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="arbix-card rounded-xl p-4 mt-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">Search</div>
                <div className="text-[11px] text-muted">Filter by tx hash / address and optional user id.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tx hash or address"
                  className="w-full sm:w-64 rounded-lg border border-border bg-surface/60 px-3 py-2 text-[12px] text-fg placeholder:text-muted"
                />
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="User ID (optional)"
                  className="w-full sm:w-40 rounded-lg border border-border bg-surface/60 px-3 py-2 text-[12px] text-fg placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-[11px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-border bg-danger/10 p-4 text-[12px] text-fg">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mt-6 arbix-card rounded-xl p-6 text-[12px] text-muted">
              Loading logs...
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="rounded-xl border border-border bg-surface/60 shadow-theme-sm">
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Chain Deposit Events</div>
                <div className="text-[11px] text-muted">These rows must exist before worker can credit.</div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-muted">
                  Page {eventsPage} / {eventsTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                  disabled={eventsPage <= 1}
                  className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-muted disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setEventsPage((p) => Math.min(eventsTotalPages, p + 1))}
                  disabled={eventsPage >= eventsTotalPages}
                  className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-muted disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="md:hidden">
            {!isLoading && pagedEvents.length === 0 && (
              <div className="p-4 text-[12px] text-muted">No chain deposit events found.</div>
            )}
            <div className="divide-y divide-border">
              {pagedEvents.map((e) => (
                <div key={String(e.id)} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] text-heading font-medium">{e.userName || '-'}</div>
                      <div className="text-[11px] text-muted">#{e.userId || '-'} {e.email || ''}</div>
                      <div className="mt-1 text-[11px] text-muted">{fmtDate(e.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-heading font-medium">{Number(e.amount || 0).toFixed(2)} USDT</div>
                      <div className={`text-[11px] ${e.credited ? 'text-heading' : 'text-muted'}`}>
                        {e.credited ? 'Credited' : 'Pending'}
                      </div>
                      <div className="text-[11px] text-muted">{fmtDate(e.creditedAt)}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border border-border bg-surface/40 p-2">
                      <div className="text-muted">Block</div>
                      <div className="text-fg">{e.blockNumber}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface/40 p-2">
                      <div className="text-muted">Tx</div>
                      <div className="text-fg">{shortAddr(e.txHash)}</div>
                      <div className="text-muted">log {e.logIndex}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface/40 p-2 col-span-2">
                      <div className="text-muted">To</div>
                      <div className="text-fg">{shortAddr(e.address)}</div>
                      <div className="text-muted">user wallet: {shortAddr(e.walletAddress)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface/40 p-2 col-span-2">
                      <div className="text-muted">Related Requests</div>
                      {Array.isArray(e.relatedDepositRequests) && e.relatedDepositRequests.length ? (
                        <div className="mt-1 space-y-1">
                          {e.relatedDepositRequests.slice(0, 2).map((r) => (
                            <div key={String(r.id)} className="text-fg">
                              <span className="text-heading">#{r.id}</span>{' '}
                              <span className="text-muted">{Number(r.amount || 0).toFixed(2)}</span>{' '}
                              <span className="text-muted">({String(r.status || '')})</span>
                            </div>
                          ))}
                          {e.relatedDepositRequests.length > 2 && (
                            <div className="text-muted">+{e.relatedDepositRequests.length - 2} more</div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 text-muted">-</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block overflow-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="text-[11px] text-muted">
                <tr className="border-b border-border">
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
                    <td colSpan={8} className="p-4 text-muted">
                      No chain deposit events found.
                    </td>
                  </tr>
                )}
                {pagedEvents.map((e) => (
                  <tr key={String(e.id)} className="border-b border-border">
                    <td className="p-3 whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                    <td className="p-3">
                      <div className="font-medium text-heading">{e.userName || '-'}</div>
                      <div className="text-[11px] text-muted">#{e.userId || '-'} {e.email || ''}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{Number(e.amount || 0).toFixed(2)} USDT</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={e.credited ? 'text-heading' : 'text-muted'}>
                        {e.credited ? 'YES' : 'NO'}
                      </span>
                      <div className="text-[11px] text-muted">{fmtDate(e.creditedAt)}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{e.blockNumber}</td>
                    <td className="p-3">
                      <div className="text-fg">{shortAddr(e.txHash)}</div>
                      <div className="text-[11px] text-muted">log {e.logIndex}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-fg">{shortAddr(e.address)}</div>
                      <div className="text-[11px] text-muted">user wallet: {shortAddr(e.walletAddress)}</div>
                    </td>
                    <td className="p-3">
                      {Array.isArray(e.relatedDepositRequests) && e.relatedDepositRequests.length ? (
                        <div className="space-y-1">
                          {e.relatedDepositRequests.slice(0, 2).map((r) => (
                            <div key={String(r.id)} className="text-[11px]">
                              <span className="text-heading">#{r.id}</span>{' '}
                              <span className="text-muted">{Number(r.amount || 0).toFixed(2)}</span>{' '}
                              <span className="text-muted">({String(r.status || '')})</span>
                            </div>
                          ))}
                          {e.relatedDepositRequests.length > 2 && (
                            <div className="text-[11px] text-muted">+{e.relatedDepositRequests.length - 2} more</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface/60 shadow-theme-sm">
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Deposit Requests</div>
                <div className="text-[11px] text-muted">If tx hash is attached, it should be “processing” until credited.</div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-muted">
                  Page {depositRequestsPage} / {depositRequestsTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setDepositRequestsPage((p) => Math.max(1, p - 1))}
                  disabled={depositRequestsPage <= 1}
                  className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-muted disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setDepositRequestsPage((p) => Math.min(depositRequestsTotalPages, p + 1))}
                  disabled={depositRequestsPage >= depositRequestsTotalPages}
                  className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-muted disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="md:hidden">
            {!isLoading && pagedDepositRequests.length === 0 && (
              <div className="p-4 text-[12px] text-muted">No deposit requests found.</div>
            )}
            <div className="divide-y divide-border">
              {pagedDepositRequests.map((r) => (
                <div key={String(r.id)} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] text-heading font-medium">{r.userName || '-'}</div>
                      <div className="text-[11px] text-muted">#{r.userId} {r.email || ''}</div>
                      <div className="mt-1 text-[11px] text-muted">{fmtDate(r.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-heading font-medium">{Number(r.amount || 0).toFixed(2)} USDT</div>
                      <div className="text-[11px] text-muted">
                        {String(r.status || '').toLowerCase() === 'pending' && r.txHash ? 'processing' : String(r.status || '-')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border border-border bg-surface/40 p-2 col-span-2">
                      <div className="text-muted">Tx</div>
                      <div className="text-fg">{r.txHash ? shortAddr(r.txHash) : '-'}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface/40 p-2 col-span-2">
                      <div className="text-muted">Address</div>
                      <div className="text-fg">{shortAddr(r.address)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block overflow-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="text-[11px] text-muted">
                <tr className="border-b border-border">
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
                    <td colSpan={6} className="p-4 text-muted">
                      No deposit requests found.
                    </td>
                  </tr>
                )}
                {pagedDepositRequests.map((r) => (
                  <tr key={String(r.id)} className="border-b border-border">
                    <td className="p-3 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td className="p-3">
                      <div className="font-medium text-heading">{r.userName || '-'}</div>
                      <div className="text-[11px] text-muted">#{r.userId} {r.email || ''}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{Number(r.amount || 0).toFixed(2)} USDT</td>
                    <td className="p-3 whitespace-nowrap">
                      {String(r.status || '').toLowerCase() === 'pending' && r.txHash ? 'processing' : String(r.status || '-')}
                    </td>
                    <td className="p-3">{r.txHash ? shortAddr(r.txHash) : '-'}</td>
                    <td className="p-3">{shortAddr(r.address)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface/60 shadow-theme-sm">
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Deposit Transactions</div>
                <div className="text-[11px] text-muted">These appear only after the worker credits the wallet.</div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-muted">
                  Page {transactionsPage} / {transactionsTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
                  disabled={transactionsPage <= 1}
                  className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-muted disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionsPage((p) => Math.min(transactionsTotalPages, p + 1))}
                  disabled={transactionsPage >= transactionsTotalPages}
                  className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-muted disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="md:hidden">
            {!isLoading && pagedTransactions.length === 0 && (
              <div className="p-4 text-[12px] text-muted">No deposit transactions found.</div>
            )}
            <div className="divide-y divide-border">
              {pagedTransactions.map((t) => (
                <div key={String(t.id)} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] text-heading font-medium">{t.userName || '-'}</div>
                      <div className="text-[11px] text-muted">#{t.userId} {t.email || ''}</div>
                      <div className="mt-1 text-[11px] text-muted">{fmtDate(t.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-heading font-medium">{Number(t.amount || 0).toFixed(2)} USDT</div>
                      <div className="text-[11px] text-muted">{t.createdBy || '-'}</div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-border bg-surface/40 p-2 text-[11px]">
                    <div className="text-muted">Note</div>
                    <div className="text-fg">{t.note || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block overflow-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="text-[11px] text-muted">
                <tr className="border-b border-border">
                  <th className="p-3">Time</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">By</th>
                  <th className="p-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-muted">
                      No deposit transactions found.
                    </td>
                  </tr>
                )}
                {pagedTransactions.map((t) => (
                  <tr key={String(t.id)} className="border-b border-border">
                    <td className="p-3 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                    <td className="p-3">
                      <div className="font-medium text-heading">{t.userName || '-'}</div>
                      <div className="text-[11px] text-muted">#{t.userId} {t.email || ''}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{Number(t.amount || 0).toFixed(2)} USDT</td>
                    <td className="p-3 whitespace-nowrap">{t.createdBy || '-'}</td>
                    <td className="p-3 text-fg">{t.note || '-'}</td>
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
