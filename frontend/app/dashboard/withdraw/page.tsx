'use client';

import { useRef, useState } from 'react';

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
  // Demo balances (later from backend)
  const [available, setAvailable] = useState(280.75);
  const [pendingTotal] = useState(50.0);
  const [totalWithdrawn] = useState(1250.0);

  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [savedAddresses] = useState<string[]>([ // demo stored address
    '0x4F3C8b12A1dE90c7187cBf9a2bCE13F29C9A9A27',
  ]);

  const [pending, setPending] = useState<PendingWithdrawal[]>([
    {
      id: 'WD-2025-001',
      amount: 30,
      address: '0x4F3C8b12A1dE90c7187cBf9a2bCE13F29C9A9A27',
      createdAt: '2025-12-01 10:45',
      status: 'Reviewing',
    },
    {
      id: 'WD-2025-002',
      amount: 20,
      address: '0xAbCd1234Ef567890aBCd1234Ef567890aBCd12Ef',
      createdAt: '2025-12-01 09:30',
      status: 'Pending',
    },
  ]);

  const [history] = useState<WithdrawalHistory[]>([
    {
      id: 'WD-2025-0001',
      amount: 100,
      address: '0x4F3C8b12A1dE90c7187cBf9a2bCE13F29C9A9A27',
      createdAt: '2025-11-30 21:10',
      status: 'Successful',
      txHash: '0xbadf00d1234567890abcdeffedcba09876543210',
    },
    {
      id: 'WD-2025-0002',
      amount: 50,
      address: '0x9a27bCDe1234567890AbCdEf1234567890AbCdEf',
      createdAt: '2025-11-29 18:20',
      status: 'Rejected',
    },
  ]);

  const pendingSectionRef = useRef<HTMLDivElement | null>(null);

  const handleWithdrawAll = () => {
    setAmount(available.toFixed(2));
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
    if (num > available) {
      return 'Insufficient balance.';
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addrErr = validateAddress(address.trim());
    const amtErr = validateAmount(amount);
    setAddressError(addrErr);
    setAmountError(amtErr);
    if (addrErr || amtErr) return;

    const num = parseFloat(amount);
    const newReq: PendingWithdrawal = {
      id: `WD-${Date.now()}`,
      amount: num,
      address: address.trim(),
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'Pending',
    };
    setPending((prev) => [newReq, ...prev]);
    setAvailable((prev) => prev - num);
    setAmount('');

    if (pendingSectionRef.current) {
      pendingSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // In real app: show toast / modal. Here we just rely on UI.
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
    <div className="bg-slate-950 text-slate-50">
      {/* Header */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            WITHDRAWALS
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Withdraw Funds
          </h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Withdraw your available USDT balance to a BNB Smart Chain (BEP20)
            address. All withdrawals are processed manually by the admin team for
            extra security.
          </p>
        </div>
      </section>

      {/* Balance overview */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Your Withdrawable Balance
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Available Balance</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                ${available.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Includes daily rewards, referral and bonus earnings
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Pending Withdrawals</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">
                ${pendingTotal.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
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
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4">
            <p className="text-[11px] font-semibold text-slate-100">
              ⏱ Withdrawal Processing Time
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              Withdrawals usually process within <span className="font-semibold">1–2 hours</span>.
              In rare cases, processing can take up to{' '}
              <span className="font-semibold">24 hours</span>.
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Arbix admin reviews each withdrawal manually to ensure security and to
              prevent fraudulent activity.
            </p>
          </div>
        </div>
      </section>

      {/* Network warning */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="rounded-2xl border border-red-500/70 bg-red-950/30 p-4">
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
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Submit Withdrawal Request
          </h2>

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
                <span>Available: ${available.toFixed(2)}</span>
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
      <section className="border-b border-slate-800 bg-slate-950" ref={pendingSectionRef}>
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Pending Withdrawals
          </h2>
          {pending.length === 0 ? (
            <p className="mt-2 text-slate-400">You have no pending withdrawal requests.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {pending.map((w) => (
                <div
                  key={w.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] text-slate-300"
                >
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
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Withdrawal History
          </h2>
          {history.length === 0 ? (
            <p className="mt-2 text-slate-400">No withdrawal history yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
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
      <section className="border-b border-slate-800 bg-slate-950">
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
            <li>• Withdrawals may take 1–2 hours, with a maximum of 24 hours.</li>
            <li>• Arbix will never ask for your password or private key.</li>
            <li>• All withdrawal activities are logged for your protection.</li>
          </ul>
        </div>
      </section>

      {/* Support */}
      <section className="bg-slate-950">
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
