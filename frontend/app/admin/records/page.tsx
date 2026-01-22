'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type RecordRow = {
  id: string;
  userId: string;
  userName: string | null;
  email: string | null;
  referralCode: string | null;
  amount: number;
  createdAt: string | null;
  note: string | null;
};

type RecordsResponse = {
  success: boolean;
  message?: string;
  type?: 'deposit' | 'withdraw';
  totalCount?: number;
  totalAmount?: number;
  records?: RecordRow[];
};

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return String(value).slice(0, 19).replace('T', ' ');
}

export default function AdminRecordsPage() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const [depositRows, setDepositRows] = useState<RecordRow[]>([]);
  const [withdrawRows, setWithdrawRows] = useState<RecordRow[]>([]);

  const [depositTotal, setDepositTotal] = useState(0);
  const [withdrawTotal, setWithdrawTotal] = useState(0);

  const [depositCount, setDepositCount] = useState(0);
  const [withdrawCount, setWithdrawCount] = useState(0);

  const [depositOffset, setDepositOffset] = useState(0);
  const [withdrawOffset, setWithdrawOffset] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoreDeposits, setIsLoadingMoreDeposits] = useState(false);
  const [isLoadingMoreWithdraws, setIsLoadingMoreWithdraws] = useState(false);

  const canLoadMoreDeposits = useMemo(() => depositRows.length < depositCount, [depositRows.length, depositCount]);
  const canLoadMoreWithdraws = useMemo(() => withdrawRows.length < withdrawCount, [withdrawRows.length, withdrawCount]);

  const loadInitial = async () => {
    setIsLoading(true);
    setDepositOffset(0);
    setWithdrawOffset(0);

    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const qs = q.trim() ? `&q=${encodeURIComponent(q.trim())}` : '';

    const [depRes, wdRes] = await Promise.all([
      fetch(`/api/admin/records?type=deposit&limit=7&offset=0${qs}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json().catch(() => null)),
      fetch(`/api/admin/records?type=withdraw&limit=7&offset=0${qs}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json().catch(() => null)),
    ]);

    const dep = depRes as RecordsResponse | null;
    const wd = wdRes as RecordsResponse | null;

    if (dep?.success) {
      setDepositRows(Array.isArray(dep.records) ? dep.records : []);
      setDepositTotal(Number(dep.totalAmount || 0));
      setDepositCount(Number(dep.totalCount || 0));
    } else {
      setDepositRows([]);
      setDepositTotal(0);
      setDepositCount(0);
    }

    if (wd?.success) {
      setWithdrawRows(Array.isArray(wd.records) ? wd.records : []);
      setWithdrawTotal(Number(wd.totalAmount || 0));
      setWithdrawCount(Number(wd.totalCount || 0));
    } else {
      setWithdrawRows([]);
      setWithdrawTotal(0);
      setWithdrawCount(0);
    }

    setIsLoading(false);
  };

  const loadMoreDeposits = async () => {
    if (isLoadingMoreDeposits || !canLoadMoreDeposits) return;
    try {
      setIsLoadingMoreDeposits(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const nextOffset = depositRows.length;
      const qs = q.trim() ? `&q=${encodeURIComponent(q.trim())}` : '';
      const res = await fetch(`/api/admin/records?type=deposit&limit=50&offset=${nextOffset}${qs}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => null)) as RecordsResponse | null;
      if (data?.success && Array.isArray(data.records)) {
        setDepositRows((prev) => [...prev, ...data.records!]);
        setDepositOffset(nextOffset);
      }
    } finally {
      setIsLoadingMoreDeposits(false);
    }
  };

  const loadMoreWithdraws = async () => {
    if (isLoadingMoreWithdraws || !canLoadMoreWithdraws) return;
    try {
      setIsLoadingMoreWithdraws(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const nextOffset = withdrawRows.length;
      const qs = q.trim() ? `&q=${encodeURIComponent(q.trim())}` : '';
      const res = await fetch(`/api/admin/records?type=withdraw&limit=50&offset=${nextOffset}${qs}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => null)) as RecordsResponse | null;
      if (data?.success && Array.isArray(data.records)) {
        setWithdrawRows((prev) => [...prev, ...data.records!]);
        setWithdrawOffset(nextOffset);
      }
    } finally {
      setIsLoadingMoreWithdraws(false);
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
        const data = await res.json().catch(() => null);
        if (!data?.success) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }

        if (!cancelled) {
          await loadInitial();
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
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadInitial();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="min-h-screen text-slate-50">
      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Records</h1>
              <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                Approved request-based deposits and withdrawals (last 7 by default).
              </p>
            </div>
            <a
              href="/admin"
              className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] text-slate-100 hover:border-slate-500"
            >
              Back
            </a>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-[11px] text-slate-400">Search user (id / name / email / referral)</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
              placeholder="Search..."
            />
          </div>
        </div>
      </section>

      <section className="bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Deposit Records</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Total: ${depositTotal.toFixed(2)} · Count: {depositCount}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full divide-y divide-slate-800 text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {isLoading ? (
                      <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">Loading...</td></tr>
                    ) : depositRows.length === 0 ? (
                      <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">No deposit records.</td></tr>
                    ) : (
                      depositRows.map((r) => (
                        <tr key={`dep-${r.id}`}>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-100">{r.email || r.userName || `User #${r.userId}`}</div>
                            <div className="text-[10px] text-slate-500">#{r.userId} · {r.referralCode || '-'}</div>
                          </td>
                          <td className="px-3 py-2 text-emerald-400 font-semibold">${Number(r.amount || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-slate-400">{fmtDate(r.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-800 px-4 py-3">
                <div className="text-[11px] text-slate-500">Showing {depositRows.length} of {depositCount}</div>
                <button
                  type="button"
                  onClick={loadMoreDeposits}
                  disabled={!canLoadMoreDeposits || isLoadingMoreDeposits}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] text-slate-100 hover:border-slate-500 disabled:opacity-50"
                >
                  {isLoadingMoreDeposits ? 'Loading...' : canLoadMoreDeposits ? 'Load more' : 'No more'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Withdrawal Records</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Total: ${withdrawTotal.toFixed(2)} · Count: {withdrawCount}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full divide-y divide-slate-800 text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {isLoading ? (
                      <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">Loading...</td></tr>
                    ) : withdrawRows.length === 0 ? (
                      <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">No withdrawal records.</td></tr>
                    ) : (
                      withdrawRows.map((r) => (
                        <tr key={`wd-${r.id}`}>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-100">{r.email || r.userName || `User #${r.userId}`}</div>
                            <div className="text-[10px] text-slate-500">#{r.userId} · {r.referralCode || '-'}</div>
                          </td>
                          <td className="px-3 py-2 text-rose-300 font-semibold">${Number(r.amount || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-slate-400">{fmtDate(r.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-800 px-4 py-3">
                <div className="text-[11px] text-slate-500">Showing {withdrawRows.length} of {withdrawCount}</div>
                <button
                  type="button"
                  onClick={loadMoreWithdraws}
                  disabled={!canLoadMoreWithdraws || isLoadingMoreWithdraws}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] text-slate-100 hover:border-slate-500 disabled:opacity-50"
                >
                  {isLoadingMoreWithdraws ? 'Loading...' : canLoadMoreWithdraws ? 'Load more' : 'No more'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
