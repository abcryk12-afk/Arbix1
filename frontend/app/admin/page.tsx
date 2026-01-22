'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  walletPublicAddress?: string | null;
  kycStatus?: string | null;
  createdAt: string;
  balance: number;
};

type ManageUserListRow = {
  id: string;
  name: string;
  email: string;
  userId: string;
  referralCode: string;
  kycStatus: string;
};

type AdminStats = {
  totalUsers: number;
  activeInvestors: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingKyc: number;
  pendingWithdrawals: number;
};

type InvestmentPackageConfig = {
  name: string;
  capital: number | 'flex';
  minCapital?: number;
  dailyRoi: number | string;
  durationDays: number;
};

type FooterStatsOverrides = {
  system: {
    dailyWithdrawals: number;
    totalWithdrawals: number;
    dailyJoinings: number;
    totalJoinings: number;
  };
};

const ADMIN_USERS_PAGE_SIZE = 5;

const KYC_PENDING: KycPending[] = [];

const ADMIN_LOGS: AdminLog[] = [];

const shortAddr = (addr: string) => {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
};

const INVESTMENT_PACKAGE_IDS = [
  'starter',
  'basic',
  'growth',
  'silver',
  'gold',
  'platinum',
  'elite_plus',
] as const;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [withdrawFilter, setWithdrawFilter] = useState<'pending' | 'all'>('pending');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const [investmentPackages, setInvestmentPackages] = useState<Record<string, InvestmentPackageConfig>>({});
  const [isLoadingInvestmentPackages, setIsLoadingInvestmentPackages] = useState(false);
  const [isSavingInvestmentPackages, setIsSavingInvestmentPackages] = useState(false);
  const [applyInvestmentPackagesToActive, setApplyInvestmentPackagesToActive] = useState(false);
  const [investmentPackagesMessage, setInvestmentPackagesMessage] = useState('');
  const [investmentPackagesMessageType, setInvestmentPackagesMessageType] = useState<'success' | 'error' | ''>('');

  const [footerStatsOverrides, setFooterStatsOverrides] = useState<FooterStatsOverrides>({
    system: {
      dailyWithdrawals: 0,
      totalWithdrawals: 0,
      dailyJoinings: 0,
      totalJoinings: 0,
    },
  });
  const [isLoadingFooterStatsOverrides, setIsLoadingFooterStatsOverrides] = useState(false);
  const [isSavingFooterStatsOverrides, setIsSavingFooterStatsOverrides] = useState(false);
  const [footerStatsOverridesMessage, setFooterStatsOverridesMessage] = useState('');
  const [footerStatsOverridesMessageType, setFooterStatsOverridesMessageType] = useState<'success' | 'error' | ''>('');

  const [manageUsers, setManageUsers] = useState<ManageUserListRow[]>([]);
  const [isLoadingManageUsers, setIsLoadingManageUsers] = useState(false);
  const [selectedUserInvestments, setSelectedUserInvestments] = useState<UserInvestment[]>([]);
  const [selectedUserEarnings, setSelectedUserEarnings] = useState<Array<{ type: string; total: number }>>([]);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserReferredBy, setNewUserReferredBy] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState('');
  const [createUserMessageType, setCreateUserMessageType] = useState<'success' | 'error' | ''>('');

  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [userPage, setUserPage] = useState(1);
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
            walletPublicAddress: u.walletPublicAddress != null ? String(u.walletPublicAddress) : null,
            kycStatus: u.kycStatus != null ? String(u.kycStatus) : null,
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

  const loadFooterStatsOverrides = async () => {
    try {
      setIsLoadingFooterStatsOverrides(true);
      setFooterStatsOverridesMessage('');
      setFooterStatsOverridesMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/footer-stats-overrides', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      const overrides = data?.overrides;

      if (data?.success && overrides && typeof overrides === 'object') {
        setFooterStatsOverrides({
          system: {
            dailyWithdrawals: Number(overrides?.system?.dailyWithdrawals || 0),
            totalWithdrawals: Number(overrides?.system?.totalWithdrawals || 0),
            dailyJoinings: Number(overrides?.system?.dailyJoinings || 0),
            totalJoinings: Number(overrides?.system?.totalJoinings || 0),
          },
        });
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingFooterStatsOverrides(false);
    }
  };

  const saveFooterStatsOverrides = async () => {
    try {
      setIsSavingFooterStatsOverrides(true);
      setFooterStatsOverridesMessage('');
      setFooterStatsOverridesMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setFooterStatsOverridesMessage('Not logged in');
        setFooterStatsOverridesMessageType('error');
        return;
      }

      const res = await fetch('/api/admin/footer-stats-overrides', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ overrides: footerStatsOverrides }),
      });

      const data = await res.json().catch(() => null);
      if (!data?.success) {
        setFooterStatsOverridesMessage(data?.message || 'Failed to update footer stats overrides');
        setFooterStatsOverridesMessageType('error');
        return;
      }

      const saved = data?.overrides;
      if (saved && typeof saved === 'object') {
        setFooterStatsOverrides({
          system: {
            dailyWithdrawals: Number(saved?.system?.dailyWithdrawals || 0),
            totalWithdrawals: Number(saved?.system?.totalWithdrawals || 0),
            dailyJoinings: Number(saved?.system?.dailyJoinings || 0),
            totalJoinings: Number(saved?.system?.totalJoinings || 0),
          },
        });
      }

      setFooterStatsOverridesMessage('Footer stats overrides updated.');
      setFooterStatsOverridesMessageType('success');
    } catch {
      setFooterStatsOverridesMessage('An error occurred. Please try again.');
      setFooterStatsOverridesMessageType('error');
    } finally {
      setIsSavingFooterStatsOverrides(false);
    }
  };

  const loadInvestmentPackages = async () => {
    try {
      setIsLoadingInvestmentPackages(true);
      setInvestmentPackagesMessage('');
      setInvestmentPackagesMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/investment-packages', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data?.success && data?.packages && typeof data.packages === 'object') {
        setInvestmentPackages(data.packages);
      } else {
        setInvestmentPackages({});
      }
    } catch {
      setInvestmentPackages({});
    } finally {
      setIsLoadingInvestmentPackages(false);
    }
  };

  const saveInvestmentPackages = async () => {
    try {
      setIsSavingInvestmentPackages(true);
      setInvestmentPackagesMessage('');
      setInvestmentPackagesMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setInvestmentPackagesMessage('Not logged in');
        setInvestmentPackagesMessageType('error');
        return;
      }

      const cleanedPackages: any = {};
      for (const [id, pkg] of Object.entries(investmentPackages || {})) {
        const p: any = pkg && typeof pkg === 'object' ? { ...(pkg as any) } : {};

        const roiRaw = p.dailyRoi;
        if (roiRaw != null) {
          const s = String(roiRaw).trim().replace(/%/g, '').replace(/\s+/g, '');
          const n = parseFloat(s);
          p.dailyRoi = Number.isFinite(n) ? n : 0;
        }

        cleanedPackages[String(id)] = p;
      }

      const res = await fetch('/api/admin/investment-packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packages: cleanedPackages,
          applyToActive: applyInvestmentPackagesToActive,
        }),
      });

      const data = await res.json();
      if (!data?.success) {
        setInvestmentPackagesMessage(data?.message || 'Failed to update packages');
        setInvestmentPackagesMessageType('error');
        return;
      }

      if (data?.packages && typeof data.packages === 'object') {
        setInvestmentPackages(data.packages);
      }

      const applied = Number(data?.appliedToActive || 0);
      setInvestmentPackagesMessage(
        applyInvestmentPackagesToActive
          ? `Packages updated. Applied to active packages: ${applied}`
          : 'Packages updated.'
      );
      setInvestmentPackagesMessageType('success');
    } catch {
      setInvestmentPackagesMessage('An error occurred. Please try again.');
      setInvestmentPackagesMessageType('error');
    } finally {
      setIsSavingInvestmentPackages(false);
    }
  };

  const loadManageUsers = async (q: string) => {
    try {
      setIsLoadingManageUsers(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const params = new URLSearchParams();
      params.set('limit', q && q.trim() ? '10' : '5');
      if (q && q.trim()) {
        params.set('q', q.trim());
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data?.users)) {
        setManageUsers(
          data.users.map((u: any) => ({
            id: String(u.id),
            name: String(u.name || ''),
            email: String(u.email || ''),
            userId: String(u.id),
            referralCode: String(u.referralCode || ''),
            kycStatus: String(u.kycStatus || 'pending'),
          }))
        );
      } else {
        setManageUsers([]);
      }
    } catch {
      setManageUsers([]);
    } finally {
      setIsLoadingManageUsers(false);
    }
  };

  const loadSelectedUserDetails = async (userId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      setShowPrivateKey(false);

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!data?.success) {
        setSelectedUser(null);
        setSelectedUserInvestments([]);
        setSelectedUserEarnings([]);
        return;
      }

      const u = data.user || {};
      const wallet = data.wallet || {};
      const byType = (data.earnings && data.earnings.byType) || {};
      const referrals = data.referrals || {};
      const pkgs = Array.isArray(data.packages) ? data.packages : [];

      const joinDate = u.createdAt ? String(u.createdAt).slice(0, 10) : '';
      const totalDeposited = Number(byType.deposit || 0);
      const totalWithdrawn = Number(byType.withdraw || 0);
      const tradingProfits = Number(byType.profit || 0);
      const referralProfit = Number(byType.referral_profit || 0);
      const referralBonus = Number(byType.referral_bonus || 0);

      setSelectedUser({
        id: String(u.id ?? userId),
        name: String(u.name || ''),
        email: String(u.email || ''),
        userId: String(u.id ?? userId),
        kycStatus: String(u.kycStatus || 'pending') as any,
        accountStatus: String(u.accountStatus || 'hold') as any,
        joinDate,
        phone: String(u.phone || ''),
        cnic: String(u.cnicPassport || ''),
        referralCode: String(u.referralCode || ''),
        publicAddress: String(u.walletPublicAddress || ''),
        privateKey: 'N/A',
        availableBalance: Number(wallet.balance || 0),
        totalDeposited,
        totalWithdrawn,
        tradingProfits,
        referralEarnings: referralProfit + referralBonus,
        networkToday: 0,
        networkTotal: 0,
        l1Count: Number(referrals.l1Count || 0),
        l2Count: Number(referrals.l2Count || 0),
        l3Count: Number(referrals.l3Count || 0),
      });

      const now = new Date();
      setSelectedUserInvestments(
        pkgs.map((p: any) => {
          const endAt = p.endAt ? new Date(p.endAt) : null;
          const daysLeft = endAt ? Math.max(0, Math.ceil((endAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;
          return {
            id: String(p.id),
            packageName: String(p.packageName || ''),
            capital: Number(p.capital || 0),
            dailyRoi: Number(p.dailyRoi || 0),
            status: String(p.status || 'active') as any,
            startDate: p.startAt ? String(p.startAt).slice(0, 10) : '',
            daysLeft,
          };
        }),
      );

      const order = ['deposit', 'withdraw', 'package_purchase', 'profit', 'referral_profit', 'referral_bonus'];
      const keys = Object.keys(byType);
      keys.sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
      setSelectedUserEarnings(keys.map((k) => ({ type: k, total: Number(byType[k] || 0) })));
    } catch {
      setSelectedUser(null);
      setSelectedUserInvestments([]);
      setSelectedUserEarnings([]);
    }
  };

  const loadAdminStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/stats', {
        method: 'GET',
        cache: 'no-store',
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

  const refreshDashboard = async () => {
    await loadAdminUsers();
    await loadAdminStats();
    await loadRecentTransactions();
    await loadInvestmentPackages();
    await loadFooterStatsOverrides();
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
          await loadManageUsers('');
          await loadAdminStats();
          await loadRecentTransactions();
          await loadInvestmentPackages();
          await loadFooterStatsOverrides();
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
    return manageUsers;
  }, [manageUsers]);

  const latestRegisteredUsers = useMemo(() => {
    return adminUsers.slice(0, 5).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      referralCode: u.referralCode || '-',
      publicAddress: u.walletPublicAddress || '-',
      signupDate: u.createdAt ? String(u.createdAt).slice(0, 10) : '-',
    }));
  }, [adminUsers]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadManageUsers(userSearchQuery);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearchQuery]);

  const selectedAdminUser = useMemo(() => {
    return adminUsers.find((u) => u.id === selectedUserId) || null;
  }, [adminUsers, selectedUserId]);

  // ... rest of the code remains the same ...

  const totalUserPages = Math.max(1, Math.ceil(adminUsers.length / ADMIN_USERS_PAGE_SIZE));

  const paginatedAdminUsers = useMemo(() => {
    const start = (userPage - 1) * ADMIN_USERS_PAGE_SIZE;
    return adminUsers.slice(start, start + ADMIN_USERS_PAGE_SIZE);
  }, [adminUsers, userPage]);

  useEffect(() => {
    setUserPage(1);
  }, [adminUsers.length]);

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsCreatingUser(true);
    setCreateUserMessage('');
    setCreateUserMessageType('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setCreateUserMessage('Not logged in');
        setCreateUserMessageType('error');
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          phone: newUserPhone,
          referredBy: newUserReferredBy,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreateUserMessage(data.message || 'User created successfully');
        setCreateUserMessageType('success');
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserPhone('');
        setNewUserReferredBy('');

        await loadAdminUsers();
      } else {
        setCreateUserMessage(data.message || 'Failed to create user');
        setCreateUserMessageType('error');
      }
    } catch {
      setCreateUserMessage('An error occurred. Please try again.');
      setCreateUserMessageType('error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleAdjustBalance = async (mode: 'deposit' | 'withdraw') => {
    setIsAdjusting(true);
    setAdjustMessage('');
    setAdjustMessageType('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setAdjustMessage('Not logged in');
        setAdjustMessageType('error');
        return;
      }

      const amountValue = Number(adjustAmount);
      if (!selectedUserId || !Number.isFinite(amountValue) || amountValue <= 0) {
        setAdjustMessage('Please select a user and enter a valid amount');
        setAdjustMessageType('error');
        return;
      }

      const body = {
        userId: selectedUserId,
        amount: amountValue,
        note: adjustNote,
      };

      const url = mode === 'deposit' ? '/api/admin/deposit' : '/api/admin/withdraw';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setAdjustMessage(data.message || 'Balance adjusted successfully');
        setAdjustMessageType('success');
        setAdjustAmount('');
        setAdjustNote('');
        await loadAdminUsers();
      } else {
        setAdjustMessage(data.message || 'Failed to adjust balance');
        setAdjustMessageType('error');
      }
    } catch {
      setAdjustMessage('An error occurred. Please try again.');
      setAdjustMessageType('error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleApprove = (id: string) => {
    // Demo: in real app, call API to approve
    alert(`Approve withdrawal ${id} - backend logic would execute`);
  };

  const handleReject = (id: string) => {
    // Demo: in real app, call API to reject
    const reason = prompt('Reason for rejection (optional):');
    alert(`Reject withdrawal ${id} - reason: ${reason}`);
  };

  const userStartIndex = adminUsers.length === 0 ? 0 : (userPage - 1) * ADMIN_USERS_PAGE_SIZE + 1;
  const userEndIndex = Math.min(adminUsers.length, userPage * ADMIN_USERS_PAGE_SIZE);

  return (
    <div className="min-h-screen text-slate-50">
      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">
                Admin Dashboard
              </h1>
            </div>
            <button
              type="button"
              onClick={refreshDashboard}
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
                    paginatedAdminUsers.map((u) => (
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

            <div className="mt-3 flex flex-col gap-2 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {adminUsers.length === 0 ? (
                  'No users to display'
                ) : (
                  <>
                    Showing <span className="font-semibold text-slate-100">{userStartIndex}</span>–
                    <span className="font-semibold text-slate-100">{userEndIndex}</span> of
                    <span className="font-semibold text-slate-100"> {adminUsers.length}</span> users
                  </>
                )}
              </div>
              {adminUsers.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="rounded-lg border border-slate-800 px-2 py-1 text-[10px] text-slate-200 hover:border-slate-600 disabled:opacity-40 disabled:hover:border-slate-800"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalUserPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === userPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setUserPage(pageNum)}
                        className={
                          'min-w-[2rem] rounded-lg px-2 py-1 text-[10px] transition-colors ' +
                          (isActive
                            ? 'bg-slate-200 text-slate-900'
                            : 'border border-slate-800 text-slate-300 hover:border-slate-600')
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                    disabled={userPage === totalUserPages}
                    className="rounded-lg border border-slate-800 px-2 py-1 text-[10px] text-slate-200 hover:border-slate-600 disabled:opacity-40 disabled:hover:border-slate-800"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50 md:text-base">
                Footer Stats Control
              </h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Add or subtract offsets for the user dashboard footer. Offsets are applied on top of real totals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={saveFooterStatsOverrides}
                disabled={isSavingFooterStatsOverrides || isLoadingFooterStatsOverrides}
                className="rounded-lg bg-primary px-3 py-2 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {isSavingFooterStatsOverrides ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {footerStatsOverridesMessage && (
            <div
              className={
                'mb-3 rounded-lg border px-3 py-2 text-[11px] ' +
                (footerStatsOverridesMessageType === 'success'
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200'
                  : 'border-red-500/60 bg-red-950/20 text-red-200')
              }
            >
              {footerStatsOverridesMessage}
            </div>
          )}

          <div className="arbix-card rounded-2xl p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-[11px] text-slate-400">Daily Withdrawals Offset (System)</div>
                <input
                  type="number"
                  step="0.01"
                  value={footerStatsOverrides.system.dailyWithdrawals}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setFooterStatsOverrides((prev) => ({
                      ...prev,
                      system: { ...prev.system, dailyWithdrawals: Number.isFinite(n) ? n : 0 },
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Total Withdrawals Offset (System)</div>
                <input
                  type="number"
                  step="0.01"
                  value={footerStatsOverrides.system.totalWithdrawals}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setFooterStatsOverrides((prev) => ({
                      ...prev,
                      system: { ...prev.system, totalWithdrawals: Number.isFinite(n) ? n : 0 },
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Daily Joinings Offset (System)</div>
                <input
                  type="number"
                  step="1"
                  value={footerStatsOverrides.system.dailyJoinings}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setFooterStatsOverrides((prev) => ({
                      ...prev,
                      system: { ...prev.system, dailyJoinings: Number.isFinite(n) ? n : 0 },
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Total Joinings Offset (System)</div>
                <input
                  type="number"
                  step="1"
                  value={footerStatsOverrides.system.totalJoinings}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setFooterStatsOverrides((prev) => ({
                      ...prev,
                      system: { ...prev.system, totalJoinings: Number.isFinite(n) ? n : 0 },
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400">
              Tip: Use negative numbers to subtract. Final values shown to users will never go below 0.
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50 md:text-base">
                Investment Packages ROI Control
              </h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Update per-package ROI and labels for new activations. You can optionally apply changes to currently active packages.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={applyInvestmentPackagesToActive}
                  onChange={(e) => setApplyInvestmentPackagesToActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />
                Apply to active packages
              </label>
              <button
                type="button"
                onClick={saveInvestmentPackages}
                disabled={isSavingInvestmentPackages || isLoadingInvestmentPackages}
                className="rounded-lg bg-primary px-3 py-2 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {isSavingInvestmentPackages ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {investmentPackagesMessage && (
            <div
              className={
                'mb-3 rounded-lg border px-3 py-2 text-[11px] ' +
                (investmentPackagesMessageType === 'success'
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200'
                  : 'border-red-500/60 bg-red-950/20 text-red-200')
              }
            >
              {investmentPackagesMessage}
            </div>
          )}

          <div className="arbix-card rounded-2xl p-4">
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr className="border-b border-slate-800">
                    <th className="p-2">Package ID</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Capital</th>
                    <th className="p-2">Min Capital</th>
                    <th className="p-2">Daily ROI %</th>
                    <th className="p-2">Duration (days)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/80">
                  {isLoadingInvestmentPackages ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-slate-500">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    INVESTMENT_PACKAGE_IDS.map((id) => {
                      const pkg = investmentPackages[String(id)];
                      return (
                        <tr key={String(id)}>
                          <td className="p-2 font-mono text-slate-300">{String(id)}</td>
                          <td className="p-2">
                            <input
                              value={pkg?.name || ''}
                              onChange={(e) =>
                                setInvestmentPackages((prev) => ({
                                  ...prev,
                                  [String(id)]: {
                                    ...(prev[String(id)] || ({} as any)),
                                    name: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-primary"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={pkg?.capital === 'flex' ? 'flex' : String(pkg?.capital ?? '')}
                              onChange={(e) => {
                                const nextRaw = e.target.value;
                                const nextCapital = nextRaw.trim().toLowerCase() === 'flex' ? 'flex' : Number(nextRaw);
                                setInvestmentPackages((prev) => ({
                                  ...prev,
                                  [String(id)]: {
                                    ...(prev[String(id)] || ({} as any)),
                                    capital: nextCapital === 'flex' ? 'flex' : Number.isFinite(nextCapital) ? nextCapital : 0,
                                  },
                                }));
                              }}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-primary"
                              placeholder="10 / flex"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={pkg?.minCapital != null ? String(pkg.minCapital) : ''}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                setInvestmentPackages((prev) => ({
                                  ...prev,
                                  [String(id)]: {
                                    ...(prev[String(id)] || ({} as any)),
                                    minCapital: Number.isFinite(n) ? n : 0,
                                  },
                                }));
                              }}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-primary"
                              placeholder={pkg?.capital === 'flex' ? '1000' : '—'}
                              disabled={pkg?.capital !== 'flex'}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={pkg?.dailyRoi != null ? String(pkg.dailyRoi) : ''}
                              onChange={(e) => {
                                const nextRaw = e.target.value;
                                setInvestmentPackages((prev) => ({
                                  ...prev,
                                  [String(id)]: {
                                    ...(prev[String(id)] || ({} as any)),
                                    dailyRoi: nextRaw,
                                  },
                                }));
                              }}
                              inputMode="decimal"
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-primary"
                              placeholder="1.5"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={pkg?.durationDays != null ? String(pkg.durationDays) : ''}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                setInvestmentPackages((prev) => ({
                                  ...prev,
                                  [String(id)]: {
                                    ...(prev[String(id)] || ({} as any)),
                                    durationDays: Number.isFinite(n) ? Math.floor(n) : 0,
                                  },
                                }));
                              }}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-primary"
                              placeholder="365"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              Note: daily profits are calculated using the stored ROI per user package. If you enable &quot;Apply to active packages&quot;, future daily credits will use the updated ROI.
            </div>
          </div>
        </div>
      </section>

      {/* Global Summary Cards */}
      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Platform Overview
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 text-xs">
            <div className="arbix-card arbix-3d rounded-2xl p-3">
              <p className="text-[11px] text-slate-400">Total Users</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {adminStats ? adminStats.totalUsers.toLocaleString() : '–'}
              </p>
            </div>
            <div className="arbix-card arbix-card-emerald arbix-3d arbix-3d-emerald rounded-2xl p-3">
              <p className="text-[11px] text-slate-400">Active Investors</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {adminStats ? adminStats.activeInvestors.toLocaleString() : '–'}
              </p>
            </div>
            <div className="arbix-card arbix-3d rounded-2xl p-3">
              <p className="text-[11px] text-slate-400">Total Deposited</p>
              <p className="mt-1 text-lg font-semibold text-blue-400">
                {adminStats ? `$${adminStats.totalDeposited.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div className="arbix-card arbix-card-amber arbix-3d arbix-3d-amber rounded-2xl p-3">
              <p className="text-[11px] text-slate-400">Total Withdrawn</p>
              <p className="mt-1 text-lg font-semibold text-orange-400">
                {adminStats ? `$${adminStats.totalWithdrawn.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div className="arbix-card arbix-card-amber arbix-3d arbix-3d-amber rounded-2xl p-3">
              <p className="text-[11px] text-slate-400">Pending KYC</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">
                {adminStats ? adminStats.pendingKyc.toLocaleString() : '0'}
              </p>
            </div>
            <div className="arbix-card arbix-card-red arbix-3d arbix-3d-red rounded-2xl p-3">
              <p className="text-[11px] text-slate-400">Pending Withdrawals</p>
              <p className="mt-1 text-lg font-semibold text-red-400">
                {adminStats ? adminStats.pendingWithdrawals.toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Admin Actions */}
      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base mb-3">
            Quick Actions
          </h2>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            <a href="/admin/users" className="arbix-card arbix-3d rounded-xl p-3 text-center text-[11px] text-slate-100 hover:text-white">
              Users Management
            </a>
            <a href="/admin/user-wallets" className="arbix-card arbix-3d rounded-xl p-3 text-center text-[11px] text-slate-100 hover:text-white">
              User Wallets
            </a>
            <a href="/admin/kyc" className="arbix-card arbix-3d rounded-xl p-3 text-center text-[11px] text-slate-100 hover:text-white">
              KYC Review
            </a>
            <a href="/admin/withdrawals" className="arbix-card arbix-3d rounded-xl p-3 text-center text-[11px] text-slate-100 hover:text-white">
              Withdraw Requests
            </a>
            <a href="/admin/packages" className="arbix-card arbix-3d rounded-xl p-3 text-center text-[11px] text-slate-100 hover:text-white">
              Packages Config
            </a>
            <a href="/admin/trades" className="arbix-card arbix-3d rounded-xl p-3 text-center text-[11px] text-slate-100 hover:text-white">
              Trade Logs
            </a>
            <a href="/admin/notifications" className="arbix-card arbix-3d rounded-xl p-3 text-center text-[11px] text-slate-100 hover:text-white">
              Notifications
            </a>
            <a href="/admin/logs" className="arbix-card arbix-3d rounded-xl p-3 text-center text-[11px] text-slate-100 hover:text-white">
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
                {latestRegisteredUsers.map((user) => (
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
                {isLoadingManageUsers ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`cursor-pointer hover:bg-slate-800/50 ${
                        selectedUser?.id === user.id ? 'bg-slate-800/70' : ''
                      }`}
                      onClick={() => loadSelectedUserDetails(user.id)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <div className="space-y-4">
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
                    <span className="text-slate-400">Today&apos;s Network Earnings:</span>
                    <span className="font-semibold text-violet-400">${selectedUser.networkToday.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Network Earnings:</span>
                    <span className="font-semibold text-violet-400">${selectedUser.networkTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

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
                      {selectedUserInvestments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-2 py-3 text-center text-slate-500">
                            No packages found.
                          </td>
                        </tr>
                      ) : (
                        selectedUserInvestments.map((inv) => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">Recent Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                    <thead className="bg-slate-950/90 text-slate-400">
                      <tr>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedUserEarnings.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-2 py-3 text-center text-slate-500">
                            No transaction totals.
                          </td>
                        </tr>
                      ) : (
                        selectedUserEarnings.map((row) => (
                          <tr key={row.type}>
                            <td className="px-2 py-1">{row.type}</td>
                            <td className="px-2 py-1">${row.total.toFixed(4)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-[11px] font-semibold text-slate-100 mb-3">KYC & Profile Info</h4>
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