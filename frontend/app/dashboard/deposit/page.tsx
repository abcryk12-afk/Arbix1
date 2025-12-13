'use client';

import { useEffect, useMemo, useState } from 'react';
import RequireAuth from '../components/RequireAuth';

function DepositPage() {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [copied, setCopied] = useState(false);

  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pendingDeposits = 0;
  const totalDeposited = 0;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setWalletAddress(u?.walletAddress || '');
        }
      } catch {
        // ignore
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (!cancelled) setIsLoading(false);
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
            setWalletBalance(Number(data?.wallet?.balance || 0));
            setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
          } else {
            setWalletBalance(0);
            setTransactions([]);
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setWalletBalance(0);
          setTransactions([]);
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const depositTransactions = useMemo(() => {
    return transactions
      .filter((t) => t?.type === 'deposit')
      .map((t) => ({
        id: String(t.id),
        amount: Number(t.amount || 0),
        createdAt: t.createdAt ? new Date(t.createdAt) : null,
        note: t.note || null,
      }));
  }, [transactions]);

  const handleGenerateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount || '0');
    if (isNaN(value) || value < 10) {
      setAmountError('Minimum deposit required: 10 USDT');
      return;
    }
    setAmountError('');
    const el = document.getElementById('deposit-address-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopy = async () => {
    try {
      if (!walletAddress) return;
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
    : 'Not assigned';

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Header */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            WALLET
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Deposit Funds (USDT – BEP20)
          </h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Deposit USDT (BEP20 – BNB Smart Chain) into your Arbix Wallet. Minimum
            deposit: <span className="font-semibold">10 USDT</span>.
          </p>
        </div>
      </section>

      {/* Wallet Overview */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Your Arbix Wallet (Permanent Deposit Address)
          </h2>
          <p className="mt-2 text-slate-400">
            When you registered, a dedicated blockchain wallet was automatically
            created for your account. This wallet&apos;s public address is your
            permanent deposit address for all future USDT (BEP20) deposits.
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• The deposit address below is unique to your account.</li>
            <li>• All future deposits should be sent to the same address.</li>
            <li>• The wallet private key is stored in encrypted form in the system.</li>
            <li>• System-level secured access is limited to authorised admin tools.</li>
          </ul>
        </div>
      </section>

      {/* Balance Summary */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Wallet Balance</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {walletBalance.toFixed(2)} USDT
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Available for investments &amp; withdrawals
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Pending Deposits</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">
                {pendingDeposits.toFixed(2)} USDT
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Waiting for confirmations
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Total Deposited</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {totalDeposited.toFixed(2)} USDT
              </p>
              <p className="mt-1 text-[11px] text-slate-500">All-time total</p>
            </div>
          </div>
        </div>
      </section>

      {/* New Deposit Form */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">New Deposit</h2>
          <p className="mt-2 text-xs text-slate-400 md:text-sm">
            Follow the steps below to create a new deposit.
          </p>

          <form
            className="mt-4 space-y-4 text-xs text-slate-300"
            onSubmit={handleGenerateAddress}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">
                  Network
                </label>
                <input
                  value="BNB Smart Chain (BEP20)"
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-300"
                />
                <p className="mt-1 text-[10px] text-red-400">
                  Wrong network may result in permanent loss of funds.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">
                  Token
                </label>
                <input
                  value="USDT (BEP20)"
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="amount">
                Amount (USDT)
              </label>
              <input
                id="amount"
                type="number"
                min={10}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Enter amount (minimum 10 USDT)"
              />
              {amountError && (
                <p className="mt-1 text-[10px] text-red-400">{amountError}</p>
              )}
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
            >
              Next: Generate Deposit Address
            </button>

            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
              <span>Step 1: Enter amount</span>
              <span>Step 2: Generate deposit address</span>
              <span>Step 3: Send USDT and wait for confirmations</span>
            </div>
          </form>
        </div>
      </section>

      {/* Deposit Address + QR */}
      <section
        id="deposit-address-section"
        className="border-b border-slate-800 bg-slate-950"
      >
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Send USDT (BEP20) to Your Address
          </h2>
          <p className="mt-2 text-xs text-slate-400 md:text-sm">
            This is your unique Arbix deposit address. You can use the same address
            for all future deposits.
          </p>

          <div className="mt-4 grid gap-4 text-xs text-slate-300 md:grid-cols-[2fr,1fr]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] text-slate-400">Deposit Address</p>
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px] md:text-xs">
                  <span className="truncate text-slate-100" title={walletAddress}>
                    {shortAddress}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-100 hover:border-slate-500"
                    type="button"
                    disabled={!walletAddress}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] text-slate-400">
                <p>
                  Scan this address in your wallet app (Trust Wallet, Binance,
                  MetaMask, etc.) and send only USDT on BNB Smart Chain (BEP20).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/70 text-[10px] text-slate-500">
                QR CODE
                <br />
                (placeholder)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Critical Instructions */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <div className="rounded-2xl border border-red-500/60 bg-red-950/20 p-4 text-xs text-red-100 md:text-sm">
            <p className="font-semibold">⚠ Important Deposit Instructions</p>
            <ul className="mt-2 space-y-1 text-red-100/90">
              <li>• Send only USDT on BNB Smart Chain (BEP20).</li>
              <li>
                • Do <span className="font-semibold">not</span> send ERC20 / TRC20 / Polygon or any other
                network tokens.
              </li>
              <li>• Minimum deposit: 10 USDT. Smaller deposits will not be credited.</li>
              <li>• Wrong network may result in permanent loss of funds.</li>
              <li>• Typical confirmation time: 5–15 minutes, depending on network load.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Live Status + Overview */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Deposit Status
          </h2>
          <p className="mt-2 text-slate-400">
            The system periodically checks the blockchain for new transactions to
            your address and updates statuses automatically.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-300">
              • Waiting for payment
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-300">
              • Pending confirmations
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-emerald-400">
              • Deposit successful
            </span>
          </div>

          <div className="mt-5 grid gap-3 text-[11px] text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-slate-400">Pending Deposits</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">0</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-slate-400">Processing</p>
              <p className="mt-1 text-lg font-semibold text-sky-400">0</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-slate-400">Successful (30 days)</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">{depositTransactions.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deposit History */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Recent Deposit History
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Date / Time</th>
                  <th className="px-3 py-2 text-left">Amount (USDT)</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Tx Hash</th>
                  <th className="px-3 py-2 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {depositTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      {isLoading ? 'Loading...' : 'No deposits yet'}
                    </td>
                  </tr>
                ) : (
                  depositTransactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-3 py-2">
                        {t.createdAt ? t.createdAt.toISOString().replace('T', ' ').slice(0, 19) : '-'}
                      </td>
                      <td className="px-3 py-2">{t.amount.toFixed(2)}</td>
                      <td className="px-3 py-2 text-emerald-400">Successful</td>
                      <td className="px-3 py-2">-</td>
                      <td className="px-3 py-2 text-right text-slate-400">{t.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            If Your Deposit Is Not Showing
          </h2>
          <p className="mt-2 text-slate-400">
            If your deposit is not visible after 30–40 minutes:
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• Check the transaction hash on the blockchain explorer.</li>
            <li>• Verify the number of confirmations on BNB Smart Chain.</li>
            <li>• Contact Support and share your transaction hash and details.</li>
          </ul>
          <a
            href="/contact"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-500"
          >
            Contact Support
          </a>
        </div>
      </section>

      {/* Security Notes */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Security Notice
          </h2>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• Wallet private keys are encrypted and never shared with users.</li>
            <li>• Only system-level services can access wallet operations.</li>
            <li>• Arbix team will never ask for your password, OTP or private key.</li>
            <li>• The website uses SSL encryption for all communication.</li>
            <li>• All deposit attempts are logged in transaction and admin audit logs.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

// Wrap the deposit page with RequireAuth
export default function DepositWithAuth() {
  return (
    <RequireAuth>
      <DepositPage />
    </RequireAuth>
  );
}
