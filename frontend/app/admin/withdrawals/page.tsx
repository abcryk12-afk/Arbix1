'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

 type WithdrawalRequestRow = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  referralCode: string;
  amount: number;
  address: string;
  status: string;
  rawStatus?: string;
  token?: string;
  network?: string;
  autoWithdrawEnabledAtRequest?: boolean | null;
  txHash: string | null;
  userNote: string | null;
  adminNote: string | null;
  requestTime: string;
  walletAddress: string | null;
  userBalance: number;
};

type DepositRequestsResponse = {
  success: boolean;
  message?: string;
  config?: {
    depositRequestTtlMinutes?: number;
  };
  requests?: any[];
};

type DepositRequestRow = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  referralCode: string;
  amount: number;
  address: string;
  status: string;
  txHash: string | null;
  userNote: string | null;
  adminNote: string | null;
  requestTime: string;
  walletAddress: string | null;
  userBalance: number;
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
  message?: string;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    referralCode: string | null;
    referredById: number | null;
    kycStatus: string | null;
    accountStatus: string | null;
    role: string | null;
    walletPublicAddress: string | null;
    createdAt: string | null;
    lastLogin: string | null;
  };
  wallet?: {
    balance: number;
    currency: string;
  };
  packages?: UserPackageRow[];
  earnings?: {
    byType: Record<string, number>;
  };
  referrals?: {
    l1Count: number;
    l2Count: number;
    l3Count: number;
  };
};

function shortAddr(addr: string | null | undefined) {
  if (!addr) return '-';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return String(value).slice(0, 19).replace('T', ' ');
}

function formatCountdown(msRemaining: number) {
  const ms = Math.max(0, Math.floor(msRemaining));
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function earningsRows(byType?: Record<string, number>) {
  const src = byType || {};
  const order = ['deposit', 'withdraw', 'package_purchase', 'profit', 'referral_profit', 'referral_bonus'];
  const keys = Object.keys(src);
  keys.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return keys.map((k) => ({ type: k, total: Number(src[k] || 0) }));
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequestRow[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequestRow[]>([]);
  const [depositRequestTtlMinutes, setDepositRequestTtlMinutes] = useState<number>(30);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending');
  const [depositFilterStatus, setDepositFilterStatus] = useState<'pending' | 'all'>('pending');
  const [actionMessage, setActionMessage] = useState('');
  const [actionType, setActionType] = useState<'success' | 'error' | ''>('');
  const [actionContext, setActionContext] = useState<'deposit' | 'withdrawal' | ''>('');

  const [autoWithdrawEnabled, setAutoWithdrawEnabled] = useState<boolean>(false);
  const [isLoadingAutoWithdraw, setIsLoadingAutoWithdraw] = useState<boolean>(true);
  const [isUpdatingAutoWithdraw, setIsUpdatingAutoWithdraw] = useState<boolean>(false);

  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestRow | DepositRequestRow | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<'withdrawal' | 'deposit'>('withdrawal');
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'pending') {
      return requests.filter((r) => r.status === 'pending' || r.status === 'processing');
    }
    return requests;
  }, [requests, filterStatus]);

  const bscscanTxUrl = (hash?: string | null) => {
    const h = String(hash || '').trim();
    if (!h) return null;
    return `https://bscscan.com/tx/${h}`;
  };

  const filteredDepositRequests = useMemo(() => {
    if (depositFilterStatus === 'pending') {
      return depositRequests.filter((r) => r.status === 'pending');
    }
    return depositRequests;
  }, [depositRequests, depositFilterStatus]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const qs = filterStatus === 'pending' ? '?status=pending&limit=100' : '?status=all&limit=100';
      const res = await fetch(`/api/admin/withdrawal-requests${qs}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data?.success && Array.isArray(data?.requests)) {
        setRequests(
          data.requests.map((r: any) => ({
            id: String(r.id),
            userId: String(r.userId),
            userName: String(r.userName || ''),
            email: String(r.email || ''),
            referralCode: String(r.referralCode || ''),
            amount: Number(r.amount || 0),
            address: String(r.address || ''),
            status: String(r.status || ''),
            rawStatus: r.rawStatus != null ? String(r.rawStatus) : undefined,
            token: r.token != null ? String(r.token) : undefined,
            network: r.network != null ? String(r.network) : undefined,
            autoWithdrawEnabledAtRequest:
              r.autoWithdrawEnabledAtRequest === null || r.autoWithdrawEnabledAtRequest === undefined
                ? null
                : Boolean(r.autoWithdrawEnabledAtRequest),
            txHash: r.txHash != null ? String(r.txHash) : null,
            userNote: r.userNote != null ? String(r.userNote) : null,
            adminNote: r.adminNote != null ? String(r.adminNote) : null,
            requestTime: r.requestTime ? String(r.requestTime).slice(0, 19).replace('T', ' ') : '',
            walletAddress: r.walletAddress != null ? String(r.walletAddress) : null,
            userBalance: Number(r.userBalance || 0),
          })),
        );
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutoWithdrawSetting = async () => {
    try {
      setIsLoadingAutoWithdraw(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/auto-withdraw', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.success) {
        setAutoWithdrawEnabled(Boolean(data.enabled));
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAutoWithdraw(false);
    }
  };

  const toggleAutoWithdraw = async (next: boolean) => {
    try {
      setIsUpdatingAutoWithdraw(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/auto-withdraw', {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (data?.success) {
        setAutoWithdrawEnabled(Boolean(data.enabled));
      }
    } catch {
      // ignore
    } finally {
      setIsUpdatingAutoWithdraw(false);
    }
  };

  const handleDepositAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActionMessage('');
      setActionType('');
      setActionContext('deposit');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setActionMessage('Not logged in');
        setActionType('error');
        return;
      }

      let txHash: string | undefined;
      let adminNote: string | undefined;

      if (action === 'approve') {
        txHash = window.prompt('Enter Tx Hash (optional, for your reference):') || undefined;
        adminNote = window.prompt('Admin note (optional):') || undefined;
      } else {
        adminNote = window.prompt('Reason for rejection (optional):') || undefined;
      }

      const res = await fetch('/api/admin/deposit-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, action, txHash, adminNote }),
      });

      const data = await res.json();
      if (data?.success) {
        setActionMessage(data.message || 'Updated successfully');
        setActionType('success');
        const updated = data.request || {};
        setDepositRequests((prev) =>
          prev.map((r) =>
            r.id === String(updated.id)
              ? {
                  ...r,
                  status: String(updated.status || r.status),
                  txHash: updated.txHash != null ? String(updated.txHash) : r.txHash,
                  adminNote: updated.adminNote != null ? String(updated.adminNote) : r.adminNote,
                }
              : r,
          ),
        );
      } else {
        setActionMessage(data?.message || 'Failed to update deposit request');
        setActionType('error');
      }
    } catch {
      setActionMessage('An error occurred while updating the request');
      setActionType('error');
    }
  };

  const loadDepositRequests = async () => {
    try {
      setIsLoadingDeposits(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const qs = depositFilterStatus === 'pending' ? '?status=pending&limit=100' : '?status=all&limit=100';
      const res = await fetch(`/api/admin/deposit-requests${qs}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as DepositRequestsResponse;
      if (data?.success && Array.isArray(data?.requests)) {
        const ttl = Number(data?.config?.depositRequestTtlMinutes ?? 30);
        if (Number.isFinite(ttl) && ttl > 0) setDepositRequestTtlMinutes(Math.floor(ttl));
        setDepositRequests(
          (data.requests || []).map((r: any) => ({
            id: String(r.id),
            userId: String(r.userId),
            userName: String(r.userName || ''),
            email: String(r.email || ''),
            referralCode: String(r.referralCode || ''),
            amount: Number(r.amount || 0),
            address: String(r.address || ''),
            status: String(r.status || ''),
            txHash: r.txHash != null ? String(r.txHash) : null,
            userNote: r.userNote != null ? String(r.userNote) : null,
            adminNote: r.adminNote != null ? String(r.adminNote) : null,
            requestTime: r.requestTime ? String(r.requestTime) : '',
            walletAddress: r.walletAddress != null ? String(r.walletAddress) : null,
            userBalance: Number(r.userBalance || 0),
          })),
        );
      } else {
        setDepositRequests([]);
      }
    } catch {
      setDepositRequests([]);
    } finally {
      setIsLoadingDeposits(false);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      setIsLoadingDetails(true);
      setDetailsError('');
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setDetailsError('Not logged in');
        return;
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data?.success) {
        setSelectedUserDetails(null);
        setDetailsError(data?.message || 'Failed to load user details');
        return;
      }
      setSelectedUserDetails(data);
    } catch {
      setSelectedUserDetails(null);
      setDetailsError('Failed to load user details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const res = await fetch('/api/admin/check', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!data?.success) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }

        if (!cancelled) {
          await loadRequests();
          await loadDepositRequests();
          await loadAutoWithdrawSetting();
        }
      } catch {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      }
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, filterStatus, depositFilterStatus]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActionMessage('');
      setActionType('');
      setActionContext('withdrawal');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setActionMessage('Not logged in');
        setActionType('error');
        return;
      }

      let txHash: string | undefined;
      let adminNote: string | undefined;

      if (action === 'approve') {
        txHash = window.prompt('Enter Tx Hash (optional, for your reference):') || undefined;
        adminNote = window.prompt('Admin note (optional):') || undefined;
      } else {
        adminNote = window.prompt('Reason for rejection (optional):') || undefined;
      }

      const res = await fetch('/api/admin/withdrawal-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, action, txHash, adminNote }),
      });

      const data = await res.json();
      if (data?.success) {
        setActionMessage(data.message || 'Updated successfully');
        setActionType('success');
        const updated = data.request || {};
        setRequests((prev) =>
          prev.map((r) =>
            r.id === String(updated.id)
              ? {
                  ...r,
                  status: String(updated.status || r.status),
                  txHash: updated.txHash != null ? String(updated.txHash) : r.txHash,
                  adminNote: updated.adminNote != null ? String(updated.adminNote) : r.adminNote,
                }
              : r,
          ),
        );
      } else {
        setActionMessage(data?.message || 'Failed to update withdrawal request');
        setActionType('error');
      }
    } catch {
      setActionMessage('An error occurred while updating the request');
      setActionType('error');
    }
  };

  return (
    <div className="min-h-screen text-slate-50">
      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">Deposit Requests</h1>
          <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
            Review, approve or reject user deposit requests. Approvals will credit the user wallet
            and create a deposit transaction.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span className="text-slate-300">Filter:</span>
            <button
              type="button"
              onClick={() => setDepositFilterStatus('pending')}
              className={
                'rounded-full px-3 py-1 text-[11px] border ' +
                (depositFilterStatus === 'pending'
                  ? 'bg-red-500/10 border-red-500 text-red-200'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500')
              }
            >
              Pending only
            </button>
            <button
              type="button"
              onClick={() => setDepositFilterStatus('all')}
              className={
                'rounded-full px-3 py-1 text-[11px] border ' +
                (depositFilterStatus === 'all'
                  ? 'bg-slate-200 text-slate-900 border-slate-200'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500')
              }
            >
              All statuses
            </button>
            <button
              type="button"
              onClick={loadDepositRequests}
              className="ml-auto rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500"
            >
              Refresh
            </button>
          </div>
          {actionMessage && actionContext === 'deposit' && (
            <div
              className={
                'mt-3 rounded-lg border px-3 py-2 text-[11px] ' +
                (actionType === 'success'
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200'
                  : 'border-red-500/60 bg-red-950/20 text-red-200')
              }
            >
              {actionMessage}
            </div>
          )}
        </div>
      </section>

      <section className="bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="arbix-card rounded-2xl overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Request ID</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Referral</th>
                  <th className="px-3 py-2 text-left">Amount (USDT)</th>
                  <th className="px-3 py-2 text-left">Wallet Address</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Wallet Balance</th>
                  <th className="px-3 py-2 text-left">Requested At</th>
                  <th className="px-3 py-2 text-left">User Note</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {isLoadingDeposits ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                      Loading deposit requests...
                    </td>
                  </tr>
                ) : filteredDepositRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                      No deposit requests found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredDepositRequests.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-100">#{r.id}</div>
                        {r.txHash && (
                          <div className="mt-0.5 text-[10px] text-slate-500">Tx: {shortAddr(r.txHash)}</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-100">{r.userName || '(No name)'}</div>
                        <div className="text-[10px] text-slate-400">{r.email}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-slate-300">{r.referralCode || '-'}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-emerald-400">${r.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-[10px] text-slate-200">{shortAddr(r.address)}</div>
                          <button
                            type="button"
                            onClick={() => r.address && handleCopy(r.address)}
                            className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
                            disabled={!r.address}
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            r.status === 'pending' && r.txHash
                              ? 'text-sky-400'
                              : r.status === 'pending'
                              ? 'text-amber-400'
                              : r.status === 'approved'
                              ? 'text-emerald-400'
                              : r.status === 'rejected'
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }
                        >
                          {(() => {
                            const ttlMs = Math.max(1, depositRequestTtlMinutes) * 60 * 1000;
                            const createdMs = r.requestTime ? new Date(r.requestTime).getTime() : NaN;
                            const isExpired = r.status === 'pending' && !r.txHash && Number.isFinite(createdMs) && (nowMs - createdMs) >= ttlMs;
                            if (isExpired) return 'expired';
                            return r.status === 'pending' && r.txHash ? 'processing' : r.status;
                          })()}
                        </span>

                        {(() => {
                          const ttlMs = Math.max(1, depositRequestTtlMinutes) * 60 * 1000;
                          const createdMs = r.requestTime ? new Date(r.requestTime).getTime() : NaN;
                          const msRemaining = Number.isFinite(createdMs) ? (createdMs + ttlMs - nowMs) : NaN;
                          const showCountdown = r.status === 'pending' && !r.txHash && Number.isFinite(msRemaining);
                          if (!showCountdown) return null;
                          return (
                            <div className="mt-0.5 text-[10px] text-slate-500">
                              Time left: {formatCountdown(msRemaining)}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-slate-200">${r.userBalance.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-slate-300">{fmtDate(r.requestTime) || '-'}</span>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <span className="text-[10px] text-slate-300">{r.userNote || '-'}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {(() => {
                          const ttlMs = Math.max(1, depositRequestTtlMinutes) * 60 * 1000;
                          const createdMs = r.requestTime ? new Date(r.requestTime).getTime() : NaN;
                          const isExpired = r.status === 'pending' && !r.txHash && Number.isFinite(createdMs) && (nowMs - createdMs) >= ttlMs;
                          if (r.status !== 'pending' || isExpired) {
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setSelectedRequestType('deposit');
                                    setSelectedRequest(r);
                                    await loadUserDetails(r.userId);
                                  }}
                                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[10px] font-medium text-slate-100 hover:border-slate-500"
                                >
                                  View Details
                                </button>
                                <span className="text-[10px] text-slate-500">No actions</span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-col items-end gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  setSelectedRequestType('deposit');
                                  setSelectedRequest(r);
                                  await loadUserDetails(r.userId);
                                }}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[10px] font-medium text-slate-100 hover:border-slate-500"
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDepositAction(r.id, 'approve')}
                                disabled={Boolean(r.txHash)}
                                className={
                                  'inline-flex items-center justify-center rounded-lg px-3 py-1 text-[10px] font-medium ' +
                                  (r.txHash
                                    ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500')
                                }
                              >
                                {r.txHash ? 'Auto Processing' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDepositAction(r.id, 'reject')}
                                disabled={Boolean(r.txHash)}
                                className={
                                  'inline-flex items-center justify-center rounded-lg px-3 py-1 text-[10px] font-medium ' +
                                  (r.txHash
                                    ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-500')
                                }
                              >
                                {r.txHash ? 'Locked' : 'Reject'}
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">Withdrawal Requests</h1>
          <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
            Review, approve or reject user withdrawal requests. Approvals will deduct from the user wallet
            and create a withdraw transaction.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 arbix-card rounded-2xl px-3 py-2 text-[11px]">
            <span className="font-semibold text-slate-100">Auto Withdrawals:</span>
            <span className={autoWithdrawEnabled ? 'text-emerald-300' : 'text-amber-300'}>
              {isLoadingAutoWithdraw ? 'Loading...' : autoWithdrawEnabled ? 'ON' : 'OFF'}
            </span>
            <button
              type="button"
              disabled={isLoadingAutoWithdraw || isUpdatingAutoWithdraw}
              onClick={() => toggleAutoWithdraw(!autoWithdrawEnabled)}
              className={
                'ml-2 rounded-lg border px-3 py-1 font-medium ' +
                (autoWithdrawEnabled
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200 hover:border-emerald-400'
                  : 'border-amber-500/60 bg-amber-950/20 text-amber-200 hover:border-amber-400')
              }
            >
              {isUpdatingAutoWithdraw ? 'Updating...' : autoWithdrawEnabled ? 'Turn OFF' : 'Turn ON'}
            </button>
            <span className="ml-auto text-slate-400">
              Auto withdrawals are restricted to USDT on BSC.
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span className="text-slate-300">Filter:</span>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={
                'rounded-full px-3 py-1 text-[11px] border ' +
                (filterStatus === 'pending'
                  ? 'bg-red-500/10 border-red-500 text-red-200'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500')
              }
            >
              Pending only
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={
                'rounded-full px-3 py-1 text-[11px] border ' +
                (filterStatus === 'all'
                  ? 'bg-slate-200 text-slate-900 border-slate-200'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500')
              }
            >
              All statuses
            </button>
            <button
              type="button"
              onClick={loadRequests}
              className="ml-auto rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500"
            >
              Refresh
            </button>
          </div>
          {actionMessage && actionContext === 'withdrawal' && (
            <div
              className={
                'mt-3 rounded-lg border px-3 py-2 text-[11px] ' +
                (actionType === 'success'
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200'
                  : 'border-red-500/60 bg-red-950/20 text-red-200')
              }
            >
              {actionMessage}
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Request ID</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Referral</th>
                  <th className="px-3 py-2 text-left">Amount (USDT)</th>
                  <th className="px-3 py-2 text-left">Token</th>
                  <th className="px-3 py-2 text-left">Network</th>
                  <th className="px-3 py-2 text-left">Withdrawal Address</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Auto</th>
                  <th className="px-3 py-2 text-left">Wallet Balance</th>
                  <th className="px-3 py-2 text-left">Requested At</th>
                  <th className="px-3 py-2 text-left">User Note</th>
                  <th className="px-3 py-2 text-left">Tx</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={14} className="px-3 py-6 text-center text-slate-500">
                      Loading withdrawal requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-3 py-6 text-center text-slate-500">
                      No withdrawal requests found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-100">#{r.id}</div>
                        {r.txHash && (
                          <div className="mt-0.5 text-[10px] text-slate-500">Tx: {shortAddr(r.txHash)}</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-100">{r.userName || '(No name)'}</div>
                        <div className="text-[10px] text-slate-400">{r.email}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-slate-300">{r.referralCode || '-'}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-emerald-400">${r.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-[10px] text-slate-200">{shortAddr(r.address)}</div>
                          <button
                            type="button"
                            onClick={() => r.address && handleCopy(r.address)}
                            className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
                            disabled={!r.address}
                          >
                            Copy
                          </button>
                        </div>
                        {r.walletAddress && (
                          <div className="mt-0.5 text-[10px] text-slate-500">
                            User wallet: {shortAddr(r.walletAddress)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            r.status === 'pending'
                              ? 'text-amber-400'
                              : r.status === 'processing'
                              ? 'text-sky-300'
                              : r.status === 'completed'
                              ? 'text-emerald-400'
                              : r.status === 'failed'
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {r.autoWithdrawEnabledAtRequest === null || r.autoWithdrawEnabledAtRequest === undefined ? (
                          <span className="text-[10px] text-slate-500">-</span>
                        ) : r.autoWithdrawEnabledAtRequest ? (
                          <span className="text-[10px] text-emerald-300">ON</span>
                        ) : (
                          <span className="text-[10px] text-amber-300">OFF</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-slate-200">${r.userBalance.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-slate-300">{r.requestTime || '-'}</span>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <span className="text-[10px] text-slate-300">
                          {r.userNote || '-' }
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {r.txHash ? (
                          <a
                            href={bscscanTxUrl(r.txHash) || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-primary hover:text-blue-400"
                          >
                            {shortAddr(r.txHash)}
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedRequestType('withdrawal');
                                setSelectedRequest(r);
                                await loadUserDetails(r.userId);
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[10px] font-medium text-slate-100 hover:border-slate-500"
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(r.id, 'approve')}
                              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-emerald-500"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(r.id, 'reject')}
                              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-red-500"
                            >
                              Reject
                            </button>
                          </div>
                        ) : r.status === 'processing' ? (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedRequestType('withdrawal');
                                setSelectedRequest(r);
                                await loadUserDetails(r.userId);
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[10px] font-medium text-slate-100 hover:border-slate-500"
                            >
                              View Details
                            </button>
                            <span className="text-[10px] text-sky-300">Auto Processing</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedRequestType('withdrawal');
                                setSelectedRequest(r);
                                await loadUserDetails(r.userId);
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[10px] font-medium text-slate-100 hover:border-slate-500"
                            >
                              View Details
                            </button>
                            <span className="text-[10px] text-slate-500">No actions</span>
                          </div>
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

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 pb-8 text-xs text-slate-300 md:text-sm">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-100">Request Details</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">View selected request + user details.</p>
            </div>

            {!selectedRequest ? (
              <div className="px-4 py-10 text-center text-[12px] text-slate-500">
                Select a request and click View Details
              </div>
            ) : isLoadingDetails ? (
              <div className="px-4 py-10 text-center text-[12px] text-slate-500">Loading details...</div>
            ) : detailsError ? (
              <div className="px-4 py-8 text-center text-[12px] text-red-300">{detailsError}</div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="text-[11px] font-semibold text-slate-200">Request</div>
                  <div className="mt-2 grid gap-2 md:grid-cols-3 text-[11px] text-slate-300">
                    <div><span className="text-slate-500">Request ID:</span> #{selectedRequest.id}</div>
                    <div><span className="text-slate-500">Status:</span> {selectedRequest.status}</div>
                    <div><span className="text-slate-500">Amount:</span> ${selectedRequest.amount.toFixed(2)}</div>
                    {selectedRequestType === 'withdrawal' ? (
                      <>
                        <div><span className="text-slate-500">Token:</span> {String((selectedRequest as any)?.token || 'USDT')}</div>
                        <div><span className="text-slate-500">Network:</span> {String((selectedRequest as any)?.network || 'BSC')}</div>
                        <div>
                          <span className="text-slate-500">Auto at request:</span>{' '}
                          {((selectedRequest as any)?.autoWithdrawEnabledAtRequest === null || (selectedRequest as any)?.autoWithdrawEnabledAtRequest === undefined)
                            ? '-'
                            : (selectedRequest as any)?.autoWithdrawEnabledAtRequest
                            ? 'ON'
                            : 'OFF'}
                        </div>
                      </>
                    ) : null}
                    <div className="md:col-span-3 break-all">
                      <span className="text-slate-500">{selectedRequestType === 'deposit' ? 'Wallet Address:' : 'Withdrawal Address:'}</span> {selectedRequest.address}{' '}
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedRequest.address)}
                        className="ml-2 rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
                      >
                        Copy
                      </button>
                    </div>
                    {selectedRequestType === 'withdrawal' && selectedRequest.txHash ? (
                      <div className="md:col-span-3 break-all">
                        <span className="text-slate-500">Tx Hash:</span>{' '}
                        <a
                          href={bscscanTxUrl(selectedRequest.txHash) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:text-blue-400"
                        >
                          {selectedRequest.txHash}
                        </a>
                      </div>
                    ) : null}
                    <div><span className="text-slate-500">Requested At:</span> {selectedRequest.requestTime || '-'}</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">User</div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                      <div><span className="text-slate-500">Name:</span> {selectedUserDetails?.user?.name || '-'}</div>
                      <div><span className="text-slate-500">Email:</span> {selectedUserDetails?.user?.email || '-'}</div>
                      <div><span className="text-slate-500">Phone:</span> {selectedUserDetails?.user?.phone || '-'}</div>
                      <div><span className="text-slate-500">Account:</span> {selectedUserDetails?.user?.accountStatus || '-'}</div>
                      <div><span className="text-slate-500">KYC:</span> {selectedUserDetails?.user?.kycStatus || '-'}</div>
                      <div><span className="text-slate-500">Joined:</span> {fmtDate(selectedUserDetails?.user?.createdAt || null)}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Wallet + Referrals</div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                      <div className="break-all"><span className="text-slate-500">Wallet Address:</span> {selectedUserDetails?.user?.walletPublicAddress || '-'}</div>
                      <div>
                        <span className="text-slate-500">Balance:</span>{' '}
                        <span className="text-emerald-400 font-semibold">
                          ${Number(selectedUserDetails?.wallet?.balance || 0).toFixed(2)}
                        </span>
                        <span className="text-slate-500"> {selectedUserDetails?.wallet?.currency || 'USDT'}</span>
                      </div>
                      <div><span className="text-slate-500">Referral Code:</span> {selectedUserDetails?.user?.referralCode || '-'}</div>
                      <div><span className="text-slate-500">Referrals:</span> L1 {selectedUserDetails?.referrals?.l1Count ?? 0} / L2 {selectedUserDetails?.referrals?.l2Count ?? 0} / L3 {selectedUserDetails?.referrals?.l3Count ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                    <div className="text-[11px] font-semibold text-slate-200">Packages</div>
                    <div className="text-[10px] text-slate-500">Total: {Array.isArray(selectedUserDetails?.packages) ? selectedUserDetails!.packages!.length : 0}</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="px-3 py-2 text-left">Package</th>
                          <th className="px-3 py-2 text-left">Capital</th>
                          <th className="px-3 py-2 text-left">Daily ROI</th>
                          <th className="px-3 py-2 text-left">Daily Rev</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {Array.isArray(selectedUserDetails?.packages) && selectedUserDetails!.packages!.length ? (
                          selectedUserDetails!.packages!.map((p) => (
                            <tr key={p.id}>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-slate-100">{p.packageName}</div>
                                <div className="text-[10px] text-slate-500">{p.packageId} · #{p.id}</div>
                              </td>
                              <td className="px-3 py-2">${Number(p.capital || 0).toFixed(2)}</td>
                              <td className="px-3 py-2">{Number(p.dailyRoi || 0).toFixed(2)}%</td>
                              <td className="px-3 py-2 text-emerald-400">${Number(p.dailyRevenue || 0).toFixed(4)}</td>
                              <td className="px-3 py-2">{p.status}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-slate-500">No packages found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="border-b border-slate-800 px-3 py-2">
                    <div className="text-[11px] font-semibold text-slate-200">Earnings Breakdown</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {earningsRows(selectedUserDetails?.earnings?.byType).length ? (
                          earningsRows(selectedUserDetails?.earnings?.byType).map((row) => (
                            <tr key={row.type}>
                              <td className="px-3 py-2">{row.type}</td>
                              <td className="px-3 py-2">${row.total.toFixed(4)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="px-3 py-4 text-center text-slate-500">No earnings data.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
