'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type PendingWithdrawal = {
  id: string;
  amount: number;
  address: string;
  createdAt: string;
  status: 'Pending' | 'Reviewing' | 'Processing';
  txHash?: string;
  adminNote?: string | null;
};

type WithdrawalHistory = {
  id: string;
  amount: number;
  address: string;
  fullAddress?: string;
  createdAt: string;
  createdAtRaw?: string;
  updatedAtRaw?: string;
  status: 'Successful' | 'Rejected' | 'Failed';
  txHash?: string;
  adminNote?: string | null;
};

function shortHash(hash?: string) {
  if (!hash) return '';
  if (hash.length <= 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export default function WithdrawPage() {
  const [available, setAvailable] = useState(0);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [withdrawHoldNote, setWithdrawHoldNote] = useState<string | null>(null);
  const [withdrawLimitNote, setWithdrawLimitNote] = useState<string | null>(null);
  const [minWithdrawalLimit, setMinWithdrawalLimit] = useState<number>(10);
  const [maxWithdrawalLimit, setMaxWithdrawalLimit] = useState<number | null>(null);
  const [savedAddresses] = useState<string[]>([]); // demo stored address

  const [pending, setPending] = useState<PendingWithdrawal[]>([]);
  const [expandedPendingId, setExpandedPendingId] = useState<string>('');

  const [history, setHistory] = useState<WithdrawalHistory[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string>('');
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const getLimitError = (num: number) => {
    if (!Number.isFinite(num) || num <= 0) return 'Withdrawal amount must be positive.';
    if (num < minWithdrawalLimit) return `Minimum withdrawal is ${minWithdrawalLimit} USDT.`;
    if (maxWithdrawalLimit !== null && num > maxWithdrawalLimit) return `Maximum withdrawal is ${maxWithdrawalLimit} USDT.`;
    return '';
  };

  const pendingTotal = useMemo(
    () => pending.reduce((sum, w) => sum + w.amount, 0),
    [pending]
  );

  const withdrawable = useMemo(
    () => Math.max(0, available - pendingTotal),
    [available, pendingTotal]
  );

  const totalWithdrawn = useMemo(
    () =>
      history.reduce(
        (sum, h) => (h.status === 'Successful' ? sum + h.amount : sum),
        0
      ),
    [history]
  );

  const pendingSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (!cancelled) setAvailable(0);
          return;
        }

        const res = await fetch('/api/user/summary', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled) {
          if (data?.success) {
            setAvailable(Number(data?.wallet?.balance || 0));
          } else {
            setAvailable(0);
          }
        }
      } catch {
        if (!cancelled) {
          setAvailable(0);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLimits = async () => {
      try {
        const res = await fetch('/api/public/withdrawal-limits', {
          method: 'GET',
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!data?.success) return;

        const settings = data?.settings || {};
        const min = Number(settings?.min);
        const max = settings?.max === null || settings?.max === undefined || settings?.max === '' ? null : Number(settings?.max);
        const note = settings?.note != null ? String(settings.note) : '';

        if (Number.isFinite(min) && min >= 0) setMinWithdrawalLimit(Math.round(min * 100) / 100);
        if (max !== null && Number.isFinite(max) && max > 0) setMaxWithdrawalLimit(Math.round(max * 100) / 100);
        if (max === null) setMaxWithdrawalLimit(null);
        setWithdrawLimitNote(note.trim() ? note.trim() : null);
      } catch {
        // ignore
      }
    };

    loadLimits();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadWithdrawalRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setPending([]);
        setExpandedPendingId('');
        setHistory([]);
        return;
      }

      const res = await fetch('/api/user/withdrawal-requests?limit=200', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!data?.success || !Array.isArray(data?.requests)) {
        setPending([]);
        setHistory([]);
        return;
      }

      const pendingRows: PendingWithdrawal[] = [];
      const historyRows: WithdrawalHistory[] = [];

      for (const r of data.requests) {
        const statusRaw = String(r.status || '').toLowerCase();
        const createdAtRaw = r.createdAt ? String(r.createdAt) : '';
        const updatedAtRaw = r.updatedAt ? String(r.updatedAt) : '';
        const createdAtStr = createdAtRaw
          ? String(r.createdAt).slice(0, 16).replace('T', ' ')
          : '';

        if (statusRaw === 'pending' || statusRaw === 'processing') {
          pendingRows.push({
            id: String(r.id),
            amount: Number(r.amount || 0),
            address: String(r.address || ''),
            createdAt: createdAtStr,
            status: statusRaw === 'processing' ? 'Processing' : 'Pending',
            txHash: r.txHash != null ? String(r.txHash) : undefined,
            adminNote: r.adminNote != null ? String(r.adminNote) : null,
          });
          continue;
        }

        historyRows.push({
          id: String(r.id),
          amount: Number(r.amount || 0),
          address: String(r.address || ''),
          fullAddress: String(r.address || ''),
          createdAt: createdAtStr,
          createdAtRaw,
          updatedAtRaw,
          status:
            statusRaw === 'completed' || statusRaw === 'approved'
              ? 'Successful'
              : statusRaw === 'rejected'
              ? 'Rejected'
              : 'Failed',
          txHash: r.txHash != null ? String(r.txHash) : undefined,
          adminNote: r.adminNote != null ? String(r.adminNote) : null,
        });
      }

      setPending(pendingRows);
      setExpandedPendingId((prev) => (pendingRows.some((p) => p.id === prev) ? prev : ''));
      setHistory(historyRows);
      setExpandedHistoryId((prev) => (historyRows.some((h) => h.id === prev) ? prev : ''));
    } catch {
      setPending([]);
      setExpandedPendingId('');
      setHistory([]);
      setExpandedHistoryId('');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadWithdrawalRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWithdrawAll = () => {
    setAmount(withdrawable.toFixed(2));
  };

  const validateAddress = (addr: string) => {
    if (!addr.startsWith('0x') || addr.length !== 42 || /\s/.test(addr)) {
      return 'Invalid BEP20 address. Please enter a correct BNB Smart Chain address.';
    }
    return '';
  };

  const validateAmount = (value: string) => {
    const num = parseFloat(value || '0');
    const limitErr = getLimitError(num);
    if (limitErr) return limitErr;
    if (num > withdrawable) {
      return 'Insufficient balance.';
    }
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddressError('');
    setAmountError('');
    setWithdrawHoldNote(null);
    setWithdrawLimitNote((prev) => prev);

    const addrErr = validateAddress(address.trim());
    const amtErr = validateAmount(amount);
    if (addrErr || amtErr) {
      setAddressError(addrErr);
      setAmountError(amtErr);
      return;
    }

    const num = parseFloat(amount);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setAmountError('You must be logged in to submit a withdrawal request.');
      return;
    }

    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: num,
          address: address.trim(),
        }),
      });

      const data = await res.json();
      if (!data?.success) {
        if (String(data?.code || '') === 'WITHDRAWAL_HOLD') {
          const note = data?.holdNote != null ? String(data.holdNote) : '';
          setWithdrawHoldNote(note || null);
          setAmountError(typeof data?.message === 'string' ? data.message : 'Withdrawals are currently on hold');
          return;
        }

        if (String(data?.code || '') === 'WITHDRAW_LIMIT') {
          const note = data?.limitNote != null ? String(data.limitNote) : '';
          setWithdrawLimitNote(note.trim() ? note.trim() : withdrawLimitNote);
          const msg = typeof data?.message === 'string' ? data.message : 'Withdrawal amount is outside allowed limits';
          setAmountError(msg);
          return;
        }

        const msg = typeof data?.message === 'string' ? data.message : 'Failed to submit withdrawal request';
        setAmountError(msg);
        return;
      }

      const r = data.request || {};
      const createdAtStr = r.createdAt
        ? String(r.createdAt).slice(0, 16).replace('T', ' ')
        : new Date().toISOString().slice(0, 16).replace('T', ' ');

      const newReq: PendingWithdrawal = {
        id: String(r.id ?? `WD-${Date.now()}`),
        amount: Number(r.amount ?? num),
        address: String(r.address ?? address.trim()),
        createdAt: createdAtStr,
        status: 'Pending',
      };

      setPending((prev) => [newReq, ...prev]);
      setAmount('');

      await loadWithdrawalRequests();

      if (pendingSectionRef.current) {
        pendingSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      setAmountError('An error occurred while submitting your withdrawal request. Please try again.');
    }
  };

  const handleCopyTx = async (hash?: string) => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      // Silent copy for now
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-page text-fg">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border bg-theme-hero backdrop-blur-sm">
        <div className="absolute inset-0 bg-theme-hero-overlay opacity-60" />
        <div className="relative mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            WITHDRAWALS
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Withdraw Funds
          </h1>
          <p className="mt-2 text-sm text-muted md:text-base">
            Withdraw your available USDT balance to a BNB Smart Chain (BEP20)
            address. Most withdrawals are processed instantly (within minutes). If
            additional review is required, it may take 1–2 hours (rarely up to 24
            hours).
          </p>
        </div>
      </section>

      {/* Balance overview */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Your Withdrawable Balance
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent opacity-80" />
              <p className="text-[11px] text-muted">Withdrawable Balance</p>
              <p className="mt-1 text-lg font-semibold text-secondary">
                ${withdrawable.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-subtle">
                Includes daily rewards, referral and bonus earnings
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warning/70 to-transparent opacity-80" />
              <p className="text-[11px] text-muted">Pending Withdrawals</p>
              <p className="mt-1 text-lg font-semibold text-warning">
                ${pendingTotal.toFixed(2)}
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent opacity-80" />
              <p className="text-[11px] text-muted">Total Withdrawn (All Time)</p>
              <p className="mt-1 text-lg font-semibold text-heading">
                ${totalWithdrawn.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleWithdrawAll}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-border px-4 py-1.5 text-[11px] font-medium text-fg transition hover:border-border2 hover:shadow-theme-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
          >
            Withdraw All
          </button>
        </div>
      </section>

      {/* Processing time notice */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-muted md:text-sm">
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent opacity-80" />
            <p className="text-[11px] font-semibold text-heading">
              ⏱ Withdrawal Processing Time
            </p>
            <p className="mt-2 text-[11px] text-muted">
              Most withdrawals are processed <span className="font-semibold">instantly (within minutes)</span>.
              If additional review is required, it may take <span className="font-semibold">1–2 hours</span>.
              In rare cases, processing can take up to <span className="font-semibold">24 hours</span>.
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Automated checks run instantly, and some withdrawals may require a brief manual review for security.
            </p>
          </div>
        </div>
      </section>

      {/* Network warning */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-muted md:text-sm">
          <div className="group relative overflow-hidden rounded-2xl border border-danger/40 bg-danger/10 p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-theme-md">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-danger/70 to-transparent opacity-80" />
            <p className="text-[11px] font-semibold text-danger">
              ⚠ IMPORTANT — Network Requirement
            </p>
            <p className="mt-2 text-[11px] text-danger/90">
              Withdrawals are processed only on BNB Smart Chain (BEP20). Using an
              address from another network (ERC20, TRC20, etc.) may lead to
              permanent loss of funds.
            </p>
          </div>
        </div>
      </section>

      {/* Withdrawal form */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Submit Withdrawal Request
          </h2>

          {withdrawLimitNote && amountError && (amountError.toLowerCase().includes('minimum withdrawal') || amountError.toLowerCase().includes('maximum withdrawal')) ? (
            <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-[11px] text-warning">
              <div className="font-semibold">Admin Instructions</div>
              <div className="mt-1 whitespace-pre-wrap text-warning/90">{withdrawLimitNote}</div>
            </div>
          ) : null}

          {withdrawHoldNote && (
            <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-[11px] text-warning">
              <div className="font-semibold">Withdrawals are currently on hold for your account.</div>
              <div className="mt-1 whitespace-pre-wrap text-warning/90">{withdrawHoldNote}</div>
            </div>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-[11px] text-muted" htmlFor="address">
                USDT (BEP20) Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => {
                  const val = e.target.value.replace(/\s+/g, '');
                  setAddress(val);
                  setAddressError('');
                }}
                list="saved-addresses"
                className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-fg outline-none transition focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
                placeholder="0x4F3C...9A27"
                required
              />
              {savedAddresses.length > 0 && (
                <datalist id="saved-addresses">
                  {savedAddresses.map((a) => (
                    <option value={a} key={a} />
                  ))}
                </datalist>
              )}
              {addressError && (
                <p className="mt-1 text-[10px] text-danger">{addressError}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
                <input
                  id="save-address"
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-3 w-3 rounded border-border bg-surface"
                />
                <label htmlFor="save-address">Save this withdrawal address for next time</label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-muted" htmlFor="amount">
                Withdrawal Amount (USDT)
              </label>
              <input
                id="amount"
                type="number"
                min={minWithdrawalLimit}
                max={maxWithdrawalLimit ?? undefined}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  const next = e.target.value;
                  setAmount(next);
                  const raw = e.target.value;
                  const n = parseFloat(raw || '0');
                  const limitErr = getLimitError(n);
                  setAmountError(limitErr);
                }}
                className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-fg outline-none transition focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
                placeholder={`Enter amount (min ${minWithdrawalLimit} USDT)`}
                required
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-subtle">
                <span>Withdrawable: ${withdrawable.toFixed(2)}</span>
                <span>
                  Minimum withdrawal: {minWithdrawalLimit} USDT
                  {maxWithdrawalLimit !== null ? ` · Maximum: ${maxWithdrawalLimit} USDT` : ''}
                </span>
              </div>
              {amountError && (
                <p className="mt-1 text-[10px] text-danger">{amountError}</p>
              )}
            </div>

            <div className="text-[11px] text-muted">
              BNB Smart Chain network gas fee will apply. Arbix does not charge any
              extra service fee.
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-theme-primary px-5 py-2 text-xs font-medium text-primary-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
            >
              Submit Withdrawal Request
            </button>
          </form>
        </div>
      </section>

      {/* Pending requests */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm" ref={pendingSectionRef}>
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Pending Withdrawals
          </h2>
          {isLoadingRequests ? (
            <p className="mt-2 text-muted">Loading...</p>
          ) : pending.length === 0 ? (
            <p className="mt-2 text-muted">You have no pending withdrawal requests.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {pending.map((w) => (
                <div
                  key={w.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedPendingId((prev) => (prev === w.id ? '' : w.id))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedPendingId((prev) => (prev === w.id ? '' : w.id));
                    }
                  }}
                  className={
                    'group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-3 text-[11px] text-muted shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-theme-md focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 cursor-pointer ' +
                    (expandedPendingId === w.id ? 'border-border2' : '')
                  }
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent opacity-80" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-heading">{w.id}</p>
                    <p className="text-muted">{w.createdAt}</p>
                  </div>
                  <p className="mt-1">
                    Amount:{' '}
                    <span className="font-semibold text-secondary">
                      ${w.amount.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-muted">Address: {shortHash(w.address)}</p>
                  <p className="mt-1 text-muted">
                    Status:{' '}
                    <span className="font-semibold">
                      {w.status === 'Pending'
                        ? 'Pending'
                        : w.status === 'Reviewing'
                        ? 'Reviewing'
                        : 'Processing'}
                    </span>
                  </p>

                  {expandedPendingId === w.id ? (
                    <div className="mt-3 rounded-xl border border-border bg-surface/40 p-3 text-[11px] text-muted">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="break-all">
                          <span className="text-subtle">Withdrawal Address:</span> {w.address}
                        </div>
                        <div>
                          <span className="text-subtle">Amount:</span>{' '}
                          <span className="font-semibold text-secondary">${w.amount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-subtle">Status:</span> {w.status}
                        </div>
                        <div>
                          <span className="text-subtle">Requested at:</span> {w.createdAt || '-'}
                        </div>
                        {w.txHash ? (
                          <div className="sm:col-span-2 break-all">
                            <span className="text-subtle">Tx Hash:</span> {w.txHash}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Withdrawal history */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Withdrawal History
          </h2>
          {isLoadingRequests ? (
            <p className="mt-2 text-muted">Loading...</p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-muted">No withdrawal history yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface/60 shadow-theme-sm transition-all duration-200 hover:border-border2 hover:shadow-theme-md">
              <table className="min-w-full divide-y divide-border text-[11px]">
                <thead className="bg-surface/60 text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Date / Time</th>
                    <th className="px-3 py-2 text-left">Address</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted">
                  {history.map((h) => (
                    <Fragment key={h.id}>
                      <tr
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedHistoryId((prev) => (prev === h.id ? '' : h.id))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedHistoryId((prev) => (prev === h.id ? '' : h.id));
                          }
                        }}
                        className="cursor-pointer hover:bg-surface/40"
                      >
                        <td className="px-3 py-2">{h.id}</td>
                        <td className="px-3 py-2">${h.amount.toFixed(2)}</td>
                        <td className="px-3 py-2">{h.createdAt}</td>
                        <td className="px-3 py-2">{shortHash(h.address)}</td>
                        <td className="px-3 py-2">
                          {h.status === 'Successful' && (
                            <span className="text-success">Successful</span>
                          )}
                          {h.status === 'Rejected' && (
                            <span className="text-danger">Rejected</span>
                          )}
                          {h.status === 'Failed' && (
                            <span className="text-warning">Failed</span>
                          )}
                          {h.adminNote ? (
                            <div className="mt-1 whitespace-pre-wrap text-[10px] text-muted">{h.adminNote}</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {h.txHash ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTx(h.txHash);
                              }}
                              title="Click to copy full Tx Hash"
                              className="text-primary transition hover:text-primary-hover"
                            >
                              {shortHash(h.txHash)}
                            </button>
                          ) : (
                            <span className="text-subtle">-</span>
                          )}
                        </td>
                      </tr>
                      {expandedHistoryId === h.id ? (
                        <tr className="bg-surface/20">
                          <td className="px-3 py-3" colSpan={6}>
                            <div className="rounded-xl border border-border bg-surface/40 p-3 text-[11px] text-muted">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="break-all">
                                  <span className="text-subtle">Withdrawal Address:</span> {h.fullAddress || h.address}
                                </div>
                                <div>
                                  <span className="text-subtle">Amount:</span>{' '}
                                  <span className="font-semibold text-secondary">${h.amount.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-subtle">Requested at:</span> {h.createdAtRaw ? String(h.createdAtRaw).slice(0, 19).replace('T', ' ') : h.createdAt || '-'}
                                </div>
                                <div>
                                  <span className="text-subtle">Updated at:</span> {h.updatedAtRaw ? String(h.updatedAtRaw).slice(0, 19).replace('T', ' ') : '-'}
                                </div>
                                {h.txHash ? (
                                  <div className="sm:col-span-2 break-all">
                                    <span className="text-subtle">Tx Hash:</span> {h.txHash}
                                  </div>
                                ) : null}
                                {h.adminNote ? (
                                  <div className="sm:col-span-2 whitespace-pre-wrap">
                                    <span className="text-subtle">Admin Note:</span> {h.adminNote}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Security notes */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-[11px] text-muted md:text-xs">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Important Security Notes
          </h2>
          <ul className="mt-2 space-y-1">
            <li>• Always double-check your wallet address before submitting.</li>
            <li>
              • Arbix cannot reverse transfers sent to the wrong or incompatible
              network address.
            </li>
            <li>• Most withdrawals are instant. If additional checks are required, it may take 1–2 hours (rarely up to 24 hours).</li>
            <li>• Arbix will never ask for your password or private key.</li>
            <li>• All withdrawal activities are logged for your protection.</li>
          </ul>
        </div>
      </section>

      {/* Support */}
      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Need Help with Your Withdrawal?
          </h2>
          <p className="mt-2 text-muted">
            If your withdrawal is delayed or you are unsure about the address
            format, contact our Support team and share your request ID.
          </p>
          <a
            href="/contact"
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-[11px] font-medium text-fg transition hover:border-border2 hover:shadow-theme-sm"
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}
