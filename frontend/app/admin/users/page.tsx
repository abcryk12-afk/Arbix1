'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  accountStatus: string;
  balance: number;
  createdAt: string;
};

type UserPackageRow = {
  id: number;
  packageId: string;
  packageName: string;
  capital: number;
  dailyRoi: number;
  dailyRevenue: number;
  durationDays: number;
  totalEarned: number;
  startAt: string | null;
  endAt: string | null;
  status: string;
  lastProfitAt: string | null;
};

type UserDetailsResponse = {
  success: boolean;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    referralCode: string | null;
    referredById: number | null;
    kycStatus: string | null;
    accountStatus: string | null;
    role: string | null;
    walletPublicAddress: string | null;
    createdAt: string | null;
    lastLogin: string | null;
  };
  wallet?: {
    balance: number;
    currency: string;
  };
  packages?: UserPackageRow[];
  earnings?: {
    byType: Record<string, number>;
  };
  referrals?: {
    l1Count: number;
    l2Count: number;
    l3Count: number;
    l1: Array<{
      id: number;
      name: string | null;
      email: string | null;
      accountStatus: string | null;
      referralCode: string | null;
      createdAt: string | null;
    }>;
  };
  message?: string;
};

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return String(value).slice(0, 19).replace('T', ' ');
}

function shortAddr(addr?: string | null) {
  if (!addr) return '-';
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-4)}`;
}

function statusLabel(status?: string | null) {
  if (!status) return { text: '-', cls: 'text-slate-400' };
  const s = String(status).toLowerCase();
  if (s === 'active') return { text: 'Active', cls: 'text-emerald-400' };
  if (s === 'hold') return { text: 'Inactive', cls: 'text-amber-400' };
  return { text: status, cls: 'text-slate-300' };
}

const escapeCsvCell = (value: any) => {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const makeCsv = (rows: Array<Record<string, any>>, headers: Array<{ key: string; label: string }>) => {
  const head = headers.map((h) => escapeCsvCell(h.label)).join(',');
  const lines = rows.map((r) => headers.map((h) => escapeCsvCell(r?.[h.key])).join(','));
  return [head, ...lines].join('\n');
};

const downloadTextFile = ({ filename, content, mime }: { filename: string; content: string; mime: string }) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [query, setQuery] = useState('');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsResponse['user'] | null>(null);
  const [walletDetails, setWalletDetails] = useState<UserDetailsResponse['wallet'] | null>(null);
  const [packages, setPackages] = useState<UserPackageRow[]>([]);
  const [earningsByType, setEarningsByType] = useState<Record<string, number>>({});
  const [referrals, setReferrals] = useState<UserDetailsResponse['referrals'] | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<'success' | 'error' | ''>('');
  const [notifyStatusText, setNotifyStatusText] = useState('');
  const [isSendingNotify, setIsSendingNotify] = useState(false);

  const [isUpdatingUserStatus, setIsUpdatingUserStatus] = useState(false);
  const [userStatusUpdateKind, setUserStatusUpdateKind] = useState<'success' | 'error' | ''>('');
  const [userStatusUpdateText, setUserStatusUpdateText] = useState('');

  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserKind, setDeleteUserKind] = useState<'success' | 'error' | ''>('');
  const [deleteUserText, setDeleteUserText] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isExportingSelected, setIsExportingSelected] = useState(false);
  const [exportKind, setExportKind] = useState<'success' | 'error' | ''>('');
  const [exportText, setExportText] = useState('');

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<'success' | 'error' | ''>('');
  const [broadcastStatusText, setBroadcastStatusText] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const visibleUsers = useMemo(() => users, [users]);

  const exportAllUsersCsv = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    setIsExportingAll(true);
    setExportKind('');
    setExportText('');

    try {
      const limit = 100;
      const maxPages = 50;
      const all: any[] = [];

      for (let page = 0; page < maxPages; page++) {
        const qs = new URLSearchParams();
        qs.set('limit', String(limit));
        qs.set('offset', String(page * limit));

        const res = await fetch(`/api/admin/users?${qs.toString()}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !Array.isArray(data?.users)) {
          const details = data?.error || data?.dbMessage || data?.code || '';
          const msg = (data?.message || `Failed (HTTP ${res.status})`) + (details ? ` (${details})` : '');
          throw new Error(msg);
        }

        all.push(...data.users);
        if (data.users.length < limit) break;
      }

      const headers = [
        { key: 'id', label: 'User ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'accountStatus', label: 'Account Status' },
        { key: 'kycStatus', label: 'KYC Status' },
        { key: 'balance', label: 'Wallet Balance' },
        { key: 'referralCode', label: 'Referral Code' },
        { key: 'referredById', label: 'Referred By ID' },
        { key: 'walletPublicAddress', label: 'Wallet Address' },
        { key: 'createdAt', label: 'Created At' },
      ];

      const csv = makeCsv(all, headers);
      const today = new Date();
      const name = `arbix_users_backup_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate(),
      ).padStart(2, '0')}.csv`;

      downloadTextFile({ filename: name, content: csv, mime: 'text/csv;charset=utf-8' });
      setExportKind('success');
      setExportText(`Exported ${all.length} users`);
    } catch (e: any) {
      setExportKind('error');
      setExportText(e?.message || 'Failed to export users');
    } finally {
      setIsExportingAll(false);
    }
  };

  const exportSelectedUserCsv = async () => {
    if (!selectedUserId) return;

    setIsExportingSelected(true);
    setExportKind('');
    setExportText('');

    try {
      const profileHeaders = [
        { key: 'id', label: 'User ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'referralCode', label: 'Referral Code' },
        { key: 'referredById', label: 'Referred By ID' },
        { key: 'accountStatus', label: 'Account Status' },
        { key: 'kycStatus', label: 'KYC Status' },
        { key: 'role', label: 'Role' },
        { key: 'walletPublicAddress', label: 'Wallet Address' },
        { key: 'balance', label: 'Wallet Balance' },
        { key: 'currency', label: 'Currency' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'lastLogin', label: 'Last Login' },
      ];

      const profileRow = {
        id: userDetails?.id ?? selectedUserId,
        name: userDetails?.name || '',
        email: userDetails?.email || '',
        phone: userDetails?.phone || '',
        referralCode: userDetails?.referralCode || '',
        referredById: userDetails?.referredById ?? '',
        accountStatus: userDetails?.accountStatus || '',
        kycStatus: userDetails?.kycStatus || '',
        role: userDetails?.role || '',
        walletPublicAddress: userDetails?.walletPublicAddress || '',
        balance: Number(walletDetails?.balance || 0),
        currency: walletDetails?.currency || 'USDT',
        createdAt: fmtDate(userDetails?.createdAt || null),
        lastLogin: fmtDate(userDetails?.lastLogin || null),
      };

      const profileCsv = makeCsv([profileRow], profileHeaders);

      const packagesHeaders = [
        { key: 'id', label: 'Row ID' },
        { key: 'packageId', label: 'Package ID' },
        { key: 'packageName', label: 'Package Name' },
        { key: 'capital', label: 'Capital' },
        { key: 'dailyRoi', label: 'Daily ROI (%)' },
        { key: 'dailyRevenue', label: 'Daily Revenue' },
        { key: 'durationDays', label: 'Duration Days' },
        { key: 'totalEarned', label: 'Total Earned' },
        { key: 'startAt', label: 'Start At' },
        { key: 'endAt', label: 'End At' },
        { key: 'status', label: 'Status' },
        { key: 'lastProfitAt', label: 'Last Profit At' },
      ];

      const packagesRows = (packages || []).map((p) => ({
        ...p,
        startAt: fmtDate(p.startAt),
        endAt: fmtDate(p.endAt),
        lastProfitAt: fmtDate(p.lastProfitAt),
      }));

      const packagesCsv = makeCsv(packagesRows, packagesHeaders);

      const earningsCsv = makeCsv(earningsRows, [
        { key: 'type', label: 'Type' },
        { key: 'total', label: 'Total' },
      ]);

      const referralsCsv = makeCsv(
        (referrals?.l1 || []).map((r) => ({
          ...r,
          createdAt: fmtDate(r.createdAt),
        })),
        [
          { key: 'id', label: 'User ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'accountStatus', label: 'Account Status' },
          { key: 'referralCode', label: 'Referral Code' },
          { key: 'createdAt', label: 'Joined' },
        ],
      );

      const base = `arbix_user_${selectedUserId}`;
      downloadTextFile({ filename: `${base}_profile.csv`, content: profileCsv, mime: 'text/csv;charset=utf-8' });
      downloadTextFile({ filename: `${base}_packages.csv`, content: packagesCsv, mime: 'text/csv;charset=utf-8' });
      downloadTextFile({ filename: `${base}_earnings.csv`, content: earningsCsv, mime: 'text/csv;charset=utf-8' });
      downloadTextFile({ filename: `${base}_referrals_l1.csv`, content: referralsCsv, mime: 'text/csv;charset=utf-8' });

      setExportKind('success');
      setExportText('Selected user export downloaded');
    } catch (e: any) {
      setExportKind('error');
      setExportText(e?.message || 'Failed to export selected user');
    } finally {
      setIsExportingSelected(false);
    }
  };

  const activePackages = useMemo(() => packages.filter((p) => String(p.status).toLowerCase() === 'active'), [packages]);
  const totalDailyRevenue = useMemo(
    () => activePackages.reduce((sum, p) => sum + Number(p.dailyRevenue || 0), 0),
    [activePackages],
  );

  const fetchUsers = async (q: string) => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const qs = new URLSearchParams();
      qs.set('limit', '100');
      if (q.trim()) qs.set('q', q.trim());

      const res = await fetch(`/api/admin/users?${qs.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data?.success && Array.isArray(data?.users)) {
        setUsers(
          data.users.map((u: any) => ({
            id: String(u.id),
            name: String(u.name || ''),
            email: String(u.email || ''),
            accountStatus: String(u.accountStatus || ''),
            balance: Number(u.balance || 0),
            createdAt: fmtDate(u.createdAt),
          })),
        );
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchUserDetails = async (id: string) => {
    try {
      setIsLoadingDetails(true);
      setDetailsError('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: UserDetailsResponse = await res.json();

      if (!data?.success) {
        setUserDetails(null);
        setWalletDetails(null);
        setPackages([]);
        setEarningsByType({});
        setReferrals(null);
        setDetailsError(data?.message || 'Failed to load user details');
        return;
      }

      setUserDetails(data.user || null);
      setWalletDetails(data.wallet || null);
      setPackages(Array.isArray(data.packages) ? data.packages : []);
      setEarningsByType(data.earnings?.byType || {});
      setReferrals(data.referrals || null);
    } catch {
      setDetailsError('Failed to load user details');
      setUserDetails(null);
      setWalletDetails(null);
      setPackages([]);
      setEarningsByType({});
      setReferrals(null);
    } finally {
      setIsLoadingDetails(false);
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

        const checkRes = await fetch('/api/admin/check', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const checkData = await checkRes.json();

        if (!checkData?.success) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }

        if (!cancelled) {
          await fetchUsers('');
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
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(query);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetails(selectedUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  const sendNotification = async ({ toAll }: { toAll: boolean }) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (toAll) {
      setIsSendingBroadcast(true);
      setBroadcastStatus('');
      setBroadcastStatusText('');
    } else {
      setIsSendingNotify(true);
      setNotifyStatus('');
      setNotifyStatusText('');
    }

    try {
      const title = (toAll ? broadcastTitle : notifyTitle).trim();
      const message = (toAll ? broadcastMessage : notifyMessage).trim();

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sendToAll: toAll,
          userId: toAll ? undefined : selectedUserId,
          title,
          message,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const details = data?.error || data?.dbMessage || data?.code || '';
        const msg = (data?.message || `Failed (HTTP ${res.status})`) + (details ? ` (${details})` : '');
        if (toAll) {
          setBroadcastStatus('error');
          setBroadcastStatusText(msg);
        } else {
          setNotifyStatus('error');
          setNotifyStatusText(msg);
        }
        return;
      }

      const okMsg = data?.message || (toAll ? 'Broadcast sent' : 'Notification sent');
      if (toAll) {
        setBroadcastStatus('success');
        setBroadcastStatusText(okMsg);
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        setNotifyStatus('success');
        setNotifyStatusText(okMsg);
        setNotifyTitle('');
        setNotifyMessage('');
      }
    } catch {
      if (toAll) {
        setBroadcastStatus('error');
        setBroadcastStatusText('Network error. Please try again.');
      } else {
        setNotifyStatus('error');
        setNotifyStatusText('Network error. Please try again.');
      }
    } finally {
      if (toAll) setIsSendingBroadcast(false);
      else setIsSendingNotify(false);
    }
  };

  const updateSelectedUserStatus = async (nextStatus: 'active' | 'hold') => {
    if (!selectedUserId) return;

    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    setIsUpdatingUserStatus(true);
    setUserStatusUpdateKind('');
    setUserStatusUpdateText('');

    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accountStatus: nextStatus }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const details = data?.error || data?.dbMessage || data?.code || '';
        const msg = (data?.message || `Failed (HTTP ${res.status})`) + (details ? ` (${details})` : '');
        setUserStatusUpdateKind('error');
        setUserStatusUpdateText(msg);
        return;
      }

      setUserDetails((prev) => (prev ? { ...prev, accountStatus: nextStatus } : prev));
      setUsers((prev) => prev.map((u) => (u.id === String(selectedUserId) ? { ...u, accountStatus: nextStatus } : u)));

      setUserStatusUpdateKind('success');
      setUserStatusUpdateText(data?.message || 'User status updated');
    } catch {
      setUserStatusUpdateKind('error');
      setUserStatusUpdateText('Network error. Please try again.');
    } finally {
      setIsUpdatingUserStatus(false);
    }
  };

  const deleteSelectedUser = async () => {
    if (!selectedUserId) return;

    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const label = userDetails?.email ? `${selectedUserId} (${userDetails.email})` : selectedUserId;
    const ok = window.confirm(
      `This will permanently delete user ${label} and ALL linked data (wallet, transactions, packages, requests, logs). This cannot be undone. Continue?`,
    );
    if (!ok) return;

    const typed = window.prompt(`Type DELETE to confirm deleting user ${selectedUserId}`);
    if (typed !== 'DELETE') {
      setDeleteUserKind('error');
      setDeleteUserText('Delete cancelled');
      return;
    }

    setIsDeletingUser(true);
    setDeleteUserKind('');
    setDeleteUserText('');

    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const details = data?.error || data?.dbMessage || data?.code || '';
        const msg = (data?.message || `Failed (HTTP ${res.status})`) + (details ? ` (${details})` : '');
        setDeleteUserKind('error');
        setDeleteUserText(msg);
        return;
      }

      setDeleteUserKind('success');
      setDeleteUserText(data?.message || 'User deleted');

      setUsers((prev) => prev.filter((u) => u.id !== String(selectedUserId)));
      setSelectedUserId(null);
      setUserDetails(null);
      setWalletDetails(null);
      setPackages([]);
      setEarningsByType({});
      setReferrals(null);
      setDetailsError('');
    } catch {
      setDeleteUserKind('error');
      setDeleteUserText('Network error. Please try again.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const earningsRows = useMemo(() => {
    const keys = Object.keys(earningsByType || {});
    const order = ['deposit', 'withdraw', 'package_purchase', 'profit', 'referral_profit', 'referral_bonus'];
    const sorted = keys.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return sorted.map((k) => ({ type: k, total: Number(earningsByType[k] || 0) }));
  }, [earningsByType]);

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      <section className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Users Management</h1>
              <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                Search users and view full details, packages, earnings breakdown and referral network.
              </p>
            </div>
            <div className="w-full md:w-96">
              <label className="mb-1 block text-[11px] text-slate-400 md:text-xs">Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Search by name, email or user id"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        <div className="grid gap-4 md:grid-cols-[380px_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Users List</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">Click a user card to view full details.</p>
              </div>
              <button
                type="button"
                onClick={() => fetchUsers(query)}
                className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500"
              >
                Refresh
              </button>
            </div>

            <div className="max-h-[460px] overflow-y-auto scroll-smooth p-3">
              {isLoadingUsers ? (
                <div className="px-2 py-8 text-center text-[11px] text-slate-500">Loading users...</div>
              ) : visibleUsers.length === 0 ? (
                <div className="px-2 py-8 text-center text-[11px] text-slate-500">No users found.</div>
              ) : (
                <div className="space-y-2">
                  {visibleUsers.slice(0, 200).map((u) => {
                    const isSelected = selectedUserId === u.id;
                    const st = statusLabel(u.accountStatus);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className={
                          'w-full text-left rounded-xl border px-3 py-3 transition ' +
                          (isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-600')
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[12px] font-semibold text-slate-100">{u.name || '(No name)'}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">{u.email}</div>
                          </div>
                          <div className="text-right">
                            <div className={'text-[10px] font-semibold ' + st.cls}>{st.text}</div>
                            <div className="mt-0.5 text-[10px] text-slate-500">ID: {u.id}</div>
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                          <div>
                            <span className="text-slate-500">Balance:</span>{' '}
                            <span className="text-slate-200">${Number(u.balance || 0).toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500">Joined:</span>{' '}
                            <span className="text-slate-200">{u.createdAt}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-100">User Details</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Full profile, wallet, packages, earnings breakdown, referrals.
              </p>
            </div>

            {!selectedUserId ? (
              <div className="px-4 py-10 text-center text-[12px] text-slate-500">
                Please select a user to view details
              </div>
            ) : isLoadingDetails ? (
              <div className="px-4 py-10 text-center text-[12px] text-slate-500">Loading user details...</div>
            ) : detailsError ? (
              <div className="px-4 py-8 text-center text-[12px] text-red-300">{detailsError}</div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Profile</div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                      <div><span className="text-slate-500">Full Name:</span> {userDetails?.name || '-'}</div>
                      <div><span className="text-slate-500">Email:</span> {userDetails?.email || '-'}</div>
                      <div><span className="text-slate-500">Phone Number:</span> {userDetails?.phone || '-'}</div>
                      <div><span className="text-slate-500">User ID:</span> {userDetails?.id ?? '-'}</div>
                      <div><span className="text-slate-500">Account Status:</span> {userDetails?.accountStatus || '-'}</div>
                      <div><span className="text-slate-500">KYC Status:</span> {userDetails?.kycStatus || '-'}</div>
                      <div><span className="text-slate-500">Created Date:</span> {fmtDate(userDetails?.createdAt || null)}</div>
                      <div><span className="text-slate-500">Last Login:</span> {fmtDate(userDetails?.lastLogin || null)}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Wallet</div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                      <div className="break-all">
                        <span className="text-slate-500">Wallet Public Address:</span> {shortAddr(userDetails?.walletPublicAddress)}
                      </div>
                      <div>
                        <span className="text-slate-500">Account Balance:</span>{' '}
                        <span className="text-emerald-400 font-semibold">${Number(walletDetails?.balance || 0).toFixed(2)}</span>
                        <span className="text-slate-500"> {walletDetails?.currency || 'USDT'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Referral Code:</span> {userDetails?.referralCode || '-'}
                      </div>
                      <div>
                        <span className="text-slate-500">Referred By (User ID):</span> {userDetails?.referredById ?? '-'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Send Notification</div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Selected user: <span className="text-slate-300">{userDetails?.email || `ID ${selectedUserId}`}</span>
                    </p>

                    <div className="mt-3 space-y-2">
                      <input
                        value={notifyTitle}
                        onChange={(e) => setNotifyTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                        placeholder="Title"
                      />
                      <textarea
                        value={notifyMessage}
                        onChange={(e) => setNotifyMessage(e.target.value)}
                        className="min-h-[90px] w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                        placeholder="Write your message..."
                      />
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={!selectedUserId || isSendingNotify}
                          onClick={() => sendNotification({ toAll: false })}
                          className={
                            'rounded-lg border px-3 py-2 text-[11px] font-semibold ' +
                            (!selectedUserId || isSendingNotify
                              ? 'border-slate-800 text-slate-600'
                              : 'border-emerald-500/40 text-emerald-200 hover:border-emerald-400')
                          }
                        >
                          {isSendingNotify ? 'Sending...' : 'Send'}
                        </button>
                        {notifyStatusText ? (
                          <div className={
                            'text-[11px] ' + (notifyStatus === 'success' ? 'text-emerald-300' : 'text-rose-300')
                          }>
                            {notifyStatusText}
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Export / Backup</div>
                    <p className="mt-1 text-[10px] text-slate-500">Download user data as Excel-friendly CSV files.</p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportOpen(true);
                          setExportKind('');
                          setExportText('');
                        }}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-semibold text-slate-100 hover:border-slate-500"
                      >
                        Open Export Center
                      </button>
                      {exportText ? (
                        <div className={'text-[11px] ' + (exportKind === 'success' ? 'text-emerald-300' : 'text-rose-300')}>
                          {exportText}
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isExportingAll}
                        onClick={exportAllUsersCsv}
                        className={
                          'rounded-lg border px-3 py-2 text-[11px] font-semibold ' +
                          (isExportingAll
                            ? 'border-slate-800 text-slate-600'
                            : 'border-indigo-500/40 text-indigo-200 hover:border-indigo-400')
                        }
                      >
                        {isExportingAll ? 'Exporting...' : 'Export All Users'}
                      </button>
                      <button
                        type="button"
                        disabled={!selectedUserId || isExportingSelected}
                        onClick={exportSelectedUserCsv}
                        className={
                          'rounded-lg border px-3 py-2 text-[11px] font-semibold ' +
                          (!selectedUserId || isExportingSelected
                            ? 'border-slate-800 text-slate-600'
                            : 'border-emerald-500/40 text-emerald-200 hover:border-emerald-400')
                        }
                      >
                        {isExportingSelected ? 'Exporting...' : 'Export Selected'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Broadcast to All Users</div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      This will send the same notification to every user.
                    </p>

                    <div className="mt-3 space-y-2">
                      <input
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                        placeholder="Title"
                      />
                      <textarea
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        className="min-h-[90px] w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                        placeholder="Write your broadcast message..."
                      />
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={isSendingBroadcast}
                          onClick={() => sendNotification({ toAll: true })}
                          className={
                            'rounded-lg border px-3 py-2 text-[11px] font-semibold ' +
                            (isSendingBroadcast
                              ? 'border-slate-800 text-slate-600'
                              : 'border-sky-500/40 text-sky-200 hover:border-sky-400')
                          }
                        >
                          {isSendingBroadcast ? 'Sending...' : 'Send to All'}
                        </button>
                        {broadcastStatusText ? (
                          <div className={
                            'text-[11px] ' + (broadcastStatus === 'success' ? 'text-emerald-300' : 'text-rose-300')
                          }>
                            {broadcastStatusText}
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Active Packages</div>
                    <div className="mt-1 text-[12px] font-semibold text-slate-100">{activePackages.length}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Daily Revenue (Active)</div>
                    <div className="mt-1 text-[12px] font-semibold text-emerald-400">${totalDailyRevenue.toFixed(4)}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-200">Referrals</div>
                    <div className="mt-1 text-[10px] text-slate-300">L1: {referrals?.l1Count ?? 0}</div>
                    <div className="mt-0.5 text-[10px] text-slate-300">L2: {referrals?.l2Count ?? 0}</div>
                    <div className="mt-0.5 text-[10px] text-slate-300">L3: {referrals?.l3Count ?? 0}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                    <div className="text-[11px] font-semibold text-slate-200">Packages Details</div>
                    <div className="text-[10px] text-slate-500">Total: {packages.length}</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="px-3 py-2 text-left">Package</th>
                          <th className="px-3 py-2 text-left">Capital</th>
                          <th className="px-3 py-2 text-left">Daily ROI</th>
                          <th className="px-3 py-2 text-left">Daily Rev</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Total Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {packages.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-slate-500">No packages found.</td>
                          </tr>
                        ) : (
                          packages.map((p) => (
                            <tr key={p.id}>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-slate-100">{p.packageName}</div>
                                <div className="text-[10px] text-slate-500">{p.packageId}  ·  #{p.id}</div>
                              </td>
                              <td className="px-3 py-2">${Number(p.capital || 0).toFixed(2)}</td>
                              <td className="px-3 py-2">{Number(p.dailyRoi || 0).toFixed(2)}%</td>
                              <td className="px-3 py-2 text-emerald-400">${Number(p.dailyRevenue || 0).toFixed(4)}</td>
                              <td className="px-3 py-2">{p.status}</td>
                              <td className="px-3 py-2">${Number(p.totalEarned || 0).toFixed(4)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="border-b border-slate-800 px-3 py-2">
                    <div className="text-[11px] font-semibold text-slate-200">Earnings / Transactions Breakdown</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {earningsRows.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-3 py-4 text-center text-slate-500">No transactions found.</td>
                          </tr>
                        ) : (
                          earningsRows.map((r) => (
                            <tr key={r.type}>
                              <td className="px-3 py-2">{r.type}</td>
                              <td className="px-3 py-2">${Number(r.total || 0).toFixed(4)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                    <div className="text-[11px] font-semibold text-slate-200">Direct Referrals (L1)</div>
                    <div className="text-[10px] text-slate-500">Count: {referrals?.l1Count ?? 0}</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-[11px]">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="px-3 py-2 text-left">User</th>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {!referrals?.l1 || referrals.l1.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-center text-slate-500">No direct referrals.</td>
                          </tr>
                        ) : (
                          referrals.l1.map((r) => (
                            <tr key={r.id}>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-slate-100">{r.name || '(No name)'}</div>
                                <div className="text-[10px] text-slate-500">ID: {r.id} · {r.referralCode || '-'}</div>
                              </td>
                              <td className="px-3 py-2">{r.email || '-'}</td>
                              <td className="px-3 py-2">{r.accountStatus || '-'}</td>
                              <td className="px-3 py-2">{fmtDate(r.createdAt)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="border-b border-slate-800 px-3 py-2">
                    <div className="text-[11px] font-semibold text-slate-200">User Actions</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">Hold / unhold, or permanently delete the selected user.</div>
                  </div>

                  <div className="p-3 space-y-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                        <div className="text-[11px] font-semibold text-slate-200">Account Status</div>
                        <div className="mt-1 text-[11px] text-slate-300">Current: {userDetails?.accountStatus || '-'}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isUpdatingUserStatus}
                            onClick={() =>
                              updateSelectedUserStatus(
                                String(userDetails?.accountStatus || '').toLowerCase() === 'active' ? 'hold' : 'active',
                              )
                            }
                            className={
                              'rounded-lg border px-3 py-2 text-[11px] font-semibold ' +
                              (isUpdatingUserStatus
                                ? 'border-slate-800 text-slate-600'
                                : 'border-amber-500/40 text-amber-200 hover:border-amber-400')
                            }
                          >
                            {isUpdatingUserStatus
                              ? 'Updating...'
                              : String(userDetails?.accountStatus || '').toLowerCase() === 'active'
                                ? 'Hold User'
                                : 'Unhold User'}
                          </button>
                          {userStatusUpdateText ? (
                            <div className={
                              'text-[11px] ' + (userStatusUpdateKind === 'success' ? 'text-emerald-300' : 'text-rose-300')
                            }>
                              {userStatusUpdateText}
                            </div>
                          ) : (
                            <div />
                          )}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500">
                          Hold users are restricted (login may be blocked depending on backend auth settings).
                        </div>
                      </div>

                      <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-3">
                        <div className="text-[11px] font-semibold text-rose-200">Danger Zone</div>
                        <div className="mt-1 text-[10px] text-rose-300">
                          This will delete the user and ALL linked data permanently.
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isDeletingUser}
                            onClick={deleteSelectedUser}
                            className={
                              'rounded-lg border px-3 py-2 text-[11px] font-semibold ' +
                              (isDeletingUser
                                ? 'border-slate-800 text-slate-600'
                                : 'border-rose-500/40 text-rose-200 hover:border-rose-400')
                            }
                          >
                            {isDeletingUser ? 'Deleting...' : 'Delete User Permanently'}
                          </button>
                          {deleteUserText ? (
                            <div className={
                              'text-[11px] ' + (deleteUserKind === 'success' ? 'text-emerald-300' : 'text-rose-300')
                            }>
                              {deleteUserText}
                            </div>
                          ) : (
                            <div />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isExportOpen ? (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
                      <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-100">Export Center</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">Backup users as CSV (opens in Excel).</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsExportOpen(false)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-200 hover:border-slate-500"
                        >
                          Close
                        </button>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold text-slate-200">All Users</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">One CSV file with the full users list.</div>
                            </div>
                            <button
                              type="button"
                              disabled={isExportingAll}
                              onClick={exportAllUsersCsv}
                              className={
                                'rounded-lg border px-3 py-2 text-[11px] font-semibold ' +
                                (isExportingAll
                                  ? 'border-slate-800 text-slate-600'
                                  : 'border-indigo-500/40 text-indigo-200 hover:border-indigo-400')
                              }
                            >
                              {isExportingAll ? 'Exporting...' : 'Download All Users CSV'}
                            </button>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold text-slate-200">Selected User</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                Downloads 4 CSV tables: Profile, Packages, Earnings, Referrals.
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!selectedUserId || isExportingSelected}
                              onClick={exportSelectedUserCsv}
                              className={
                                'rounded-lg border px-3 py-2 text-[11px] font-semibold ' +
                                (!selectedUserId || isExportingSelected
                                  ? 'border-slate-800 text-slate-600'
                                  : 'border-emerald-500/40 text-emerald-200 hover:border-emerald-400')
                              }
                            >
                              {isExportingSelected ? 'Exporting...' : 'Download Selected User CSV'}
                            </button>
                          </div>
                        </div>

                        {exportText ? (
                          <div className={'text-[11px] ' + (exportKind === 'success' ? 'text-emerald-300' : 'text-rose-300')}>
                            {exportText}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
