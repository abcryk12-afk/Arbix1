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
  txHash: string | null;
  userNote: string | null;
  adminNote: string | null;
  requestTime: string;
  walletAddress: string | null;
  userBalance: number;
};

function shortAddr(addr: string | null | undefined) {
  if (!addr) return '-';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending');
  const [actionMessage, setActionMessage] = useState('');
  const [actionType, setActionType] = useState<'success' | 'error' | ''>('');

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'pending') {
      return requests.filter((r) => r.status === 'pending');
    }
    return requests;
  }, [requests, filterStatus]);

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
  }, [router, filterStatus]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActionMessage('');
      setActionType('');

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
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      <section className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">Withdrawal Requests</h1>
          <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
            Review, approve or reject user withdrawal requests. Approvals will deduct from the user wallet
            and create a withdraw transaction.
          </p>
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
          {actionMessage && (
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
                  <th className="px-3 py-2 text-left">Withdrawal Address</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Wallet Balance</th>
                  <th className="px-3 py-2 text-left">Requested At</th>
                  <th className="px-3 py-2 text-left">User Note</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                      Loading withdrawal requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
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
                        <div className="font-mono text-[10px] text-slate-200">{shortAddr(r.address)}</div>
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
                              : r.status === 'approved'
                              ? 'text-emerald-400'
                              : r.status === 'rejected'
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }
                        >
                          {r.status}
                        </span>
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
                      <td className="px-3 py-2 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex flex-col items-end gap-1">
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
                        ) : (
                          <span className="text-[10px] text-slate-500">No actions</span>
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
  );
}
