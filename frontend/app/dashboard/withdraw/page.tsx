'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type PendingWithdrawal = {
  id: string;
  amount: number;
  address: string;
  createdAt: string;
  status: 'Pending' | 'Reviewing' | 'Processing';
};

type WithdrawalHistory = {
  id: string;
  amount: number;
  address: string;
  createdAt: string;
  status: 'Successful' | 'Rejected' | 'Failed';
  txHash?: string;
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
  const [savedAddresses] = useState<string[]>([]); // demo stored address

  const [pending, setPending] = useState<PendingWithdrawal[]>([]);

  const [history, setHistory] = useState<WithdrawalHistory[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

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

  const loadWithdrawalRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setPending([]);
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
        const createdAtStr = r.createdAt
          ? String(r.createdAt).slice(0, 16).replace('T', ' ')
          : '';

        if (statusRaw === 'pending' || statusRaw === 'processing') {
          pendingRows.push({
            id: String(r.id),
            amount: Number(r.amount || 0),
            address: String(r.address || ''),
            createdAt: createdAtStr,
            status: statusRaw === 'processing' ? 'Processing' : 'Pending',
          });
          continue;
        }

        historyRows.push({
          id: String(r.id),
          amount: Number(r.amount || 0),
          address: String(r.address || ''),
          createdAt: createdAtStr,
          status:
            statusRaw === 'completed' || statusRaw === 'approved'
              ? 'Successful'
              : statusRaw === 'rejected'
              ? 'Rejected'
              : 'Failed',
          txHash: r.txHash != null ? String(r.txHash) : undefined,
        });
      }

      setPending(pendingRows);
      setHistory(historyRows);
    } catch {
      setPending([]);
      setHistory([]);
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
    if (isNaN(num) || num < 10) {
      return 'Minimum withdrawal is 10 USDT.';
    }
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
    <div className="bg-transparent text-slate-50">
      {/* Header */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950/60 via-slate-950/50 to-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            WITHDRAWALS
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Withdraw Funds
          </h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Withdraw your available USDT balance to a BNB Smart Chain (BEP20)
            address. Most withdrawals are processed instantly (within minutes). If
            additional review is required, it may take 1–2 hours (rarely up to 24
            hours).
          </p>
        </div>
      </section>

      {/* Balance overview */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Your Withdrawable Balance
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/60">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-80" />
              <p className="text-[11px] text-slate-400">Withdrawable Balance</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                ${withdrawable.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Includes daily rewards, referral and bonus earnings
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/60">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent opacity-80" />
              <p className="text-[11px] text-slate-400">Pending Withdrawals</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">
                ${pendingTotal.toFixed(2)}
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/60">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/60 to-transparent opacity-80" />
              <p className="text-[11px] text-slate-400">Total Withdrawn (All Time)</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                ${totalWithdrawn.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleWithdrawAll}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-1.5 text-[11px] font-medium text-slate-100 hover:border-slate-500"
          >
            Withdraw All
          </button>
        </div>
      </section>

      {/* Processing time notice */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900/80">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/60 to-transparent opacity-80" />
            <p className="text-[11px] font-semibold text-slate-100">
              ⏱ Withdrawal Processing Time
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              Most withdrawals are processed <span className="font-semibold">instantly (within minutes)</span>.
              If additional review is required, it may take <span className="font-semibold">1–2 hours</span>.
              In rare cases, processing can take up to <span className="font-semibold">24 hours</span>.
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Automated checks run instantly, and some withdrawals may require a brief manual review for security.
            </p>
          </div>
        </div>
      </section>

      {/* Network warning */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="group relative overflow-hidden rounded-2xl border border-red-500/70 bg-red-950/30 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-950/50">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent opacity-80" />
            <p className="text-[11px] font-semibold text-red-100">
              ⚠ IMPORTANT — Network Requirement
            </p>
            <p className="mt-2 text-[11px] text-red-100/90">
              Withdrawals are processed only on BNB Smart Chain (BEP20). Using an
              address from another network (ERC20, TRC20, etc.) may lead to
              permanent loss of funds.
            </p>
          </div>
        </div>
      </section>

      {/* Withdrawal form */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Submit Withdrawal Request
          </h2>

          {withdrawHoldNote && (
            <div className="mt-4 rounded-2xl border border-amber-500/60 bg-amber-950/20 p-4 text-[11px] text-amber-200">
              <div className="font-semibold">Withdrawals are currently on hold for your account.</div>
              <div className="mt-1 whitespace-pre-wrap text-amber-200/90">{withdrawHoldNote}</div>
            </div>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="address">
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
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
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
                <p className="mt-1 text-[10px] text-red-400">{addressError}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <input
                  id="save-address"
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-3 w-3 rounded border-slate-700 bg-slate-900"
                />
                <label htmlFor="save-address">Save this withdrawal address for next time</label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="amount">
                Withdrawal Amount (USDT)
              </label>
              <input
                id="amount"
                type="number"
                min={10}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountError('');
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Enter amount (min 10 USDT)"
                required
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>Withdrawable: ${withdrawable.toFixed(2)}</span>
                <span>Minimum withdrawal: 10 USDT</span>
              </div>
              {amountError && (
                <p className="mt-1 text-[10px] text-red-400">{amountError}</p>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              BNB Smart Chain network gas fee will apply. Arbix does not charge any
              extra service fee.
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
            >
              Submit Withdrawal Request
            </button>
          </form>
        </div>
      </section>

      {/* Pending requests */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm" ref={pendingSectionRef}>
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Pending Withdrawals
          </h2>
          {isLoadingRequests ? (
            <p className="mt-2 text-slate-400">Loading...</p>
          ) : pending.length === 0 ? (
            <p className="mt-2 text-slate-400">You have no pending withdrawal requests.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {pending.map((w) => (
                <div
                  key={w.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/60"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-600/70 to-transparent opacity-80" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-100">{w.id}</p>
                    <p className="text-slate-400">{w.createdAt}</p>
                  </div>
                  <p className="mt-1">
                    Amount:{' '}
                    <span className="font-semibold text-emerald-400">
                      ${w.amount.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-slate-400">Address: {shortHash(w.address)}</p>
                  <p className="mt-1 text-slate-400">
                    Status:{' '}
                    <span className="font-semibold">
                      {w.status === 'Pending'
                        ? 'Pending'
                        : w.status === 'Reviewing'
                        ? 'Reviewing'
                        : 'Processing'}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Withdrawal history */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Withdrawal History
          </h2>
          {isLoadingRequests ? (
            <p className="mt-2 text-slate-400">Loading...</p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-slate-400">No withdrawal history yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-[0_0_0_1px_rgba(15,23,42,0.7)] transition-shadow duration-200 hover:shadow-[0_0_35px_rgba(59,130,246,0.35)]">
              <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                <thead className="bg-slate-950/80 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Date / Time</th>
                    <th className="px-3 py-2 text-left">Address</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-3 py-2">{h.id}</td>
                      <td className="px-3 py-2">${h.amount.toFixed(2)}</td>
                      <td className="px-3 py-2">{h.createdAt}</td>
                      <td className="px-3 py-2">{shortHash(h.address)}</td>
                      <td className="px-3 py-2">
                        {h.status === 'Successful' && (
                          <span className="text-emerald-400">Successful</span>
                        )}
                        {h.status === 'Rejected' && (
                          <span className="text-red-400">Rejected</span>
                        )}
                        {h.status === 'Failed' && (
                          <span className="text-amber-400">Failed</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {h.txHash ? (
                          <button
                            type="button"
                            onClick={() => handleCopyTx(h.txHash)}
                            title="Click to copy full Tx Hash"
                            className="text-primary hover:text-blue-400"
                          >
                            {shortHash(h.txHash)}
                          </button>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Security notes */}
      <section className="border-b border-slate-800 bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-[11px] text-slate-400 md:text-xs">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
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
      <section className="bg-slate-950/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Need Help with Your Withdrawal?
          </h2>
          <p className="mt-2 text-slate-400">
            If your withdrawal is delayed or you are unsure about the address
            format, contact our Support team and share your request ID.
          </p>
          <a
            href="/contact"
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-[11px] font-medium text-slate-100 hover:border-slate-500"
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}
