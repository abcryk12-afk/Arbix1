'use client';

import { useEffect, useMemo, useState } from 'react';

type StatusResponse = {
  success: boolean;
  canClaim?: boolean;
  nextDay?: number;
  amount?: number;
  streakDay?: number;
  nextEligibleAt?: string | null;
  remainingMs?: number;
  walletBalance?: number;
  message?: string;
  _fetchedAt?: number;
};

const formatMoney = (v: number) => {
  if (!Number.isFinite(v)) return '0.00';
  return v.toFixed(2);
};

const msToClock = (ms: number) => {
  const safe = Math.max(0, Math.floor(ms));
  const s = Math.floor(safe / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};

export default function DailyRewardsPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const remainingMs = useMemo(() => {
    const base = Number(status?.remainingMs || 0);
    if (!base) return 0;
    const lastFetchedAt = Number(status?._fetchedAt || 0);
    if (!lastFetchedAt) return base;
    const elapsed = Math.max(0, now - lastFetchedAt);
    return Math.max(0, base - elapsed);
  }, [status, now]);

  const cards = useMemo(() => {
    const lastClaimedDay = Number(status?.streakDay || 0);
    const nextDay = Number(status?.nextDay || 1);
    const canClaim = Boolean(status?.canClaim);

    return Array.from({ length: 7 }).map((_, idx) => {
      const day = idx + 1;
      const amount = day === 7 ? 0.5 : 0.25;

      const isClaimed = lastClaimedDay >= day;
      const isToday = canClaim && nextDay === day;
      const isLocked = !isClaimed && !isToday;

      return { day, amount, isClaimed, isToday, isLocked };
    });
  }, [status]);

  const loadStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus({ success: false, message: 'Not logged in' });
        return;
      }

      const res = await fetch('/api/user/daily-checkin/status', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as StatusResponse;
      (data as any)._fetchedAt = Date.now();
      setStatus(data);
    } catch {
      setStatus({ success: false, message: 'Failed to load status' });
    } finally {
      setLoading(false);
    }
  };

  const claim = async () => {
    if (claiming) return;
    try {
      setClaiming(true);
      setToast(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setToast('Please login to claim');
        return;
      }

      const res = await fetch('/api/user/daily-checkin/claim', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data?.success) {
        setToast(data?.message || 'Unable to claim');
        await loadStatus();
        return;
      }

      setToast(`Claimed $${formatMoney(Number(data?.reward?.amount || 0))} USDT successfully`);
      setCelebrate(true);
      window.dispatchEvent(new Event('arbix-daily-reward-updated'));
      setTimeout(() => setCelebrate(false), 2600);
      await loadStatus();
    } catch {
      setToast('Unable to claim');
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const coins = useMemo(() => {
    if (!celebrate) return [] as Array<{ id: number; left: number; delay: number; dur: number; size: number; rot: number; drift: number }>;
    const rng = (min: number, max: number) => min + Math.random() * (max - min);
    return Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      left: rng(2, 98),
      delay: rng(0, 0.65),
      dur: rng(1.9, 3.2),
      size: rng(14, 22),
      rot: rng(-180, 220),
      drift: rng(-26, 26),
    }));
  }, [celebrate]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="relative">
        <div className="pointer-events-none absolute -inset-6 -z-10 overflow-hidden rounded-[32px]">
          <div className="arbix-aurora" />
          <div className="arbix-aurora arbix-aurora-2" />
        </div>

        <div className="arbix-card relative overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <div className="h-full w-full bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.20),transparent_55%),radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_40%_95%,rgba(34,197,94,0.12),transparent_55%)]" />
          </div>

          <div className="relative p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-400">Rewards</div>
                <div className="text-lg font-semibold text-slate-50">Daily Check-In Bonus</div>
                <div className="mt-1 text-[12px] text-slate-300">
                  Claim every 24 hours. Day 7 gives a bigger bonus.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-right">
                <div className="text-[11px] text-slate-400">Wallet Balance</div>
                <div className="text-sm font-semibold text-slate-100">
                  {status?.walletBalance !== undefined ? `$${formatMoney(Number(status.walletBalance))}` : '--'}
                </div>
                <div className="text-[10px] text-slate-500">USDT</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2">
              {cards.map((c) => (
                <div
                  key={c.day}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveDay((v) => (v === c.day ? null : c.day))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveDay((v) => (v === c.day ? null : c.day));
                    }
                  }}
                  style={{ ['--glowHue' as any]: `${(c.day * 44) % 360}deg` } as any}
                  className={
                    'arbix-tilt relative overflow-hidden rounded-xl border px-2 py-3 text-center text-[10px] transition-colors ' +
                    (c.isToday
                      ? 'border-amber-300/60 bg-amber-500/10 text-amber-100'
                      : c.isClaimed
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                      : 'border-slate-800 bg-slate-950/30 text-slate-300')
                  }
                >
                  <span
                    className={
                      'arbix-glow pointer-events-none absolute -inset-10 opacity-0 transition-opacity duration-200 ' +
                      (activeDay === c.day ? 'opacity-100' : '')
                    }
                  />
                  {c.isToday && (
                    <div className="pointer-events-none absolute inset-0 opacity-60">
                      <div className="h-full w-full animate-[arbixPulse_1.6s_ease-in-out_infinite] bg-[radial-gradient(circle_at_50%_10%,rgba(251,191,36,0.32),transparent_55%)]" />
                    </div>
                  )}
                  <div className="relative">
                    <div className="text-[9px] text-slate-400">Day</div>
                    <div className="text-sm font-semibold">{c.day}</div>
                    <div className="mt-1 text-[9px]">${formatMoney(c.amount)}</div>
                    <div className="mt-1">
                      {c.isClaimed ? (
                        <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] text-emerald-100">
                          Claimed
                        </span>
                      ) : c.isToday ? (
                        <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] text-amber-100">
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-800/60 px-2 py-0.5 text-[9px] text-slate-300">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="text-sm text-slate-400">Loading...</div>
              ) : status?.success === false ? (
                <div className="rounded-xl border border-rose-900/60 bg-rose-500/10 p-3 text-sm text-rose-100">
                  {status?.message || 'Unable to load'}
                </div>
              ) : (
                <div className="grid gap-3">
                  {status?.canClaim ? (
                    <button
                      type="button"
                      onClick={claim}
                      disabled={claiming}
                      className={
                        'arbix-3d arbix-shine inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white ' +
                        (claiming ? 'bg-primary/60' : 'bg-primary hover:bg-primary/90')
                      }
                    >
                      <span>
                        Claim ${formatMoney(Number(status?.amount || 0))} (Day {Number(status?.nextDay || 1)})
                      </span>
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v8m4-4H8"
                        />
                      </svg>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="text-sm font-semibold text-slate-100">Next claim available in</div>
                      <div className="mt-1 text-2xl font-bold tracking-tight text-slate-50">
                        {msToClock(remainingMs)}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        Come back after 24 hours to claim your next bonus.
                      </div>
                    </div>
                  )}

                  {toast && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-100">
                      {toast}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {celebrate && (
        <div className="daily-reward-overlay" aria-hidden="true">
          <div className="daily-reward-rain">
            {coins.map((c) => (
              <span
                key={c.id}
                className="daily-reward-coin"
                style={
                  {
                    left: `${c.left}%`,
                    animationDelay: `${c.delay}s`,
                    width: `${c.size}px`,
                    height: `${c.size}px`,
                    ['--coinRot' as any]: `${c.rot}deg`,
                    ['--coinDrift' as any]: `${c.drift}px`,
                    ['--coinDur' as any]: `${c.dur}s`,
                  } as any
                }
              />
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes arbixPulse {
          0%, 100% { opacity: .35; transform: scale(1); }
          50% { opacity: .75; transform: scale(1.05); }
        }

        .arbix-aurora {
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(circle at 20% 20%, rgba(56,189,248,0.25), transparent 55%),
            radial-gradient(circle at 80% 30%, rgba(168,85,247,0.22), transparent 52%),
            radial-gradient(circle at 40% 90%, rgba(34,197,94,0.16), transparent 55%);
          filter: blur(28px);
          opacity: 0.75;
          transform: translate3d(0,0,0);
          animation: arbixAurora 10s ease-in-out infinite;
        }

        .arbix-aurora-2 {
          opacity: 0.55;
          animation-duration: 14s;
          animation-direction: reverse;
        }

        @keyframes arbixAurora {
          0% { transform: translate3d(-2%, -1%, 0) scale(1.02); }
          50% { transform: translate3d(2%, 1%, 0) scale(1.06); }
          100% { transform: translate3d(-2%, -1%, 0) scale(1.02); }
        }

        .arbix-tilt {
          transform: translateZ(0);
          transition: transform 180ms ease, box-shadow 180ms ease;
          box-shadow: 0 10px 30px rgba(0,0,0,.18);
          cursor: pointer;
        }

        .arbix-tilt:hover {
          transform: perspective(900px) rotateX(6deg) rotateY(-8deg) translateY(-2px);
          box-shadow: 0 18px 45px rgba(0,0,0,.28);
        }

        .arbix-tilt:active {
          transform: perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(0.99);
        }

        .arbix-glow {
          background:
            radial-gradient(circle at 25% 20%, hsla(var(--glowHue), 95%, 62%, 0.36), transparent 58%),
            radial-gradient(circle at 80% 35%, hsla(calc(var(--glowHue) + 80deg), 90%, 62%, 0.30), transparent 60%),
            radial-gradient(circle at 45% 85%, hsla(calc(var(--glowHue) + 160deg), 85%, 62%, 0.20), transparent 58%);
          filter: blur(18px);
        }

        .daily-reward-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 60;
        }

        .daily-reward-rain {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .daily-reward-coin {
          position: absolute;
          top: -24px;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, rgba(253, 230, 138, 1), rgba(245, 158, 11, .9));
          box-shadow: 0 10px 30px rgba(245, 158, 11, .25);
          animation: dailyCoinFall var(--coinDur, 2.5s) cubic-bezier(.2,.75,.1,1) forwards;
          opacity: 0.95;
        }

        .daily-reward-coin::after {
          content: '₮';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: rgba(15, 23, 42, .8);
        }

        @keyframes dailyCoinFall {
          0% { transform: translate3d(0,0,0) rotate(0deg) scale(.9); opacity: 0; }
          10% { opacity: .95; }
          100% { transform: translate3d(var(--coinDrift), 110vh, 0) rotate(var(--coinRot)) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
