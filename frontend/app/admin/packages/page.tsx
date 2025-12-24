'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  accountStatus: string;
  balance: number;
  createdAt: string;
};

type UserPackageRow = {
  id: number;
  packageId: string;
  packageName: string;
  capital: number;
  dailyRoi: number;
  dailyRevenue: number;
  durationDays: number;
  totalEarned: number;
  startAt: string | null;
  endAt: string | null;
  status: string;
  lastProfitAt: string | null;
};

type UserDetailsResponse = {
  success: boolean;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
    accountStatus: string | null;
    walletPublicAddress: string | null;
    createdAt: string | null;
  };
  wallet?: {
    balance: number;
    currency: string;
  };
  packages?: UserPackageRow[];
  message?: string;
};

type DepositScanLogRow = {
  id: number;
  userId: number;
  chain: string;
  token: string;
  address: string;
  reason: string | null;
  status: string;
  fromBlock: number | null;
  toBlock: number | null;
  logsFound: number;
  creditedEvents: number;
  durationMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
};

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return String(value).slice(0, 19).replace('T', ' ');
}

function shortAddr(addr?: string | null) {
  if (!addr) return '-';
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-4)}`;
}

export default function AdminPackagesPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [query, setQuery] = useState('');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsResponse['user'] | null>(null);
  const [walletDetails, setWalletDetails] = useState<UserDetailsResponse['wallet'] | null>(null);
  const [packages, setPackages] = useState<UserPackageRow[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [scanLogs, setScanLogs] = useState<DepositScanLogRow[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchUsers = async (q: string) => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const qs = new URLSearchParams();
      qs.set('limit', '100');
      if (q.trim()) qs.set('q', q.trim());

      const res = await fetch(`/api/admin/users?${qs.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      const rows = data?.success && Array.isArray(data?.users) ? data.users : [];

      setUsers(
        rows.map((u: any) => ({
          id: String(u.id),
          name: u.name || '',
          email: u.email || '',
          accountStatus: u.accountStatus || u.account_status || '',
          balance: Number(u.balance || 0),
          createdAt: u.createdAt || u.created_at || '',
        }))
      );

      if (!selectedUserId && rows.length) {
        setSelectedUserId(String(rows[0].id));
      }
    } catch {
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchUserDetails = async (id: string) => {
    try {
      setIsLoadingDetails(true);
      setDetailsError('');
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: UserDetailsResponse = await res.json();
      if (!data?.success) {
        setUserDetails(null);
        setWalletDetails(null);
        setPackages([]);
        setDetailsError(data?.message || 'Failed to load user details');
        return;
      }

      setUserDetails(data.user || null);
      setWalletDetails(data.wallet || null);
      setPackages(Array.isArray(data.packages) ? data.packages : []);
    } catch {
      setUserDetails(null);
      setWalletDetails(null);
      setPackages([]);
      setDetailsError('Failed to load user details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const fetchDepositScanLogs = async (id: string) => {
    try {
      setIsLoadingLogs(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const qs = new URLSearchParams();
      qs.set('userId', String(id));
      qs.set('limit', '100');

      const res = await fetch(`/api/admin/deposit-scan-logs?${qs.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setScanLogs(data?.success && Array.isArray(data?.logs) ? data.logs : []);
    } catch {
      setScanLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers('');
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchUserDetails(selectedUserId);
    fetchDepositScanLogs(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(query);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const activePackages = useMemo(
    () => packages.filter((p) => String(p.status).toLowerCase() === 'active'),
    [packages]
  );

  const activeCapital = useMemo(
    () => activePackages.reduce((sum, p) => sum + Number(p.capital || 0), 0),
    [activePackages]
  );

  const activeDaily = useMemo(
    () => activePackages.reduce((sum, p) => sum + Number(p.dailyRevenue || 0), 0),
    [activePackages]
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-100">Packages</h1>
        <p className="text-sm text-slate-400">Search users and review their package status.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-100">Users</div>
            <div className="text-[11px] text-slate-500">{isLoadingUsers ? 'Loading…' : `${users.length} shown`}</div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name/email/id"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          <div className="mt-3 max-h-[65vh] overflow-auto rounded-xl border border-slate-800">
            {users.length === 0 && !isLoadingUsers ? (
              <div className="p-4 text-sm text-slate-500">No users found.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {users.map((u) => {
                  const isActive = selectedUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      className={
                        'w-full px-3 py-3 text-left transition-colors ' +
                        (isActive ? 'bg-slate-900/70' : 'hover:bg-slate-900/40')
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-slate-100">{u.name || '—'}</div>
                          <div className="text-[11px] text-slate-400">{u.email || '—'}</div>
                        </div>
                        <div className="text-[11px] text-slate-500">#{u.id}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <div>Balance: {Number(u.balance || 0).toLocaleString()}</div>
                        <div>{fmtDate(u.createdAt)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-slate-100">User Packages</div>
            <div className="text-xs text-slate-500">
              {selectedUserId ? `Selected user #${selectedUserId}` : 'Select a user from the left'}
            </div>
          </div>

          {detailsError ? (
            <div className="mt-4 rounded-xl border border-rose-900/50 bg-rose-500/10 p-3 text-sm text-rose-100">
              {detailsError}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-[11px] text-slate-400">Active Packages</div>
              <div className="mt-1 text-2xl font-semibold text-slate-50">{isLoadingDetails ? '…' : activePackages.length}</div>
              <div className="mt-1 text-[11px] text-slate-500">Total packages: {isLoadingDetails ? '…' : packages.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-[11px] text-slate-400">Active Capital</div>
              <div className="mt-1 text-2xl font-semibold text-slate-50">{isLoadingDetails ? '…' : activeCapital.toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-slate-500">Currency: {walletDetails?.currency || 'USDT'}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-[11px] text-slate-400">Active Daily Profit (Est.)</div>
              <div className="mt-1 text-2xl font-semibold text-slate-50">{isLoadingDetails ? '…' : activeDaily.toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-slate-500">Sum of daily ROI returns</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-100">User Info</div>
                <div className="text-xs text-slate-500">Wallet: {shortAddr(userDetails?.walletPublicAddress || null)}</div>
              </div>
              <div className="text-xs text-slate-400">
                Balance: <span className="text-slate-100">{Number(walletDetails?.balance || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-[1050px] w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400">
                  <th className="px-3 py-2">Package</th>
                  <th className="px-3 py-2">Capital</th>
                  <th className="px-3 py-2">Daily ROI</th>
                  <th className="px-3 py-2">Daily</th>
                  <th className="px-3 py-2">Total Earned</th>
                  <th className="px-3 py-2">Start</th>
                  <th className="px-3 py-2">End</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {!isLoadingDetails && packages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-slate-500">No packages found for this user.</td>
                  </tr>
                ) : (
                  packages.map((p) => (
                    <tr key={p.id} className="border-t border-slate-800/80 text-slate-200">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-100">{p.packageName}</div>
                        <div className="text-[11px] text-slate-500">#{p.id} • {p.packageId}</div>
                      </td>
                      <td className="px-3 py-2">{Number(p.capital || 0).toLocaleString()}</td>
                      <td className="px-3 py-2">{Number(p.dailyRoi || 0)}%</td>
                      <td className="px-3 py-2">{Number(p.dailyRevenue || 0).toLocaleString()}</td>
                      <td className="px-3 py-2">{Number(p.totalEarned || 0).toLocaleString()}</td>
                      <td className="px-3 py-2">{fmtDate(p.startAt)}</td>
                      <td className="px-3 py-2">{fmtDate(p.endAt)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            'rounded-full border px-2 py-1 text-[11px] ' +
                            (String(p.status).toLowerCase() === 'active'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                              : 'border-slate-700 bg-slate-900/30 text-slate-200')
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">Deposit Detection Logs</div>
                <div className="text-xs text-slate-500">Explorer/RPC scan attempts for this user.</div>
              </div>
              <div className="text-[11px] text-slate-500">{isLoadingLogs ? 'Loading…' : `${scanLogs.length} logs`}</div>
            </div>

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-[1100px] w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400">
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Address</th>
                    <th className="px-3 py-2">Blocks</th>
                    <th className="px-3 py-2">Found</th>
                    <th className="px-3 py-2">Credited</th>
                    <th className="px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoadingLogs && scanLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-slate-500">No scan logs found for this user yet.</td>
                    </tr>
                  ) : (
                    scanLogs.map((l) => (
                      <tr key={l.id} className="border-t border-slate-800/80 text-slate-200">
                        <td className="px-3 py-2 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              'rounded-full border px-2 py-1 text-[11px] ' +
                              (String(l.status).toLowerCase() === 'success'
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                                : String(l.status).toLowerCase() === 'up_to_date'
                                  ? 'border-sky-500/20 bg-sky-500/10 text-sky-200'
                                  : String(l.status).toLowerCase() === 'skipped'
                                    ? 'border-slate-700 bg-slate-900/30 text-slate-200'
                                    : 'border-rose-500/20 bg-rose-500/10 text-rose-200')
                            }
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{l.reason || '—'}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{l.address}</td>
                        <td className="px-3 py-2">{l.fromBlock != null && l.toBlock != null ? `${l.fromBlock} → ${l.toBlock}` : '—'}</td>
                        <td className="px-3 py-2">{Number(l.logsFound || 0)}</td>
                        <td className="px-3 py-2">{Number(l.creditedEvents || 0)}</td>
                        <td className="px-3 py-2">
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
          </div>
        </section>
      </div>
    </main>
  );
}
