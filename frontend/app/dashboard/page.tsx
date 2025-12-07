'use client';

import { useState } from 'react';

type KycStatus = 'pending' | 'approved' | 'rejected';

type Activity = {
  id: string;
  text: string;
  time: string;
};

type Announcement = {
  id: string;
  title: string;
  text: string;
};

export default function DashboardPage() {
  // Demo values – later from backend
  const [userName] = useState('Investor');
  const [kycStatus] = useState<KycStatus>('pending');
  const [availableBalance] = useState(280.75);
  const [todayEarnings] = useState(18.25);
  const [networkToday] = useState(12.5);
  const [totalEarnings] = useState(3250.5);

  const [myTradingToday] = useState(8.5);
  const [myTradingMonth] = useState(210.75);
  const [myTradingAll] = useState(1830.25);

  const [networkMonth] = useState(340.0);
  const [networkAll] = useState(1420.0);

  const [activePackagesCount] = useState(3);
  const [activeCapital] = useState(600);
  const [estimatedDailyProfit] = useState(22.5);

  const [l1Count] = useState(5);
  const [l2Count] = useState(8);
  const [l3Count] = useState(12);
  const [teamTodayEarnings] = useState(12.5);

  const activities: Activity[] = [
    {
      id: 'a1',
      text: 'You received $18.25 in total earnings today (trading + network).',
      time: 'Today • 10:45 AM',
    },
    {
      id: 'a2',
      text: 'Ali (L1) activated a $600 Gold package — high-tier bonus applied.',
      time: 'Today • 09:30 AM',
    },
    {
      id: 'a3',
      text: 'You deposited $100.00 USDT (BEP20) to your Arbix wallet.',
      time: 'Yesterday • 08:15 PM',
    },
    {
      id: 'a4',
      text: 'Daily trading snapshot updated with new arbitrage trades.',
      time: 'Yesterday • 06:00 PM',
    },
    {
      id: 'a5',
      text: 'Sana (L1) upgraded to a $100 Silver package.',
      time: '2 days ago',
    },
  ];

  const announcements: Announcement[] = [
    {
      id: 'n1',
      title: 'System Maintenance Window',
      text: 'Planned maintenance on Sunday 02:00–04:00 UTC. Trading engine will remain online, but dashboard updates may be slightly delayed.',
    },
    {
      id: 'n2',
      title: 'New Elite+ Package Enhancements',
      text: 'Elite+ investors now receive extended analytics and dedicated support hours. Check the Investment page for details.',
    },
  ];

  const teamTotal = l1Count + l2Count + l3Count;

  const kycBadge = (() => {
    if (kycStatus === 'approved')
      return {
        color: 'bg-emerald-400',
        title: 'KYC Approved',
        icon: '✓',
      };
    if (kycStatus === 'rejected')
      return {
        color: 'bg-red-500',
        title: 'KYC Rejected – action required',
        icon: '!',
      };
    return {
      color: 'bg-amber-400',
      title: 'KYC Pending',
      icon: '•',
    };
  })();

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Dashboard Header Bar */}
      <section className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
              AR
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Arbix Dashboard</p>
              <p className="text-[11px] text-slate-400">Automated Arbitrage &amp; Earnings</p>
            </div>
          </div>

          {/* Profile / KYC Icon */}
          <a
            href="/profile"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-500"
            title={kycBadge.title}
          >
            <span className="text-lg">👤</span>
            <span
              className={`absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full ${kycBadge.color}`}
            >
              <span className="text-[9px] text-slate-900">{kycBadge.icon}</span>
            </span>
          </a>
        </div>
      </section>

      {/* Welcome Block */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <p className="text-sm font-semibold text-slate-50">
            Welcome Back, {userName} 👋
          </p>
          <p className="mt-1 text-xs text-slate-400 md:text-sm">
            Here&apos;s your overview for today.
          </p>
        </div>
      </section>

      {/* Top Summary Cards */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-2 md:grid-cols-4">
            <a
              href="/dashboard/withdraw"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-600"
            >
              <p className="text-[11px] text-slate-400">Available Balance</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                ${availableBalance.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Ready to withdraw or invest
              </p>
            </a>
            <a
              href="/dashboard/invest"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-600"
            >
              <p className="text-[11px] text-slate-400">My Today&apos;s Earnings</p>
              <p className="mt-1 text-lg font-semibold text-emerald-300">
                ${todayEarnings.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">From trading &amp; packages</p>
            </a>
            <a
              href="/dashboard/team"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-600"
            >
              <p className="text-[11px] text-slate-400">Network Earnings Today</p>
              <p className="mt-1 text-lg font-semibold text-violet-300">
                ${networkToday.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">From your team activity</p>
            </a>
            <a
              href="/dashboard/invest"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-600"
            >
              <p className="text-[11px] text-slate-400">Total Earnings (All Time)</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                ${totalEarnings.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Trading + network combined</p>
            </a>
          </div>
        </div>
      </section>

      {/* Earnings Breakdown */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="grid gap-3 text-xs text-slate-300 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold text-slate-100">
                My Trading Earnings
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-slate-400">Today</p>
                  <p className="font-semibold text-emerald-300">
                    ${myTradingToday.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">This Month</p>
                  <p className="font-semibold text-slate-100">
                    ${myTradingMonth.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">All Time</p>
                  <p className="font-semibold text-slate-100">
                    ${myTradingAll.toFixed(2)}
                  </p>
                </div>
              </div>
              <a
                href="/trade-logs"
                className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-blue-400"
              >
                View Trade Logs
              </a>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold text-slate-100">
                My Network Earnings
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-slate-400">Today</p>
                  <p className="font-semibold text-violet-300">
                    ${networkToday.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">This Month</p>
                  <p className="font-semibold text-slate-100">
                    ${networkMonth.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">All Time</p>
                  <p className="font-semibold text-slate-100">
                    ${networkAll.toFixed(2)}
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/team"
                className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-blue-400"
              >
                My Team &amp; Earnings
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Quick Actions
          </h2>
          <div className="mt-3 grid gap-3 text-xs text-slate-300 sm:grid-cols-2 md:grid-cols-4">
            <a
              href="/dashboard/deposit"
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 hover:border-slate-600"
            >
              Deposit Funds
            </a>
            <a
              href="/dashboard/invest"
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 hover:border-slate-600"
            >
              Start Investment
            </a>
            <a
              href="/dashboard/withdraw"
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 hover:border-slate-600"
            >
              Withdraw Funds
            </a>
            <a
              href="/dashboard/team"
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 hover:border-slate-600"
            >
              My Team &amp; Earnings
            </a>
          </div>
        </div>
      </section>

      {/* Active Packages Overview */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Active Packages Overview
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Total Active Packages</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {activePackagesCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Total Active Capital</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                ${activeCapital.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] text-slate-400">Estimated Daily Profit</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                ${estimatedDailyProfit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-[11px] text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="font-semibold text-slate-100">Gold • $500 • 3% daily</p>
              <p className="text-slate-400">Today&apos;s profit: $15.00 • Days left: 310</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="font-semibold text-slate-100">Silver • $100 • 2% daily</p>
              <p className="text-slate-400">Today&apos;s profit: $2.00 • Days left: 360</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="font-semibold text-slate-100">Starter • $50 • 1.5% daily</p>
              <p className="text-slate-400">Today&apos;s profit: $0.75 • Days left: 365</p>
            </div>
          </div>

          <a
            href="/dashboard/invest"
            className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-blue-400"
          >
            View All Investments
          </a>
        </div>
      </section>

      {/* Team Snapshot */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Team Snapshot
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 1</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">{l1Count}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 2</p>
              <p className="mt-1 text-lg font-semibold text-sky-400">{l2Count}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Level 3</p>
              <p className="mt-1 text-lg font-semibold text-violet-400">{l3Count}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Total Team</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{teamTotal}</p>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            <p>
              Today&apos;s Network Earnings:{' '}
              <span className="font-semibold text-violet-300">
                ${teamTodayEarnings.toFixed(2)}
              </span>
            </p>
            <p className="mt-1">
              Remember: for any referral with a package of $500 or more, you earn an
              extra 60% of their daily profit as a high-tier bonus.
            </p>
          </div>
          <a
            href="/dashboard/team"
            className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-blue-400"
          >
            My Team &amp; Earnings
          </a>
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Recent Activity
          </h2>
          <div className="mt-3 space-y-2 text-[11px] text-slate-300">
            {activities.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
              >
                <p>{a.text}</p>
                <p className="mt-1 text-[10px] text-slate-500">{a.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements / Notifications */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Announcements &amp; Notifications
          </h2>
          <div className="mt-3 space-y-2 text-[11px] text-slate-300">
            {announcements.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
              >
                <p className="font-semibold text-slate-100">{n.title}</p>
                <p className="mt-1 text-slate-400">{n.text}</p>
              </div>
            ))}
          </div>
          <a
            href="/notifications"
            className="mt-3 inline-flex items-center text-[11px] text-primary hover:text-blue-400"
          >
            View All Notifications
          </a>
        </div>
      </section>

      {/* Navigation Grid */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Quick Navigation
          </h2>
          <div className="mt-3 grid gap-3 text-[11px] sm:grid-cols-3 md:grid-cols-4">
            <a
              href="/dashboard"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Dashboard
            </a>
            <a
              href="/dashboard/deposit"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Deposit
            </a>
            <a
              href="/dashboard/withdraw"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Withdraw
            </a>
            <a
              href="/dashboard/invest"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Investment
            </a>
            <a
              href="/dashboard/team"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              My Team &amp; Earnings
            </a>
            <a
              href="/trade-logs"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Trade Logs
            </a>
            <a
              href="/transactions"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Transactions
            </a>
            <a
              href="/reports"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Reports
            </a>
            <a
              href="/profile"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Profile
            </a>
            <a
              href="/profile/kyc"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              KYC
            </a>
            <a
              href="/notifications"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Notifications
            </a>
            <a
              href="/faq"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              FAQ
            </a>
            <a
              href="/contact"
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center hover:border-slate-600"
            >
              Support
            </a>
          </div>
        </div>
      </section>

      {/* Legal Strip */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4 text-[11px] text-slate-500 md:text-xs">
          Trading involves market risk. Read{' '}
          <a href="/terms" className="text-slate-300 hover:text-slate-100">
            Terms
          </a>{' '}
          |{' '}
          <a href="/privacy" className="text-slate-300 hover:text-slate-100">
            Privacy
          </a>{' '}
          |{' '}
          <a
            href="/risk-disclosure"
            className="text-slate-300 hover:text-slate-100"
          >
            Risk Disclosure
          </a>
          .
        </div>
      </section>
    </div>
  );
}
