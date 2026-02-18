'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [copied, setCopied] = useState(false);

  const [minDepositUsdt, setMinDepositUsdt] = useState<number>(10);
  const [confirmations, setConfirmations] = useState<number>(12);
  const [depositRequestTtlMinutes, setDepositRequestTtlMinutes] = useState<number>(30);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [addressGenerated, setAddressGenerated] = useState(false);

  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitMessageType, setSubmitMessageType] = useState<'success' | 'error' | ''>('');
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatCountdown = (msRemaining: number) => {
    const ms = Math.max(0, Math.floor(msRemaining));
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isExpiredByTtl = (r: any) => {
    const ttlMs = Math.max(1, depositRequestTtlMinutes) * 60 * 1000;
    const createdMs = r?.createdAt ? new Date(r.createdAt).getTime() : NaN;
    return (
      String(r?.status || '').toLowerCase() === 'pending' &&
      !r?.txHash &&
      Number.isFinite(createdMs) &&
      (nowMs - createdMs) >= ttlMs
    );
  };

  const isExpiredStatus = (r: any) => {
    const status = String(r?.status || '').toLowerCase();
    const adminNote = String(r?.adminNote || '').toLowerCase();
    return status === 'rejected' && adminNote.includes('expired after');
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setWalletAddress(
            u?.wallet_public_address || u?.walletAddress || u?.walletPublicAddress || ''
          );
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

        try {
          const meRes = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const meData = await meRes.json();
          if (!cancelled && meData?.success && meData?.user) {
            setWalletAddress(meData.user?.wallet_public_address || '');
            try {
              localStorage.setItem('user', JSON.stringify(meData.user));
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
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
            if (data?.config) {
              const min = Number(data?.config?.minDepositUsdt ?? 10);
              const conf = Number(data?.config?.confirmations ?? 12);
              const ttl = Number(data?.config?.depositRequestTtlMinutes ?? 30);
              if (Number.isFinite(min) && min > 0) setMinDepositUsdt(min);
              if (Number.isFinite(conf) && conf > 0) setConfirmations(conf);
              if (Number.isFinite(ttl) && ttl > 0) setDepositRequestTtlMinutes(Math.floor(ttl));
            }
            setWalletBalance(Number(data?.wallet?.balance || 0));
            setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
            if (data?.wallet?.publicAddress || data?.wallet?.public_address) {
              setWalletAddress((prev) =>
                data?.wallet?.publicAddress || data?.wallet?.public_address || prev
              );
            }
          } else {
            setWalletBalance(0);
            setTransactions([]);
          }
          setIsLoading(false);
        }

        try {
          if (!cancelled) setIsLoadingRequests(true);

          const drRes = await fetch('/api/user/deposit-requests?status=all&limit=100', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const drData = await drRes.json();
          if (!cancelled) {
            if (drData?.success && Array.isArray(drData?.requests)) {
              setDepositRequests(drData.requests);
            } else {
              setDepositRequests([]);
            }
          }
        } catch {
          if (!cancelled) {
            setDepositRequests([]);
          }
        } finally {
          if (!cancelled) setIsLoadingRequests(false);
        }
      } catch {
        if (!cancelled) {
          setWalletBalance(0);
          setTransactions([]);
          setDepositRequests([]);
          setIsLoading(false);
          setIsLoadingRequests(false);
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

  const pendingDeposits = useMemo(() => {
    return depositRequests
      .filter((r) => String(r?.status || '').toLowerCase() === 'pending' && r?.txHash)
      .reduce((sum, r) => sum + Number(r?.amount || 0), 0);
  }, [depositRequests]);

  const pendingWaitingCount = useMemo(() => {
    return depositRequests.filter(
      (r) => String(r?.status || '').toLowerCase() === 'pending' && !r?.txHash,
    ).length;
  }, [depositRequests]);

  const processingCount = useMemo(() => {
    return depositRequests.filter(
      (r) => String(r?.status || '').toLowerCase() === 'pending' && r?.txHash,
    ).length;
  }, [depositRequests]);

  const totalDeposited = useMemo(() => {
    return depositTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [depositTransactions]);

  const handleGenerateAddress = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount || '0');
    if (isNaN(value) || value < minDepositUsdt) {
      setAmountError(`Minimum deposit required: ${minDepositUsdt} USDT`);
      return;
    }
    setAmountError('');
    setSubmitMessage('');
    setSubmitMessageType('');
    setCreatedRequestId(null);
    setAddressGenerated(false);
    setConfirmedAmount(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSubmitMessage('Not logged in');
        setSubmitMessageType('error');
        return;
      }

      setIsSubmittingRequest(true);

      const res = await fetch('/api/user/deposit-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: value,
        }),
      });

      const data = await res.json();
      if (data?.success) {
        setConfirmedAmount(value);
        setAddressGenerated(true);
        setSubmitMessage(data?.message || 'Deposit request submitted');
        setSubmitMessageType('success');
        if (data?.request?.id != null) {
          setCreatedRequestId(String(data.request.id));
          setSelectedRequestId(String(data.request.id));
        }
        if (data?.request?.address) {
          setWalletAddress(String(data.request.address));
        }

        if (data?.request) {
          const r = data.request;
          const nextRow = {
            id: r.id,
            amount: Number(r.amount || value),
            address: r.address || walletAddress,
            status: r.status || 'pending',
            txHash: r.txHash || null,
            userNote: r.userNote || null,
            adminNote: r.adminNote || null,
            createdAt: r.createdAt || new Date().toISOString(),
            updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
          };
          setDepositRequests((prev) => {
            const exists = prev.some((x) => String(x?.id) === String(nextRow.id));
            if (exists) return prev;
            return [nextRow, ...prev];
          });
        }

        setTimeout(() => {
          const el = document.getElementById('deposit-address-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);

        try {
          setIsLoadingRequests(true);
          const drRes = await fetch('/api/user/deposit-requests?status=all&limit=100', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const drData = await drRes.json();
          if (drData?.success && Array.isArray(drData?.requests)) {
            setDepositRequests(drData.requests);
          }
        } catch {
          // ignore
        } finally {
          setIsLoadingRequests(false);
        }
      } else {
        setSubmitMessage(data?.message || 'Failed to submit deposit request');
        setSubmitMessageType('error');
      }
    } catch {
      setSubmitMessage('An error occurred while submitting the request');
      setSubmitMessageType('error');
    } finally {
      setIsSubmittingRequest(false);
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

  const qrCodeUrl =
    walletAddress && addressGenerated
      ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
          walletAddress
        )}`
      : '';

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) return null;
    return depositRequests.find((r) => String(r?.id) === String(selectedRequestId)) || null;
  }, [depositRequests, selectedRequestId]);

  return (
    <div className="min-h-screen bg-page text-fg">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border bg-theme-hero network-grid-bg backdrop-blur-sm">
        <div className="absolute inset-0 bg-theme-hero-overlay opacity-60" />
        <div className="relative mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            WALLET
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Deposit Funds (USDT – BEP20)
          </h1>
          <p className="mt-2 text-sm text-muted md:text-base">
            Deposit USDT (BEP20 – BNB Smart Chain) into your Arbix Wallet. Minimum
            deposit: <span className="font-semibold">{minDepositUsdt} USDT</span>.
          </p>
        </div>
      </section>

      {/* Wallet Overview */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Your Deposit Wallet Address
          </h2>
          <p className="mt-2 text-muted">
            Most deposits are credited automatically after{' '}
            <span className="font-semibold text-heading">{confirmations} network confirmations</span>, typically within{' '}
            <span className="font-semibold text-heading">1–2 minutes</span>. In rare cases, it may take up to{' '}
            <span className="font-semibold text-heading">1–2 hours</span> depending on network conditions.
          </p>
        </div>
      </section>

      {/* Balance Summary */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <div className="grid gap-3 text-xs text-muted sm:grid-cols-3">
            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-[11px] text-muted">Wallet Balance</p>
              <p className="mt-1 text-lg font-semibold text-secondary">
                {walletBalance.toFixed(2)} USDT
              </p>
              <p className="mt-1 text-[11px] text-subtle">
                Available for investments &amp; withdrawals
              </p>
            </div>
            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-[11px] text-muted">Pending Deposits</p>
              <p className="mt-1 text-lg font-semibold text-warning">
                {pendingDeposits.toFixed(2)} USDT
              </p>
              <p className="mt-1 text-[11px] text-subtle">
                Waiting for confirmations
              </p>
            </div>
            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-[11px] text-muted">Total Deposited</p>
              <p className="mt-1 text-lg font-semibold text-heading">
                {totalDeposited.toFixed(2)} USDT
              </p>
              <p className="mt-1 text-[11px] text-subtle">All-time total</p>
            </div>
          </div>
        </div>
      </section>

      {/* New Deposit Form */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <h2 className="text-sm font-semibold text-heading md:text-base">New Deposit</h2>
          <p className="mt-2 text-xs text-muted md:text-sm">
            Follow the steps below to create a new deposit.
          </p>

          <div className="mt-4 arbix-card arbix-3d rounded-2xl p-4">
            <form className="space-y-4 text-xs text-muted" onSubmit={handleGenerateAddress}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-muted">
                    Network
                  </label>
                  <input
                    value="BNB Smart Chain (BEP20)"
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-border bg-surface/60 px-3 py-2 text-[11px] text-muted"
                  />
                  <p className="mt-1 text-[10px] text-danger">
                    Wrong network may result in permanent loss of funds.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted">
                    Token
                  </label>
                  <input
                    value="USDT (BEP20)"
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-border bg-surface/60 px-3 py-2 text-[11px] text-muted"
                  />
                </div>
              </div>

              <div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted" htmlFor="amount">
                    Amount (USDT)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min={minDepositUsdt}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-fg outline-none transition focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
                    placeholder={`Enter amount (minimum ${minDepositUsdt} USDT)`}
                  />
                  {amountError && <p className="mt-1 text-[10px] text-danger">{amountError}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-theme-primary px-5 py-2 text-xs font-medium text-primary-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-70"
              >
                {isSubmittingRequest ? 'Creating request...' : 'Generate Deposit Address'}
              </button>

              {submitMessage && (
                <div
                  className={
                    'mt-3 rounded-lg border px-3 py-2 text-[11px] ' +
                    (submitMessageType === 'success'
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-danger/40 bg-danger/10 text-danger')
                  }
                >
                  {submitMessage}
                  {createdRequestId ? ` (Request #${createdRequestId})` : ''}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-subtle">
                <span>Step 1: Enter amount</span>
                <span>Step 2: Generate deposit address</span>
                <span>Step 3: Send USDT and wait for confirmations</span>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Deposit Address + QR */}
      {addressGenerated && (
        <section
          id="deposit-address-section"
          className="border-b border-border bg-surface/30 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
            <h2 className="text-sm font-semibold text-heading md:text-base">
              Send USDT (BEP20) to Your Address
            </h2>
            <p className="mt-2 text-xs text-muted md:text-sm">
              This is your unique Arbix deposit address. You can use the same
              address for all future deposits.
            </p>

            <div className="mt-4 grid gap-4 text-xs text-muted md:grid-cols-[2fr,1fr]">
              <div className="space-y-3">
                <div className="arbix-card arbix-3d rounded-2xl p-3">
                  <p className="text-[11px] text-muted">Deposit Address</p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] md:text-xs">
                    <span className="break-all font-mono text-[10px] text-heading" title={walletAddress}>
                      {walletAddress || '-'}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="rounded-lg border border-border px-2 py-1 text-[10px] text-fg transition hover:border-border2 hover:shadow-theme-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
                      type="button"
                      disabled={!walletAddress}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {confirmedAmount !== null && (
                  <div className="arbix-card arbix-3d rounded-2xl p-3">
                    <p className="text-[11px] text-muted">Amount to send</p>
                    <p className="mt-1 text-lg font-semibold text-secondary">
                      {confirmedAmount.toFixed(2)} USDT
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Send exactly this amount in a single transaction to avoid
                      delays.
                    </p>
                  </div>
                )}

                <div className="arbix-card arbix-3d rounded-2xl p-3">
                  <p className="text-[11px] text-muted">Deposit Request</p>
                  <p className="mt-1 text-[11px] text-muted">
                    A deposit request is created automatically when you generate the address.
                    You can track it in the Deposit Requests table below.
                  </p>
                  {createdRequestId && (
                    <p className="mt-2 text-[11px] text-success">
                      Created: Request #{createdRequestId} (Pending)
                    </p>
                  )}
                </div>

                <div className="arbix-card arbix-3d rounded-2xl p-3 text-[11px] text-muted">
                  <p>
                    Scan this address in your wallet app (Trust Wallet, Binance,
                    MetaMask, etc.) and send only USDT on BNB Smart Chain (BEP20).
                  </p>
                  {confirmedAmount !== null && (
                    <p className="mt-1">
                      Make sure the on-chain amount matches{' '}
                      <span className="font-semibold text-heading">
                        {confirmedAmount.toFixed(2)} USDT
                      </span>{' '}
                      to ensure faster confirmation.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="arbix-card arbix-3d flex h-32 w-32 items-center justify-center rounded-xl">
                  {qrCodeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrCodeUrl}
                      alt="Deposit address QR code"
                      className="h-28 w-28 rounded-md"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-center text-[10px] text-subtle">
                      QR code will appear here
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Critical Instructions */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <div className="arbix-alert arbix-3d arbix-3d-red rounded-2xl p-4 text-xs text-danger md:text-sm">
            <p className="font-semibold">⚠ Important Deposit Instructions</p>
            <ul className="mt-2 space-y-1 text-danger/90">
              <li>• Send only USDT on BNB Smart Chain (BEP20).</li>
              <li>
                • Do <span className="font-semibold">not</span> send ERC20 / TRC20 / Polygon or any other
                network tokens.
              </li>
              <li>• Minimum deposit: {minDepositUsdt} USDT. Smaller deposits will not be credited.</li>
              <li>• Wrong network may result in permanent loss of funds.</li>
              <li>• Typical confirmation time: 1–2 minutes, depending on network load.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Live Status + Overview */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Deposit Status
          </h2>
          <p className="mt-2 text-muted">
            The system periodically checks the blockchain for new transactions to
            your address and updates statuses automatically.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-muted">
              • Waiting for payment
            </span>
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-muted">
              • Pending confirmations
            </span>
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-success">
              • Deposit successful
            </span>
          </div>

          <div className="mt-5 grid gap-3 text-[11px] text-muted sm:grid-cols-3">
            <div className="arbix-card arbix-3d rounded-2xl p-3">
              <p className="text-muted">Pending Deposits</p>
              <p className="mt-1 text-lg font-semibold text-warning">
                {pendingWaitingCount}
              </p>
            </div>
            <div
              className={
                `arbix-card arbix-3d arbix-shine rounded-2xl p-3 ${
                  processingCount > 0 ? 'arbix-shine-active' : ''
                }`
              }
            >
              <p className="text-muted">Processing</p>
              <p className="mt-1 text-lg font-semibold text-info">{processingCount}</p>
            </div>
            <div className="arbix-card arbix-3d rounded-2xl p-3">
              <p className="text-muted">Successful (30 days)</p>
              <p className="mt-1 text-lg font-semibold text-success">{depositTransactions.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deposit History */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Deposit Requests
          </h2>

          {selectedRequest ? (
            <div className="mt-3 arbix-card arbix-3d rounded-2xl p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-heading">Request #{String(selectedRequest.id)}</div>
                  <div className="mt-0.5 text-[11px] text-muted">Status: {String(selectedRequest.status || '').toLowerCase() || '-'}</div>
                </div>
                <div className="text-[11px] text-muted">
                  Amount: <span className="font-semibold text-heading">{Number(selectedRequest.amount || 0).toFixed(2)} USDT</span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface/40 p-3">
                  <div className="text-[10px] text-subtle">Deposit Address</div>
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <div className="break-all font-mono text-[10px] text-heading">{selectedRequest.address || '-'}</div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (!selectedRequest.address) return;
                          await navigator.clipboard.writeText(String(selectedRequest.address));
                        } catch {}
                      }}
                      className="shrink-0 rounded-lg border border-border px-2 py-1 text-[10px] text-fg transition hover:shadow-theme-sm"
                      disabled={!selectedRequest.address}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface/40 p-3">
                  <div className="text-[10px] text-subtle">Transaction</div>
                  <div className="mt-1 text-[11px] text-muted">
                    {selectedRequest.txHash ? `Tx: ${String(selectedRequest.txHash).slice(0, 18)}...` : 'Waiting for payment'}
                  </div>
                  <div className="mt-1 text-[10px] text-subtle">
                    Created: {selectedRequest.createdAt ? String(selectedRequest.createdAt).slice(0, 19).replace('T', ' ') : '-'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-3 overflow-x-auto arbix-card arbix-3d rounded-2xl">
            <table className="min-w-full divide-y divide-border text-[11px]">
              <thead className="bg-surface/60 text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Date / Time</th>
                  <th className="px-3 py-2 text-left">Request ID</th>
                  <th className="px-3 py-2 text-left">Amount (USDT)</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted">
                {depositRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-subtle">
                      {isLoading || isLoadingRequests ? 'Loading...' : 'No deposit requests yet'}
                    </td>
                  </tr>
                ) : (
                  depositRequests.map((r) => (
                    <tr
                      key={String(r.id)}
                      onClick={() => setSelectedRequestId(String(r.id))}
                      className={
                        'cursor-pointer transition ' +
                        (String(selectedRequestId) === String(r.id)
                          ? 'bg-surface/40'
                          : 'hover:bg-surface/30')
                      }
                    >
                      <td className="px-3 py-2">
                        {r?.createdAt ? String(r.createdAt).slice(0, 19).replace('T', ' ') : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-heading">#{String(r.id)}</div>
                        {r?.txHash ? (
                          <div className="mt-0.5 text-[10px] text-subtle">Tx: {String(r.txHash).slice(0, 10)}...</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{Number(r?.amount || 0).toFixed(2)}</td>
                      <td
                        className={
                          'px-3 py-2 ' +
                          (String(r?.status || '').toLowerCase() === 'pending' && r?.txHash
                            ? 'text-info'
                            : String(r?.status || '').toLowerCase() === 'pending'
                            ? 'text-warning'
                            : String(r?.status || '').toLowerCase() === 'approved'
                            ? 'text-success'
                            : String(r?.status || '').toLowerCase() === 'rejected'
                            ? 'text-danger'
                            : 'text-muted')
                        }
                      >
                        {(() => {
                          const lower = String(r?.status || '').toLowerCase();
                          if (lower === 'pending' && r?.txHash) return 'processing';
                          if (isExpiredByTtl(r) || isExpiredStatus(r)) return 'expired';
                          return lower || '-';
                        })()}

                        {(() => {
                          const ttlMs = Math.max(1, depositRequestTtlMinutes) * 60 * 1000;
                          const createdMs = r?.createdAt ? new Date(r.createdAt).getTime() : NaN;
                          const msRemaining = Number.isFinite(createdMs) ? (createdMs + ttlMs - nowMs) : NaN;
                          const showCountdown = String(r?.status || '').toLowerCase() === 'pending' && !r?.txHash && Number.isFinite(msRemaining);
                          if (!showCountdown) return null;
                          return (
                            <div className="mt-0.5 text-[10px] text-subtle">
                              Time left: {formatCountdown(msRemaining)}
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

      {/* Help Section */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            If Your Deposit Is Not Showing
          </h2>
          <div className="mt-3 arbix-card arbix-3d rounded-2xl p-4">
            <p className="text-muted">
              If your deposit is not visible after 30–40 minutes:
            </p>
            <ul className="mt-2 space-y-1 text-muted">
              <li>• Make sure you sent USDT on BNB Smart Chain (BEP20) to the correct address.</li>
              <li>• Verify the number of confirmations on BNB Smart Chain.</li>
              <li>
                • Contact Support and share your Deposit Request ID (from Deposit Requests).
              </li>
            </ul>
            <a
              href="/contact"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-xs font-medium text-fg transition hover:border-border2 hover:shadow-theme-sm"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* Security Notes */}
      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-muted md:text-sm">
          <h2 className="text-sm font-semibold text-heading md:text-base">
            Security Notice
          </h2>
          <div className="mt-3 arbix-card arbix-3d rounded-2xl p-4">
            <ul className="space-y-1 text-muted">
              <li>• Wallet private keys are encrypted and never shared with users.</li>
              <li>• Only system-level services can access wallet operations.</li>
              <li>• Arbix team will never ask for your password, OTP or private key.</li>
              <li>• The website uses SSL encryption for all communication.</li>
              <li>• All deposit attempts are logged in transaction and admin audit logs.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
