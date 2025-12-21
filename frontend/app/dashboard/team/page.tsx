'use client';

import { useEffect, useMemo, useState } from 'react';

type Level = 1 | 2 | 3;

type Member = {
  id: string;
  level: Level;
  name: string;
  email: string;
  joinDate: string;
  packageName: string | null;
  capital: number; // 0 if not activated
  dailyRoi: number; // percent
};

type Activity = {
  id: string;
  text: string;
  timestamp: string;
};

const MEMBERS: Member[] = [
  {
    id: 'm1',
    level: 1,
    name: 'Ali R.',
    email: 'ali.rehman@example.com',
    joinDate: '2025-11-25',
    packageName: 'Gold',
    capital: 600,
    dailyRoi: 3,
  },
  {
    id: 'm2',
    level: 1,
    name: 'Sana M.',
    email: 'sana.malik@example.com',
    joinDate: '2025-11-28',
    packageName: 'Silver',
    capital: 100,
    dailyRoi: 2,
  },
  {
    id: 'm3',
    level: 2,
    name: 'Rehan K.',
    email: 'rehan.ali@example.com',
    joinDate: '2025-11-29',
    packageName: 'Growth',
    capital: 50,
    dailyRoi: 1.5,
  },
  {
    id: 'm4',
    level: 3,
    name: 'Hira S.',
    email: 'hira.shaikh@example.com',
    joinDate: '2025-12-01',
    packageName: 'Platinum',
    capital: 1000,
    dailyRoi: 4,
  },
  {
    id: 'm5',
    level: 2,
    name: 'Usman T.',
    email: 'usman.trader@example.com',
    joinDate: '2025-12-02',
    packageName: null,
    capital: 0,
    dailyRoi: 0,
  },
];

const ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    text: 'Ali (Level 1) activated a $600 Gold package — you now earn 20% + 60% bonus from his daily profit.',
    timestamp: '2025-12-01 10:12',
  },
  {
    id: 'a2',
    text: 'Rehan (Level 2) earned $4.00 today — you earned 10% of that as referral income.',
    timestamp: '2025-12-01 09:40',
  },
  {
    id: 'a3',
    text: 'Sana (Level 1) upgraded to a $100 Silver package — your daily referral income increased.',
    timestamp: '2025-11-30 18:05',
  },
  {
    id: 'a4',
    text: 'Hira (Level 3) activated a $1,000 Platinum package — high-tier bonus will apply daily.',
    timestamp: '2025-11-30 15:30',
  },
];

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  if (user.length <= 3) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 3)}***@${domain}`;
}

function calcReferralEarnings(member: Member) {
  if (!member.packageName || member.capital <= 0 || member.dailyRoi <= 0) {
    return {
      referralDailyProfit: 0,
      normal: 0,
      bonus: 0,
      total: 0,
    };
  }
  const p = (member.capital * member.dailyRoi) / 100; // referral’s daily profit
  let normal = 0;
  if (member.level === 1) normal = p * 0.2;
  else if (member.level === 2) normal = p * 0.1;
  else if (member.level === 3) normal = p * 0.05;

  const bonus = member.capital >= 500 ? p * 0.6 : 0;
  return {
    referralDailyProfit: p,
    normal,
    bonus,
    total: normal + bonus,
  };
}

export default function TeamEarningsPage() {
  const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3' | 'ALL'>('L1');
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
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
        if (!token) return;

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
      } catch {
        // ignore
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const l1 = MEMBERS.filter((m) => m.level === 1).length;
    const l2 = MEMBERS.filter((m) => m.level === 2).length;
    const l3 = MEMBERS.filter((m) => m.level === 3).length;
    return { l1, l2, l3, total: l1 + l2 + l3 };
  }, []);

  const earningsSummary = useMemo(() => {
    let todayTotal = 0;
    let allTime = 785; // demo hard-coded
    let withdrawable = 120; // demo

    let levelNormal: Record<Level, number> = { 1: 0, 2: 0, 3: 0 };
    let levelBonus: Record<Level, number> = { 1: 0, 2: 0, 3: 0 };

    MEMBERS.forEach((m) => {
      const e = calcReferralEarnings(m);
      todayTotal += e.total;
      levelNormal[m.level] += e.normal;
      levelBonus[m.level] += e.bonus;
    });

    return {
      today: todayTotal,
      allTime,
      withdrawable,
      levelNormal,
      levelBonus,
    };
  }, []);

  const filteredMembers = useMemo(() => {
    if (activeTab === 'ALL') return MEMBERS;
    const level: Level = activeTab === 'L1' ? 1 : activeTab === 'L2' ? 2 : 3;
    return MEMBERS.filter((m) => m.level === level);
  }, [activeTab]);

  const referralLink = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbx.space';
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
    <div className="bg-slate-950 text-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            REFERRALS
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            My Team &amp; Earnings
          </h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            View your team across all three levels, track their packages and see
            how much referral income you earn every day.
          </p>
        </div>
      </section>

      {/* Overview cards */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <div className="flex gap-3 overflow-x-auto pb-1 text-xs text-slate-300">
            <div className="min-w-[130px] rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 1 Referrals</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {counts.l1}
              </p>
            </div>
            <div className="min-w-[130px] rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 2 Referrals</p>
              <p className="mt-1 text-lg font-semibold text-sky-400">
                {counts.l2}
              </p>
            </div>
            <div className="min-w-[130px] rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 3 Referrals</p>
              <p className="mt-1 text-lg font-semibold text-violet-400">
                {counts.l3}
              </p>
            </div>
            <div className="min-w-[130px] rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Total Team</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {counts.total}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Link */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Your Referral Link
          </h2>
          <p className="mt-2 text-slate-400">
            Share this link with others and earn a daily percentage from their
            active packages.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-200">
              <span className="break-all">{referralLink}</span>
            </div>
            <div className="flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-slate-700 px-3 py-1 text-slate-100 hover:border-slate-500"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-lg border border-slate-700 px-3 py-1 text-slate-100 hover:border-slate-500"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Team list tabs */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 pt-4 md:pt-6">
          <div className="flex gap-2 overflow-x-auto pb-2 text-[11px] text-slate-300">
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
                    'whitespace-nowrap rounded-full border px-3 py-1 ' +
                    (active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-700 bg-slate-900/60 hover:border-slate-500')
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-6 pt-4 md:pb-8">
          {filteredMembers.length === 0 ? (
            <p className="text-xs text-slate-400 md:text-sm">
              No team members found for this level yet.
            </p>
          ) : (
            <div className="space-y-3 text-xs text-slate-300 md:text-sm">
              {filteredMembers.map((m) => {
                const e = calcReferralEarnings(m);
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {maskEmail(m.email)} • Joined {m.joinDate}
                        </p>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Level {m.level}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2 md:grid-cols-3">
                      <p>
                        <span className="text-slate-400">Package:</span>{' '}
                        <span className="font-semibold text-slate-100">
                          {m.packageName || 'Not activated'}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Capital:</span>{' '}
                        <span className="font-semibold text-slate-100">
                          ${m.capital.toFixed(2)}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Daily ROI:</span>{' '}
                        <span className="font-semibold text-emerald-400">
                          {m.dailyRoi}%
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Their Daily Profit:</span>{' '}
                        <span className="font-semibold text-slate-100">
                          ${e.referralDailyProfit.toFixed(2)}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Your Daily (Normal):</span>{' '}
                        <span className="font-semibold text-emerald-300">
                          ${e.normal.toFixed(2)}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Your Daily (Bonus):</span>{' '}
                        <span className="font-semibold text-amber-300">
                          ${e.bonus.toFixed(2)}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Your Total Daily From This Member:</span>{' '}
                        <span className="font-semibold text-slate-100">
                          ${e.total.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Earnings summary */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Referral Earnings Summary
          </h2>
          <div className="mt-4 grid gap-3 text-[11px] text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Today&apos;s Referral Earnings</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                ${earningsSummary.today.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Total Referral Earnings (All Time)</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                ${earningsSummary.allTime.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Withdrawable Referral Balance</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">
                ${earningsSummary.withdrawable.toFixed(2)}
              </p>
              <button className="mt-2 rounded-lg bg-primary px-4 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-blue-500">
                Withdraw Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings breakdown table */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Earnings Breakdown by Level
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Level</th>
                  <th className="px-3 py-2 text-left">Normal Earnings</th>
                  <th className="px-3 py-2 text-left">Special Bonus</th>
                  <th className="px-3 py-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[1, 2, 3].map((lvl) => {
                  const level = lvl as Level;
                  const normal = earningsSummary.levelNormal[level];
                  const bonus = earningsSummary.levelBonus[level];
                  const total = normal + bonus;
                  return (
                    <tr key={level}>
                      <td className="px-3 py-2">Level {level}</td>
                      <td className="px-3 py-2">${normal.toFixed(2)}</td>
                      <td className="px-3 py-2">${bonus.toFixed(2)}</td>
                      <td className="px-3 py-2">${total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recent team activity */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Recent Team Activity
          </h2>
          <div className="mt-3 space-y-2 text-[11px] text-slate-300">
            {ACTIVITIES.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
              >
                <p>{a.text}</p>
                <p className="mt-1 text-[10px] text-slate-500">{a.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules section */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Referral Income Rules
          </h2>
          <div className="mt-3 space-y-1 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-200">Daily Referral Income:</p>
            <p>• Level 1 → 20% of referral&apos;s daily profit</p>
            <p>• Level 2 → 10% of referral&apos;s daily profit</p>
            <p>• Level 3 → 5% of referral&apos;s daily profit</p>

            <p className="mt-2 font-semibold text-slate-200">Special Bonus:</p>
            <p>
              • If a referral activates a package of $500 or more → you earn an
              extra 60% of that referral&apos;s daily profit every day while the package
              is active.
            </p>

            <p className="mt-2 font-semibold text-slate-200">Additional Rules:</p>
            <p>• Unlimited team size.</p>
            <p>• Earnings continue as long as packages remain active.</p>
            <p>• No earnings from inactive users.</p>
            <p>• Bonus can apply to referrals at any level (1, 2 or 3) based on their package size.</p>
          </div>
        </div>
      </section>

      {/* Support section */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Need Help?
          </h2>
          <p className="mt-2 text-slate-400">
            If you have any questions about your team, referral earnings or the
            bonus structure, our Support team is always available.
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
