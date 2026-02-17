'use client';

import { useEffect, useMemo, useState } from 'react';

type Level = 1 | 2 | 3;

type Member = {
  id: string;
  level: Level;
  name: string;
  email: string;
  joinDate: string;
};

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  if (user.length <= 3) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 3)}***@${domain}`;
}

export default function TeamEarningsPage() {
  const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3' | 'ALL'>('L1');
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState({ l1: 0, l2: 0, l3: 0, total: 0 });
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [earnings, setEarnings] = useState({
    today: 0,
    allTime: 0,
    withdrawable: 0,
    breakdown: { l1: 0, l2: 0, l3: 0 },
    categories: {
      deposit_commission: { today: 0, allTime: 0, breakdown: { l1: 0, l2: 0, l3: 0 } },
      referral_profit: { today: 0, allTime: 0, breakdown: { l1: 0, l2: 0, l3: 0 } },
      referral_bonus: { today: 0, allTime: 0, breakdown: { l1: 0, l2: 0, l3: 0 } },
    },
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) setIsLoadingTeam(true);
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser && !cancelled) {
          const u = JSON.parse(storedUser);
          setReferralCode(u?.referral_code || '');
        }
      } catch {
        // ignore
      }

      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch('/api/user/referral-earnings', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          if (!cancelled && data?.success && data?.earnings) {
            setEarnings({
              today: Number(data.earnings?.today || 0),
              allTime: Number(data.earnings?.allTime || 0),
              withdrawable: Number(data.earnings?.withdrawable || 0),
              breakdown: {
                l1: Number(data.earnings?.breakdown?.l1 || 0),
                l2: Number(data.earnings?.breakdown?.l2 || 0),
                l3: Number(data.earnings?.breakdown?.l3 || 0),
              },
              categories: {
                deposit_commission: {
                  today: Number(data.earnings?.categories?.deposit_commission?.today || 0),
                  allTime: Number(data.earnings?.categories?.deposit_commission?.allTime || 0),
                  breakdown: {
                    l1: Number(data.earnings?.categories?.deposit_commission?.breakdown?.l1 || 0),
                    l2: Number(data.earnings?.categories?.deposit_commission?.breakdown?.l2 || 0),
                    l3: Number(data.earnings?.categories?.deposit_commission?.breakdown?.l3 || 0),
                  },
                },
                referral_profit: {
                  today: Number(data.earnings?.categories?.referral_profit?.today || 0),
                  allTime: Number(data.earnings?.categories?.referral_profit?.allTime || 0),
                  breakdown: {
                    l1: Number(data.earnings?.categories?.referral_profit?.breakdown?.l1 || 0),
                    l2: Number(data.earnings?.categories?.referral_profit?.breakdown?.l2 || 0),
                    l3: Number(data.earnings?.categories?.referral_profit?.breakdown?.l3 || 0),
                  },
                },
                referral_bonus: {
                  today: Number(data.earnings?.categories?.referral_bonus?.today || 0),
                  allTime: Number(data.earnings?.categories?.referral_bonus?.allTime || 0),
                  breakdown: {
                    l1: Number(data.earnings?.categories?.referral_bonus?.breakdown?.l1 || 0),
                    l2: Number(data.earnings?.categories?.referral_bonus?.breakdown?.l2 || 0),
                    l3: Number(data.earnings?.categories?.referral_bonus?.breakdown?.l3 || 0),
                  },
                },
              },
            });
          }
        }
      } catch {
        // ignore
      }

      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          if (!cancelled && data?.success && data?.user) {
            setReferralCode(data.user?.referral_code || '');
            try {
              localStorage.setItem('user', JSON.stringify(data.user));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }

      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch('/api/user/referrals', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          if (!cancelled && data?.success) {
            const next: Member[] = [];
            const pushLevel = (arr: any[], level: Level) => {
              if (!Array.isArray(arr)) return;
              arr.forEach((u) => {
                next.push({
                  id: String(u.id),
                  level,
                  name: u?.name || '—',
                  email: u?.email || '—',
                  joinDate: u?.joinDate ? String(u.joinDate).slice(0, 10) : '—',
                });
              });
            };

            pushLevel(data?.referrals?.l1, 1);
            pushLevel(data?.referrals?.l2, 2);
            pushLevel(data?.referrals?.l3, 3);

            setMembers(next);
            if (data?.counts) {
              setCounts({
                l1: Number(data.counts?.l1 || 0),
                l2: Number(data.counts?.l2 || 0),
                l3: Number(data.counts?.l3 || 0),
                total: Number(data.counts?.total || 0),
              });
            }
          }
        }
      } catch {
        // ignore
      }

      if (!cancelled) setIsLoadingTeam(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    if (activeTab === 'ALL') return members;
    const level: Level = activeTab === 'L1' ? 1 : activeTab === 'L2' ? 2 : 3;
    return members.filter((m) => m.level === level);
  }, [activeTab, members]);

  const referralLink = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://arbix.cloud';
    if (!referralCode) return `${base}/auth/signup`;
    return `${base}/auth/signup?ref=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    try {
      const nav: any = navigator;
      if (nav?.share) {
        await nav.share({
          title: 'Arbix Referral',
          text: 'Join Arbix using my referral link:',
          url: referralLink,
        });
        return;
      }
      await handleCopy();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-fg">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-theme-hero network-grid-bg backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            REFERRALS
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            My Team &amp; Earnings
          </h1>
          <p className="mt-2 text-sm text-muted md:text-base">
            View your team across all three levels, track their packages and see
            how much referral income you earn every day.
          </p>
        </div>
      </section>

      {/* Referral Earnings */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-fg md:text-sm">
          <h2 className="text-sm font-semibold tracking-tight text-heading md:text-base">
            Referral Earnings
          </h2>
          <div className="mt-4 grid gap-3 text-[11px] text-muted sm:grid-cols-3">
            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-muted">Today</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                ${earnings.today.toFixed(2)}
              </p>
            </div>
            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-muted">All Time</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-heading">
                ${earnings.allTime.toFixed(2)}
              </p>
            </div>
            <div className="arbix-card arbix-3d rounded-2xl p-4">
              <p className="text-muted">Withdrawable</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-warning">
                ${earnings.withdrawable.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto arbix-card arbix-3d rounded-2xl">
            <table className="min-w-full divide-y divide-border/60 text-[11px]">
              <thead className="bg-surface/30 text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-right">L1</th>
                  <th className="px-3 py-2 text-right">L2</th>
                  <th className="px-3 py-2 text-right">L3</th>
                  <th className="px-3 py-2 text-right">All</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-fg">
                <tr>
                  <td className="px-3 py-2 text-fg">Deposit commissions (1%)</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.deposit_commission.breakdown.l1.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.deposit_commission.breakdown.l2.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.deposit_commission.breakdown.l3.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.deposit_commission.allTime.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-fg">Referral profit (20% / 10% / 5%)</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.referral_profit.breakdown.l1.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.referral_profit.breakdown.l2.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.referral_profit.breakdown.l3.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.referral_profit.allTime.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-fg">Referral bonus (L1 60% for $500+)</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.referral_bonus.breakdown.l1.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.referral_bonus.breakdown.l2.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.referral_bonus.breakdown.l3.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${earnings.categories.referral_bonus.allTime.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-surface/30">
                  <td className="px-3 py-2 font-semibold text-heading">Total</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-heading">
                    ${earnings.breakdown.l1.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-heading">
                    ${earnings.breakdown.l2.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-heading">
                    ${earnings.breakdown.l3.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-heading">
                    ${earnings.allTime.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Overview cards */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <div className="flex gap-3 overflow-x-auto pb-1 text-xs text-fg">
            <div className="arbix-card arbix-3d min-w-[130px] rounded-2xl p-3">
              <p className="text-[11px] text-muted">Level 1 Referrals</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                {counts.l1}
              </p>
            </div>
            <div className="arbix-card arbix-3d min-w-[130px] rounded-2xl p-3">
              <p className="text-[11px] text-muted">Level 2 Referrals</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-info">
                {counts.l2}
              </p>
            </div>
            <div className="arbix-card arbix-3d min-w-[130px] rounded-2xl p-3">
              <p className="text-[11px] text-muted">Level 3 Referrals</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-accent">
                {counts.l3}
              </p>
            </div>
            <div className="arbix-card arbix-3d min-w-[130px] rounded-2xl p-3">
              <p className="text-[11px] text-muted">Total Team</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-heading">
                {counts.total}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Link */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-fg md:text-sm">
          <h2 className="text-sm font-semibold tracking-tight text-heading md:text-base">
            Your Referral Link
          </h2>
          <p className="mt-2 text-muted">
            Share this link with others and earn a daily percentage from their
            active packages.
          </p>
          <div className="mt-3 arbix-card arbix-3d rounded-2xl p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-lg border border-border bg-surface/30 px-3 py-2 text-[11px] text-fg">
                <span className="break-all">{referralLink}</span>
              </div>
              <div className="flex gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg border border-border bg-surface/30 px-3 py-2 font-medium text-fg hover:border-border2"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-lg border border-border bg-surface/30 px-3 py-2 font-medium text-fg hover:border-border2"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team list tabs */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 pt-4 md:pt-6">
          <div className="arbix-card arbix-3d flex gap-2 overflow-x-auto rounded-2xl p-2 text-[11px] text-muted">
            {[
              { id: 'L1', label: 'Level 1' },
              { id: 'L2', label: 'Level 2' },
              { id: 'L3', label: 'Level 3' },
              { id: 'ALL', label: 'All Team' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={
                    'whitespace-nowrap rounded-full border px-3 py-2 font-medium transition-colors ' +
                    (active
                      ? 'border-primary/80 bg-primary/15 text-primary'
                      : 'border-border bg-surface/30 text-muted hover:border-border2')
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-6 pt-4 md:pb-8">
          {isLoadingTeam ? (
            <p className="text-xs text-muted md:text-sm">Loading team...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-xs text-muted md:text-sm">
              No team members found for this level yet.
            </p>
          ) : (
            <div className="space-y-3 text-xs text-fg md:text-sm">
              {filteredMembers.map((m) => (
                <div key={m.id} className="arbix-card arbix-3d rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-heading">{m.name}</p>
                      <p className="text-[11px] text-muted">
                        {maskEmail(m.email)} • Joined {m.joinDate}
                      </p>
                    </div>
                    <div className="rounded-full border border-border bg-surface/30 px-2 py-1 text-[11px] text-muted">
                      Level {m.level}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rules section */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-fg md:text-sm">
          <h2 className="text-sm font-semibold tracking-tight text-heading md:text-base">
            Referral Income Rules
          </h2>
          <div className="mt-3 arbix-card arbix-3d rounded-2xl p-4">
            <div className="space-y-1 text-[11px] text-muted">
              <p className="font-semibold text-heading">Daily Referral Income:</p>
              <p>Level 1: 20% of referral&apos;s daily profit</p>
              <p>Level 2: 10% of referral&apos;s daily profit</p>
              <p>Level 3: 5% of referral&apos;s daily profit</p>

              <p className="mt-2 font-semibold text-heading">Special Bonus:</p>
              <p>
                If a referral activates a package of $500 or more, you earn an
                extra 60% of that referral&apos;s daily profit every day while the package
                is active.
              </p>

              <p className="mt-2 font-semibold text-heading">Additional Rules:</p>
              <p>Unlimited team size.</p>
              <p>Earnings continue as long as packages remain active.</p>
              <p>No earnings from inactive users.</p>
              <p>
                Bonus can apply to referrals at any level (1, 2 or 3) based on their
                package size.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support section */}
      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-fg md:text-sm">
          <h2 className="text-sm font-semibold tracking-tight text-heading md:text-base">
            Need Help?
          </h2>
          <div className="mt-3 arbix-card arbix-3d rounded-2xl p-4">
            <p className="text-[11px] text-muted md:text-sm">
              If you have any questions about your team, referral earnings or the bonus
              structure, our Support team is always available.
            </p>
            <a
              href="/contact"
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-border bg-surface/30 px-4 py-2 text-[11px] font-medium text-fg hover:border-border2"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
