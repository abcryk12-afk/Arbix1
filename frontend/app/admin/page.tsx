'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type WithdrawRequest = {
  id: string;
  userName: string;
  email: string;
  amount: number;
  walletAddress: string;
  requestTime: string;
  userBalance: number;
};

type KycPending = {
  id: string;
  userName: string;
  email: string;
  signupDate: string;
};

type RecentUser = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  publicAddress: string;
  signupDate: string;
};

type RecentDeposit = {
  id: string;
  userName: string;
  amount: number;
  txHash: string;
  status: string;
  time: string;
};

type RecentWithdrawal = {
  id: string;
  userName: string;
  email: string;
  amount: number;
  walletAddress: string | null;
  userBalance: number;
  status: string;
  time: string;
};

type AdminLog = {
  id: string;
  time: string;
  adminName: string;
  action: string;
  details: string;
};

type UserDetail = {
  id: string;
  name: string;
  email: string;
  userId: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  accountStatus: 'active' | 'hold';
  joinDate: string;
  phone: string;
  cnic: string;
  referralCode: string;
  publicAddress: string;
  privateKey: string;
  availableBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  tradingProfits: number;
  referralEarnings: number;
  networkToday: number;
  networkTotal: number;
  l1Count: number;
  l2Count: number;
  l3Count: number;
};

type UserTransaction = {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'profit' | 'bonus';
  amount: number;
  status: string;
};

type UserInvestment = {
  id: string;
  packageName: string;
  capital: number;
  dailyRoi: number;
  status: 'active' | 'completed';
  startDate: string;
  daysLeft: number;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  createdAt: string;
  balance: number;
};

type AdminStats = {
  totalUsers: number;
  activeInvestors: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingKyc: number;
  pendingWithdrawals: number;
};

// Demo data (to be fully replaced step-by-step)
const WITHDRAW_REQUESTS: WithdrawRequest[] = [];

const KYC_PENDING: KycPending[] = [
  {
    id: 'u1',
    userName: 'Rehan Khan',
    email: 'rehan.khan@example.com',
    signupDate: '2025-12-06',
  },
];

const LATEST_USERS: RecentUser[] = [];

const RECENT_DEPOSITS: RecentDeposit[] = [];

const RECENT_WITHDRAWALS: RecentWithdrawal[] = [];

const ADMIN_LOGS: AdminLog[] = [
  {
    id: 'l1',
    time: '2025-12-07 10:15 AM',
    adminName: 'Super Admin',
    action: 'VIEW_WITHDRAWAL_REQUESTS',
    details: 'Viewed pending withdrawal requests',
  },
];

// Demo users for search
const ALL_USERS: UserDetail[] = [
  {
    id: 'u1',
    name: 'Ali Raza',
    email: 'ali.raza@example.com',
    userId: 'ARBX-2345',
    kycStatus: 'approved',
    accountStatus: 'active',
    joinDate: '2025-01-15',
    phone: '+971500000001',
    cnic: '12345-6789012-1',
    referralCode: 'ABX123',
    publicAddress: '0x4F3C8b12A1dE90c7187cBf9a2bCE13F29C9A9A27',
    privateKey: '0xprivkey1-demo-abcdef1234567890',
    availableBalance: 280.75,
    totalDeposited: 1000.0,
    totalWithdrawn: 150.0,
    tradingProfits: 890.25,
    referralEarnings: 340.5,
    networkToday: 12.5,
    networkTotal: 340.5,
    l1Count: 5,
    l2Count: 8,
    l3Count: 12,
  },
  {
    id: 'u2',
    name: 'Sana Malik',
    email: 'sana.malik@example.com',
    userId: 'ARBX-2346',
    kycStatus: 'pending',
    accountStatus: 'active',
    joinDate: '2025-02-20',
    phone: '+971500000002',
    cnic: '23456-7890123-2',
    referralCode: 'SNM456',
    publicAddress: '0x98De45c1200e89fCbA3dfb22CEF56712AbCdE321',
    privateKey: '0xprivkey2-demo-0987654321fedcba',
    availableBalance: 120.5,
    totalDeposited: 500.0,
    totalWithdrawn: 0.0,
    tradingProfits: 210.75,
    referralEarnings: 85.0,
    networkToday: 5.0,
    networkTotal: 85.0,
    l1Count: 2,
    l2Count: 4,
    l3Count: 6,
  },
];

const DEMO_TRANSACTIONS: UserTransaction[] = [
  { id: 't1', date: '2025-12-07', type: 'deposit', amount: 100.0, status: 'success' },
  { id: 't2', date: '2025-12-06', type: 'profit', amount: 18.25, status: 'success' },
  { id: 't3', date: '2025-12-05', type: 'withdraw', amount: 50.0, status: 'pending' },
];

const DEMO_INVESTMENTS: UserInvestment[] = [
  {
    id: 'i1',
    packageName: 'Gold',
    capital: 500.0,
    dailyRoi: 3.0,
    status: 'active',
    startDate: '2025-11-01',
    daysLeft: 310,
  },
  {
    id: 'i2',
    packageName: 'Silver',
    capital: 100.0,
    dailyRoi: 2.0,
    status: 'active',
    startDate: '2025-11-15',
    daysLeft: 345,
  },
];

function shortAddr(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [withdrawFilter, setWithdrawFilter] = useState<'pending' | 'all'>('pending');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserReferredBy, setNewUserReferredBy] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState('');
  const [createUserMessageType, setCreateUserMessageType] = useState<'success' | 'error' | ''>('');

  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustMessage, setAdjustMessage] = useState('');
  const [adjustMessageType, setAdjustMessageType] = useState<'success' | 'error' | ''>('');

  const [isRunningDailyProfit, setIsRunningDailyProfit] = useState(false);
  const [runDailyProfitMessage, setRunDailyProfitMessage] = useState('');
  const [runDailyProfitMessageType, setRunDailyProfitMessageType] = useState<'success' | 'error' | ''>('');

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<RecentDeposit[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<RecentWithdrawal[]>([]);

  const loadAdminUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/users?limit=25', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data?.users)) {
        setAdminUsers(
          data.users.map((u: any) => ({
            id: String(u.id),
            name: String(u.name || ''),
            email: String(u.email || ''),
            referralCode: String(u.referralCode || ''),
            createdAt: String(u.createdAt || ''),
            balance: Number(u.balance || 0),
          }))
        );
        if (!selectedUserId && data.users.length > 0) {
          setSelectedUserId(String(data.users[0].id));
        }
      }
    } catch {
      // ignore
    }
  };

  const loadAdminStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.success && data?.stats) {
        setAdminStats({
          totalUsers: Number(data.stats.totalUsers || 0),
          activeInvestors: Number(data.stats.activeInvestors || 0),
          totalDeposited: Number(data.stats.totalDeposited || 0),
          totalWithdrawn: Number(data.stats.totalWithdrawn || 0),
          pendingKyc: Number(data.stats.pendingKyc || 0),
          pendingWithdrawals: Number(data.stats.pendingWithdrawals || 0),
        });
      }
    } catch {
      // ignore for now
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/recent-transactions?limit=20', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.success) {
        const deposits: RecentDeposit[] = Array.isArray(data.deposits)
          ? data.deposits.map((d: any) => ({
              id: String(d.id),
              userName: String(d.userName || ''),
              amount: Number(d.amount || 0),
              txHash: String(d.txHash || ''),
              status: String(d.status || 'success'),
              time: String(d.time || d.createdAt || ''),
            }))
          : [];

        const withdrawals: RecentWithdrawal[] = Array.isArray(data.withdrawals)
          ? data.withdrawals.map((w: any) => ({
              id: String(w.id),
              userName: String(w.userName || ''),
              email: String(w.email || ''),
              amount: Number(w.amount || 0),
              walletAddress: String(w.walletAddress || null),
              userBalance: Number(w.userBalance || 0),
              status: String(w.status || 'success'),
              time: String(w.time || w.createdAt || ''),
            }))
          : [];

        setRecentDeposits(deposits);
        setRecentWithdrawals(withdrawals);
      }
    } catch {
      // ignore for now
    }
  };

  const handleRunDailyProfit = async () => {
    setIsRunningDailyProfit(true);
    setRunDailyProfitMessage('');
    setRunDailyProfitMessageType('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setRunDailyProfitMessage('Not logged in');
        setRunDailyProfitMessageType('error');
        return;
      }

      const res = await fetch('/api/admin/run-daily-profit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data?.success) {
        const r = data?.result || {};
        setRunDailyProfitMessage(
          `OK. totalPackages=${Number(r.totalPackages || 0)}, creditedPackages=${Number(r.creditedPackages || 0)}, completedPackages=${Number(r.completedPackages || 0)}`
        );
        setRunDailyProfitMessageType('success');
        await loadAdminUsers();
        await loadAdminStats();
        await loadRecentTransactions();
      } else {
        setRunDailyProfitMessage(data?.message || 'Failed to run daily profit');
        setRunDailyProfitMessageType('error');
      }
    } catch {
      setRunDailyProfitMessage('An error occurred. Please try again.');
      setRunDailyProfitMessageType('error');
    } finally {
      setIsRunningDailyProfit(false);
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
        const data = await res.json();

        if (!data?.success) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }

        if (!cancelled) {
          await loadAdminUsers();
          await loadAdminStats();
          await loadRecentTransactions();
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

  const filteredWithdrawals = useMemo(() => {
    const source = recentWithdrawals;
    if (withdrawFilter === 'pending') {
      return source.filter((w) => w.status === 'pending');
    }
    return source;
  }, [withdrawFilter, recentWithdrawals]);

  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return ALL_USERS.slice(0, 5);
    return ALL_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [userSearchQuery]);

  const handleApprove = (id: string) => {
    // Demo: in real app, call API to approve
    alert(`Approve withdrawal ${id} - backend logic would execute`);
  };

  const handleReject = (id: string) => {
    // Demo: in real app, call API to reject
    const reason = prompt('Reason for rejection (optional):');
    alert(`Reject withdrawal ${id} - reason: ${reason}`);
  };

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      {/* Admin Header */}
      <section className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white">
              AD
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Admin Dashboard</p>
              <p className="text-[11px] text-slate-400">Arbix Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-600/20 px-2 py-1 text-[10px] text-emerald-300">
              Super Admin
            </span>
            <span className="text-xs text-slate-300">Admin User</span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                router.push('/admin/login');
              }}
              className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500"
            >
              Logout
            </button>
          </div>
        </div>
      </section>

      {/* New Users + Deposit/Withdraw */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-50 md:text-base">
              Users (Latest) + Adjust Balance
            </h2>
            <button
              type="button"
              onClick={loadAdminUsers}
              className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500"
            >
              Refresh
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-100">Manual Job Runner</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Trigger daily profit credit now (testing).
                </p>
              </div>
              <button
                type="button"
                disabled={isRunningDailyProfit}
                onClick={handleRunDailyProfit}
                className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {isRunningDailyProfit ? 'Running...' : 'Run Daily Profit'}
              </button>
            </div>

            {runDailyProfitMessage && (
              <div
                className={`mb-4 rounded-lg border p-3 text-[11px] ${
                  runDailyProfitMessageType === 'success'
                    ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300'
                    : 'border-red-600/60 bg-red-950/20 text-red-300'
                }`}
              >
                {runDailyProfitMessage}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                >
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email} ({u.name})
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-[11px] text-slate-400">
                  Current balance:{' '}
                  <span className="font-semibold text-emerald-400">
                    {selectedAdminUser ? selectedAdminUser.balance.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">Amount</label>
                  <input
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">Note (optional)</label>
                  <input
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                    placeholder="Admin adjustment note"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isAdjusting}
                    onClick={() => handleAdjustBalance('deposit')}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {isAdjusting ? 'Working...' : 'Deposit'}
                  </button>
                  <button
                    type="button"
                    disabled={isAdjusting}
                    onClick={() => handleAdjustBalance('withdraw')}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    {isAdjusting ? 'Working...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            </div>

            {adjustMessage && (
              <div
                className={`mt-3 rounded-lg border p-3 text-[11px] ${
                  adjustMessageType === 'success'
                    ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300'
                    : 'border-red-600/60 bg-red-950/20 text-red-300'
                }`}
              >
                {adjustMessage}
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
              <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                <thead className="bg-slate-950/90 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Referral</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    adminUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="px-3 py-2">{u.createdAt ? String(u.createdAt).slice(0, 19).replace('T', ' ') : '-'}</td>
                        <td className="px-3 py-2">{u.name}</td>
                        <td className="px-3 py-2">{u.email}</td>
                        <td className="px-3 py-2">{u.referralCode || '-'}</td>
                        <td className="px-3 py-2 text-right text-emerald-400">{Number(u.balance || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Global Summary Cards */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Platform Overview
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Total Users</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {adminStats ? adminStats.totalUsers.toLocaleString() : '–'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Active Investors</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {adminStats ? adminStats.activeInvestors.toLocaleString() : '–'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Total Deposited</p>
              <p className="mt-1 text-lg font-semibold text-blue-400">
                {adminStats ? `$${adminStats.totalDeposited.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Total Withdrawn</p>
              <p className="mt-1 text-lg font-semibold text-orange-400">
                {adminStats ? `$${adminStats.totalWithdrawn.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Pending KYC</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">
                {adminStats ? adminStats.pendingKyc.toLocaleString() : '0'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">Pending Withdrawals</p>
              <p className="mt-1 text-lg font-semibold text-red-400">
                {adminStats ? adminStats.pendingWithdrawals.toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Admin Actions */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Quick Actions
          </h2>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            <a href="/admin/users" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-center text-[11px] hover:border-slate-600">
              Users Management
            </a>
            <a href="/admin/user-wallets" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-center text-[11px] hover:border-slate-600">
              User Wallets
            </a>
            <a href="/admin/kyc" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-center text-[11px] hover:border-slate-600">
              KYC Review
            </a>
            <a href="/admin/withdrawals" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-center text-[11px] hover:border-slate-600">
              Withdraw Requests
            </a>
            <a href="/admin/packages" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-center text-[11px] hover:border-slate-600">
              Packages Config
            </a>
            <a href="/admin/trades" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-center text-[11px] hover:border-slate-600">
              Trade Logs
            </a>
            <a href="/admin/notifications" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-center text-[11px] hover:border-slate-600">
              Notifications
            </a>
            <a href="/admin/logs" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-center text-[11px] hover:border-slate-600">
              Admin Logs
            </a>
          </div>
        </div>
      </section>

      {/* Create New User */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Create New User (Manual)
          </h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateUser}>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Full Name</label>
                <input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                  placeholder="User name"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Email</label>
                <input
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  type="email"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Password</label>
                <input
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  type="password"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                  placeholder="Set password"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Phone (optional)</label>
                <input
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                  placeholder="+92..."
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Referred By (optional)</label>
                <input
                  value={newUserReferredBy}
                  onChange={(e) => setNewUserReferredBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                  placeholder="Referral code"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-60"
                >
                  {isCreatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>

            {createUserMessage && (
              <div
                className={`mt-3 rounded-lg border p-3 text-[11px] ${
                  createUserMessageType === 'success'
                    ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300'
                    : 'border-red-600/60 bg-red-950/20 text-red-300'
                }`}
              >
                {createUserMessage}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Withdrawal Requests Section */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-slate-50 md:text-base">
              Pending Withdrawal Requests
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={withdrawFilter}
                onChange={(e) => setWithdrawFilter(e.target.value as 'pending' | 'all')}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
              >
                <option value="pending">Pending</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Request ID</th>
                  <th className="px-3 py-2 text-left">User Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Amount (USDT)</th>
                  <th className="px-3 py-2 text-left">Wallet Address</th>
                  <th className="px-3 py-2 text-left">Request Time</th>
                  <th className="px-3 py-2 text-left">User Balance</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredWithdrawals.map((req) => (
                  <tr key={req.id}>
                    <td className="px-3 py-2">{req.id}</td>
                    <td className="px-3 py-2">{req.userName}</td>
                    <td className="px-3 py-2">{req.email}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-400">${req.amount.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-[10px]">{req.walletAddress ? shortAddr(req.walletAddress) : '-'}</span>
                    </td>
                    <td className="px-3 py-2">{req.time}</td>
                    <td className="px-3 py-2">${req.userBalance.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          req.status === 'pending'
                            ? 'bg-amber-600/20 text-amber-300'
                            : 'bg-emerald-600/20 text-emerald-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="rounded bg-red-600 px-2 py-0.5 text-[10px] text-white hover:bg-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* KYC Pending Section */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            KYC Pending Approvals
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">User Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Signup Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {KYC_PENDING.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2">{user.userName}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">{user.signupDate}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-[10px] text-amber-300">
                        Pending
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <a href={`/admin/kyc/${user.id}`} className="rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white hover:bg-blue-500">
                        Review KYC
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Latest Users & Wallets */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Latest Registered Users
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">User Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Referral Code</th>
                  <th className="px-3 py-2 text-left">Wallet Public Address</th>
                  <th className="px-3 py-2 text-left">Signup Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {LATEST_USERS.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2">{user.name}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">{user.referralCode}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-[10px]">{shortAddr(user.publicAddress)}</span>
                    </td>
                    <td className="px-3 py-2">{user.signupDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* User Detail Inspector */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Find & Manage User
          </h2>
          
          {/* User Search + List */}
          <div className="mb-4">
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
              placeholder="Search by name, email, user ID, or referral code"
            />
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 mb-4">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">User Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">User ID</th>
                  <th className="px-3 py-2 text-left">KYC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`cursor-pointer hover:bg-slate-800/50 ${
                      selectedUser?.id === user.id ? 'bg-slate-800/70' : ''
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-3 py-2">{user.name}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">{user.userId}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          user.kycStatus === 'approved'
                            ? 'bg-emerald-600/20 text-emerald-300'
                            : user.kycStatus === 'rejected'
                            ? 'bg-red-600/20 text-red-300'
                            : 'bg-amber-600/20 text-amber-300'
                        }`}
                      >
                        {user.kycStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <div className="space-y-4">
              {/* Selected User Summary Header */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{selectedUser.name}</h3>
                    <p className="text-[11px] text-slate-400">ID: {selectedUser.userId}</p>
                    <p className="text-[11px] text-slate-400">Email: {selectedUser.email}</p>
                    <p className="text-[11px] text-slate-400">Joined: {selectedUser.joinDate}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          selectedUser.kycStatus === 'approved'
                            ? 'bg-emerald-600/20 text-emerald-300'
                            : selectedUser.kycStatus === 'rejected'
                            ? 'bg-red-600/20 text-red-300'
                            : 'bg-amber-600/20 text-amber-300'
                        }`}
                      >
                        KYC: {selectedUser.kycStatus}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          selectedUser.accountStatus === 'active'
                            ? 'bg-emerald-600/20 text-emerald-300'
                            : 'bg-red-600/20 text-red-300'
                        }`}
                      >
                        Account: {selectedUser.accountStatus}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded bg-orange-600 px-2 py-1 text-[10px] text-white hover:bg-orange-500">
                        {selectedUser.accountStatus === 'active' ? 'Hold Account' : 'Unhold Account'}
                      </button>
                      <button className="rounded bg-red-600 px-2 py-1 text-[10px] text-white hover:bg-red-500">
                        Force Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Reset / Account Recovery */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">Password Reset / Account Recovery</h4>
                <div className="space-y-2">
                  <button className="rounded bg-blue-600 px-3 py-1.5 text-[10px] text-white hover:bg-blue-500">
                    Send Password Reset Link
                  </button>
                  <button className="rounded bg-purple-600 px-3 py-1.5 text-[10px] text-white hover:bg-purple-500">
                    Set Temporary Password
                  </button>
                  <p className="text-[10px] text-slate-500">
                    Last reset action: None - No password reset has been performed yet.
                  </p>
                </div>
              </div>

              {/* Wallet Information */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">Wallet Information</h4>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Network:</span>
                    <span>BNB Smart Chain (BEP20)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Public Address:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{shortAddr(selectedUser.publicAddress)}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedUser.publicAddress)}
                        className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Private Key:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {showPrivateKey ? selectedUser.privateKey : '************'}
                      </span>
                      <button
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
                      >
                        {showPrivateKey ? 'Hide' : 'View'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded bg-slate-700 px-3 py-1.5 text-[10px] text-slate-100 hover:bg-slate-600">
                    Resend Wallet Info
                  </button>
                  <button className="rounded bg-slate-700 px-3 py-1.5 text-[10px] text-slate-100 hover:bg-slate-600">
                    Recalculate Balance
                  </button>
                </div>
              </div>

              {/* Balance & Earnings Summary */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">Balance & Earnings</h4>
                <div className="grid gap-2 text-[11px] sm:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available Balance:</span>
                    <span className="font-semibold text-emerald-400">${selectedUser.availableBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Deposited:</span>
                    <span className="font-semibold text-blue-400">${selectedUser.totalDeposited.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Withdrawn:</span>
                    <span className="font-semibold text-orange-400">${selectedUser.totalWithdrawn.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trading Profits:</span>
                    <span className="font-semibold text-slate-100">${selectedUser.tradingProfits.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Referral Earnings:</span>
                    <span className="font-semibold text-violet-400">${selectedUser.referralEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Network / Team Summary */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">Network Overview</h4>
                <div className="space-y-2 text-[11px]">
                  <div className="grid gap-2 sm:grid-cols-4">
                    <div className="text-center">
                      <p className="text-slate-400">L1</p>
                      <p className="font-semibold text-emerald-400">{selectedUser.l1Count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">L2</p>
                      <p className="font-semibold text-sky-400">{selectedUser.l2Count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">L3</p>
                      <p className="font-semibold text-violet-400">{selectedUser.l3Count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">Total</p>
                      <p className="font-semibold text-slate-100">{selectedUser.l1Count + selectedUser.l2Count + selectedUser.l3Count}</p>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Today's Network Earnings:</span>
                    <span className="font-semibold text-violet-400">${selectedUser.networkToday.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Network Earnings:</span>
                    <span className="font-semibold text-violet-400">${selectedUser.networkTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* User Investments */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">User Investments</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                    <thead className="bg-slate-950/90 text-slate-400">
                      <tr>
                        <th className="px-2 py-1 text-left">Package</th>
                        <th className="px-2 py-1 text-left">Capital</th>
                        <th className="px-2 py-1 text-left">Daily ROI</th>
                        <th className="px-2 py-1 text-left">Status</th>
                        <th className="px-2 py-1 text-left">Days Left</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {DEMO_INVESTMENTS.map((inv) => (
                        <tr key={inv.id}>
                          <td className="px-2 py-1">{inv.packageName}</td>
                          <td className="px-2 py-1">${inv.capital.toFixed(2)}</td>
                          <td className="px-2 py-1">{inv.dailyRoi}%</td>
                          <td className="px-2 py-1">
                            <span
                              className={`rounded-full px-1 py-0.5 text-[10px] ${
                                inv.status === 'active'
                                  ? 'bg-emerald-600/20 text-emerald-300'
                                  : 'bg-slate-600/20 text-slate-300'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-2 py-1">{inv.daysLeft}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions & Withdrawals */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">Recent Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                    <thead className="bg-slate-950/90 text-slate-400">
                      <tr>
                        <th className="px-2 py-1 text-left">Date</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Amount</th>
                        <th className="px-2 py-1 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {DEMO_TRANSACTIONS.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-2 py-1">{tx.date}</td>
                          <td className="px-2 py-1 capitalize">{tx.type}</td>
                          <td className="px-2 py-1">${tx.amount.toFixed(2)}</td>
                          <td className="px-2 py-1">
                            <span
                              className={`rounded-full px-1 py-0.5 text-[10px] ${
                                tx.status === 'success'
                                  ? 'bg-emerald-600/20 text-emerald-300'
                                  : 'bg-amber-600/20 text-amber-300'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KYC & Profile Info */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">Profile & KYC</h4>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Full Name:</span>
                    <span>{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span>{selectedUser.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CNIC/Passport:</span>
                    <span>{selectedUser.cnic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">KYC Status:</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        selectedUser.kycStatus === 'approved'
                          ? 'bg-emerald-600/20 text-emerald-300'
                          : selectedUser.kycStatus === 'rejected'
                          ? 'bg-red-600/20 text-red-300'
                          : 'bg-amber-600/20 text-amber-300'
                      }`}
                    >
                      {selectedUser.kycStatus}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <a href={`/admin/kyc/${selectedUser.id}`} className="rounded bg-blue-600 px-3 py-1.5 text-[10px] text-white hover:bg-blue-500">
                    Open KYC Page
                  </a>
                </div>
              </div>

              {/* Admin Logs for This User */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">Admin Actions on This Account</h4>
                <div className="text-[10px] text-slate-500">
                  No admin actions recorded for this user yet.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Deposits & Withdrawals */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Recent Transactions
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <h3 className="text-[11px] font-semibold text-slate-100 mb-2">Recent Deposits</h3>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
                <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                  <thead className="bg-slate-950/90 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">TxHash</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {recentDeposits.map((dep) => (
                      <tr key={dep.id}>
                        <td className="px-3 py-2">{dep.userName}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-400">${dep.amount.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px]">{shortAddr(dep.txHash)}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] text-emerald-300">
                            {dep.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{dep.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold text-slate-100 mb-2">Recent Withdrawals</h3>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
                <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                  <thead className="bg-slate-950/90 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {recentWithdrawals.map((wd) => (
                      <tr key={wd.id}>
                        <td className="px-3 py-2">{wd.userName}</td>
                        <td className="px-3 py-2 font-semibold text-orange-400">${wd.amount.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                            wd.status === 'pending' 
                              ? 'bg-amber-600/20 text-amber-300' 
                              : 'bg-emerald-600/20 text-emerald-300'
                          }`}>
                            {wd.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{wd.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Logs Snapshot */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Recent Admin Actions
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Admin Name</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {ADMIN_LOGS.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2">{log.time}</td>
                    <td className="px-3 py-2">{log.adminName}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-[10px] text-blue-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}