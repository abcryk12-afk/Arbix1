'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

 type WithdrawalRequestRow = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  referralCode: string;
  amount: number;
  address: string;
  status: string;
  rawStatus?: string;
  token?: string;
  network?: string;
  autoWithdrawEnabledAtRequest?: boolean | null;
  txHash: string | null;
  userNote: string | null;
  adminNote: string | null;
  requestTime: string;
  walletAddress: string | null;
  userBalance: number;
};

type AdminUserSearchRow = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  withdrawalHoldEnabled?: boolean;
  withdrawalHoldNote?: string | null;
};

type DepositRequestsResponse = {
  success: boolean;
  message?: string;
  config?: {
    depositRequestTtlMinutes?: number;
  };
  requests?: any[];
};

type DepositRequestRow = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  referralCode: string;
  amount: number;
  address: string;
  status: string;
  txHash: string | null;
  userNote: string | null;
  adminNote: string | null;
  requestTime: string;
  walletAddress: string | null;
  userBalance: number;
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
  message?: string;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    withdrawalHoldEnabled?: boolean | null;
    withdrawalHoldNote?: string | null;
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
  };
};

function shortAddr(addr: string | null | undefined) {
  if (!addr) return '-';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return String(value).slice(0, 19).replace('T', ' ');
}

function formatCountdown(msRemaining: number) {
  const ms = Math.max(0, Math.floor(msRemaining));
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function earningsRows(byType?: Record<string, number>) {
  const src = byType || {};
  const order = ['deposit', 'withdraw', 'package_purchase', 'profit', 'referral_profit', 'referral_bonus'];
  const keys = Object.keys(src);
  keys.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return keys.map((k) => ({ type: k, total: Number(src[k] || 0) }));
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequestRow[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequestRow[]>([]);
  const [depositRequestTtlMinutes, setDepositRequestTtlMinutes] = useState<number>(30);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending');
  const [depositFilterStatus, setDepositFilterStatus] = useState<'pending' | 'all'>('pending');
  const [actionMessage, setActionMessage] = useState('');
  const [actionType, setActionType] = useState<'success' | 'error' | ''>('');
  const [actionContext, setActionContext] = useState<'deposit' | 'withdrawal' | ''>('');

  const [autoWithdrawEnabled, setAutoWithdrawEnabled] = useState<boolean>(false);
  const [isLoadingAutoWithdraw, setIsLoadingAutoWithdraw] = useState<boolean>(true);
  const [isUpdatingAutoWithdraw, setIsUpdatingAutoWithdraw] = useState<boolean>(false);

  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestRow | DepositRequestRow | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<'withdrawal' | 'deposit'>('withdrawal');
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [holdUserQuery, setHoldUserQuery] = useState('');
  const [holdUserResults, setHoldUserResults] = useState<AdminUserSearchRow[]>([]);
  const [isSearchingHoldUsers, setIsSearchingHoldUsers] = useState(false);
  const [holdSelectedUserId, setHoldSelectedUserId] = useState<string>('');
  const [holdSelectedUserDetails, setHoldSelectedUserDetails] = useState<UserDetailsResponse | null>(null);
  const [holdActionMessage, setHoldActionMessage] = useState('');
  const [holdActionType, setHoldActionType] = useState<'success' | 'error' | ''>('');

  const DEFAULT_WITHDRAW_REJECT_REASONS = useMemo(
    () => [
      'Incorrect withdrawal address',
      'Insufficient balance',
      'Suspicious activity / account review required',
      'Withdrawal is currently on hold (contact support)',
      'Compliance/KYC required',
    ],
    [],
  );

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string>('');
  const [rejectSelectedReason, setRejectSelectedReason] = useState<string>('');
  const [rejectCustomReason, setRejectCustomReason] = useState<string>('');

  const [withdrawalLimitsMin, setWithdrawalLimitsMin] = useState<string>('10');
  const [withdrawalLimitsMax, setWithdrawalLimitsMax] = useState<string>('');
  const [withdrawalLimitsNote, setWithdrawalLimitsNote] = useState<string>('');
  const [isLoadingWithdrawalLimits, setIsLoadingWithdrawalLimits] = useState<boolean>(true);
  const [isSavingWithdrawalLimits, setIsSavingWithdrawalLimits] = useState<boolean>(false);
  const [withdrawalLimitsMessage, setWithdrawalLimitsMessage] = useState<string>('');
  const [withdrawalLimitsMessageType, setWithdrawalLimitsMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadWithdrawalLimits = async () => {
    try {
      setIsLoadingWithdrawalLimits(true);
      setWithdrawalLimitsMessage('');
      setWithdrawalLimitsMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsLoadingWithdrawalLimits(false);
        return;
      }

      const res = await fetch('/api/admin/withdrawal-limits', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!data?.success) {
        setWithdrawalLimitsMessage(data?.message || 'Failed to load withdrawal limits');
        setWithdrawalLimitsMessageType('error');
        return;
      }

      const settings = data?.settings || {};
      const min = Number(settings?.min);
      const max = settings?.max === null || settings?.max === undefined || settings?.max === '' ? null : Number(settings?.max);
      const note = settings?.note != null ? String(settings.note) : '';

      setWithdrawalLimitsMin(Number.isFinite(min) ? String(min) : '10');
      setWithdrawalLimitsMax(max !== null && Number.isFinite(max) ? String(max) : '');
      setWithdrawalLimitsNote(note);
    } catch {
      setWithdrawalLimitsMessage('Failed to load withdrawal limits');
      setWithdrawalLimitsMessageType('error');
    } finally {
      setIsLoadingWithdrawalLimits(false);
    }
  };

  const saveWithdrawalLimits = async () => {
    try {
      setWithdrawalLimitsMessage('');
      setWithdrawalLimitsMessageType('');
      setIsSavingWithdrawalLimits(true);

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setWithdrawalLimitsMessage('Not logged in');
        setWithdrawalLimitsMessageType('error');
        return;
      }

      const min = Number(withdrawalLimitsMin);
      const maxRaw = withdrawalLimitsMax.trim();
      const max = maxRaw ? Number(maxRaw) : null;
      const note = withdrawalLimitsNote.trim();

      const res = await fetch('/api/admin/withdrawal-limits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          min,
          max,
          note,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!data?.success) {
        setWithdrawalLimitsMessage(data?.message || 'Failed to save withdrawal limits');
        setWithdrawalLimitsMessageType('error');
        return;
      }

      setWithdrawalLimitsMessage('Withdrawal limits updated');
      setWithdrawalLimitsMessageType('success');

      const settings = data?.settings || {};
      const minSaved = Number(settings?.min);
      const maxSaved = settings?.max === null || settings?.max === undefined || settings?.max === '' ? null : Number(settings?.max);
      const noteSaved = settings?.note != null ? String(settings.note) : '';
      setWithdrawalLimitsMin(Number.isFinite(minSaved) ? String(minSaved) : withdrawalLimitsMin);
      setWithdrawalLimitsMax(maxSaved !== null && Number.isFinite(maxSaved) ? String(maxSaved) : '');
      setWithdrawalLimitsNote(noteSaved);
    } catch {
      setWithdrawalLimitsMessage('Failed to save withdrawal limits');
      setWithdrawalLimitsMessageType('error');
    } finally {
      setIsSavingWithdrawalLimits(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const q = holdUserQuery.trim();
        if (!q) {
          setHoldUserResults([]);
          return;
        }

        setIsSearchingHoldUsers(true);
        const res = await fetch(`/api/admin/users?limit=15&q=${encodeURIComponent(q)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (data?.success && Array.isArray(data?.users)) {
          setHoldUserResults(
            data.users.map((u: any) => ({
              id: String(u.id),
              name: String(u.name || ''),
              email: String(u.email || ''),
              referralCode: String(u.referralCode || ''),
              withdrawalHoldEnabled: Boolean(u.withdrawalHoldEnabled),
              withdrawalHoldNote: u.withdrawalHoldNote != null ? String(u.withdrawalHoldNote) : null,
            })),
          );
        } else {
          setHoldUserResults([]);
        }
      } catch {
        if (!cancelled) setHoldUserResults([]);
      } finally {
        if (!cancelled) setIsSearchingHoldUsers(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [holdUserQuery]);

  const loadHoldUserDetails = async (userId: string) => {
    try {
      setHoldActionMessage('');
      setHoldActionType('');
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) {
        setHoldSelectedUserDetails(null);
        setHoldActionMessage(data?.message || 'Failed to load user');
        setHoldActionType('error');
        return;
      }
      setHoldSelectedUserDetails(data);
    } catch {
      setHoldSelectedUserDetails(null);
      setHoldActionMessage('Failed to load user');
      setHoldActionType('error');
    }
  };

  const setWithdrawalHold = async (enabled: boolean) => {
    try {
      setHoldActionMessage('');
      setHoldActionType('');

      if (!holdSelectedUserId) {
        setHoldActionMessage('Please select a user first');
        setHoldActionType('error');
        return;
      }

      const token = localStorage.getItem('adminToken');
      if (!token) return;

      let note: string | undefined;
      if (enabled) {
        note = window.prompt('Withdrawal hold note (shown to user on withdrawal attempt):') || '';
      }

      const res = await fetch(`/api/admin/users/${holdSelectedUserId}/withdrawal-hold`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled, note }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) {
        setHoldActionMessage(data?.message || 'Failed to update withdrawal hold');
        setHoldActionType('error');
        return;
      }

      setHoldActionMessage(data?.message || (enabled ? 'Withdrawal hold enabled' : 'Withdrawal hold disabled'));
      setHoldActionType('success');
      await loadHoldUserDetails(holdSelectedUserId);
    } catch {
      setHoldActionMessage('Failed to update withdrawal hold');
      setHoldActionType('error');
    }
  };

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'pending') {
      return requests.filter((r) => r.status === 'pending' || r.status === 'processing');
    }
    return requests;
  }, [requests, filterStatus]);

  const bscscanTxUrl = (hash?: string | null) => {
    const h = String(hash || '').trim();
    if (!h) return null;
    return `https://bscscan.com/tx/${h}`;
  };

  const filteredDepositRequests = useMemo(() => {
    if (depositFilterStatus === 'pending') {
      return depositRequests.filter((r) => r.status === 'pending');
    }
    return depositRequests;
  }, [depositRequests, depositFilterStatus]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const qs = filterStatus === 'pending' ? '?status=pending&limit=100' : '?status=all&limit=100';
      const res = await fetch(`/api/admin/withdrawal-requests${qs}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data?.success && Array.isArray(data?.requests)) {
        setRequests(
          data.requests.map((r: any) => ({
            id: String(r.id),
            userId: String(r.userId),
            userName: String(r.userName || ''),
            email: String(r.email || ''),
            referralCode: String(r.referralCode || ''),
            amount: Number(r.amount || 0),
            address: String(r.address || ''),
            status: String(r.status || ''),
            rawStatus: r.rawStatus != null ? String(r.rawStatus) : undefined,
            token: r.token != null ? String(r.token) : undefined,
            network: r.network != null ? String(r.network) : undefined,
            autoWithdrawEnabledAtRequest:
              r.autoWithdrawEnabledAtRequest === null || r.autoWithdrawEnabledAtRequest === undefined
                ? null
                : Boolean(r.autoWithdrawEnabledAtRequest),
            txHash: r.txHash != null ? String(r.txHash) : null,
            userNote: r.userNote != null ? String(r.userNote) : null,
            adminNote: r.adminNote != null ? String(r.adminNote) : null,
            requestTime: r.requestTime ? String(r.requestTime).slice(0, 19).replace('T', ' ') : '',
            walletAddress: r.walletAddress != null ? String(r.walletAddress) : null,
            userBalance: Number(r.userBalance || 0),
          })),
        );
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutoWithdrawSetting = async () => {
    try {
      setIsLoadingAutoWithdraw(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/auto-withdraw', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.success) {
        setAutoWithdrawEnabled(Boolean(data.enabled));
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAutoWithdraw(false);
    }
  };

  const toggleAutoWithdraw = async (next: boolean) => {
    try {
      setIsUpdatingAutoWithdraw(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/admin/auto-withdraw', {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (data?.success) {
        setAutoWithdrawEnabled(Boolean(data.enabled));
      }
    } catch {
      // ignore
    } finally {
      setIsUpdatingAutoWithdraw(false);
    }
  };

  const handleDepositAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActionMessage('');
      setActionType('');
      setActionContext('deposit');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setActionMessage('Not logged in');
        setActionType('error');
        return;
      }

      let txHash: string | undefined;
      let adminNote: string | undefined;

      if (action === 'approve') {
        txHash = window.prompt('Enter Tx Hash (optional, for your reference):') || undefined;
        adminNote = window.prompt('Admin note (optional):') || undefined;
      } else {
        adminNote = window.prompt('Reason for rejection (optional):') || undefined;
      }

      const res = await fetch('/api/admin/deposit-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, action, txHash, adminNote }),
      });

      const data = await res.json();
      if (data?.success) {
        setActionMessage(data.message || 'Updated successfully');
        setActionType('success');
        const updated = data.request || {};
        setDepositRequests((prev) =>
          prev.map((r) =>
            r.id === String(updated.id)
              ? {
                  ...r,
                  status: String(updated.status || r.status),
                  txHash: updated.txHash != null ? String(updated.txHash) : r.txHash,
                  adminNote: updated.adminNote != null ? String(updated.adminNote) : r.adminNote,
                }
              : r,
          ),
        );
      } else {
        setActionMessage(data?.message || 'Failed to update deposit request');
        setActionType('error');
      }
    } catch {
      setActionMessage('An error occurred while updating the request');
      setActionType('error');
    }
  };

  const loadDepositRequests = async () => {
    try {
      setIsLoadingDeposits(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const qs = depositFilterStatus === 'pending' ? '?status=pending&limit=100' : '?status=all&limit=100';
      const res = await fetch(`/api/admin/deposit-requests${qs}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as DepositRequestsResponse;
      if (data?.success && Array.isArray(data?.requests)) {
        const ttl = Number(data?.config?.depositRequestTtlMinutes ?? 30);
        if (Number.isFinite(ttl) && ttl > 0) setDepositRequestTtlMinutes(Math.floor(ttl));
        setDepositRequests(
          (data.requests || []).map((r: any) => ({
            id: String(r.id),
            userId: String(r.userId),
            userName: String(r.userName || ''),
            email: String(r.email || ''),
            referralCode: String(r.referralCode || ''),
            amount: Number(r.amount || 0),
            address: String(r.address || ''),
            status: String(r.status || ''),
            txHash: r.txHash != null ? String(r.txHash) : null,
            userNote: r.userNote != null ? String(r.userNote) : null,
            adminNote: r.adminNote != null ? String(r.adminNote) : null,
            requestTime: r.requestTime ? String(r.requestTime) : '',
            walletAddress: r.walletAddress != null ? String(r.walletAddress) : null,
            userBalance: Number(r.userBalance || 0),
          })),
        );
      } else {
        setDepositRequests([]);
      }
    } catch {
      setDepositRequests([]);
    } finally {
      setIsLoadingDeposits(false);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      setIsLoadingDetails(true);
      setDetailsError('');
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setDetailsError('Not logged in');
        return;
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data?.success) {
        setSelectedUserDetails(null);
        setDetailsError(data?.message || 'Failed to load user details');
        return;
      }
      setSelectedUserDetails(data);
    } catch {
      setSelectedUserDetails(null);
      setDetailsError('Failed to load user details');
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
          await loadRequests();
          await loadDepositRequests();
          await loadAutoWithdrawSetting();
          await loadWithdrawalLimits();
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
  }, [router, filterStatus, depositFilterStatus]);

  const submitWithdrawalAction = async (id: string, action: 'approve' | 'reject', txHash?: string, adminNote?: string) => {
    setActionMessage('');
    setActionType('');
    setActionContext('withdrawal');

    const token = localStorage.getItem('adminToken');
    if (!token) {
      setActionMessage('Not logged in');
      setActionType('error');
      return;
    }

    const res = await fetch('/api/admin/withdrawal-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, action, txHash, adminNote }),
    });

    const data = await res.json();
    if (data?.success) {
      setActionMessage(data.message || 'Updated successfully');
      setActionType('success');
      const updated = data.request || {};
      setRequests((prev) =>
        prev.map((r) =>
          r.id === String(updated.id)
            ? {
                ...r,
                status: String(updated.status || r.status),
                txHash: updated.txHash != null ? String(updated.txHash) : r.txHash,
                adminNote: updated.adminNote != null ? String(updated.adminNote) : r.adminNote,
              }
            : r,
        ),
      );
    } else {
      setActionMessage(data?.message || 'Failed to update withdrawal request');
      setActionType('error');
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      let txHash: string | undefined;
      let adminNote: string | undefined;

      if (action === 'approve') {
        txHash = window.prompt('Enter Tx Hash (optional, for your reference):') || undefined;
        adminNote = window.prompt('Admin note (optional):') || undefined;
        if (!adminNote) adminNote = 'Withdrawal approved';
      } else {
        setRejectRequestId(String(id));
        setRejectSelectedReason(DEFAULT_WITHDRAW_REJECT_REASONS[0] || '');
        setRejectCustomReason('');
        setRejectModalOpen(true);
        return;
      }

      await submitWithdrawalAction(String(id), action, txHash, adminNote);
    } catch {
      setActionMessage('An error occurred while updating the request');
      setActionType('error');
    }
  };

  const handleSetWithdrawalHold = async (userId: string, hold: boolean, note: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setActionMessage('Not logged in');
        setActionType('error');
        return;
      }

      const res = await fetch(`/api/admin/users/${userId}/withdrawal-hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hold, note }),
      });

      const data = await res.json();
      if (data?.success) {
        setActionMessage(data.message || 'Updated successfully');
        setActionType('success');
      } else {
        setActionMessage(data?.message || 'Failed to update withdrawal hold');
        setActionType('error');
      }
    } catch {
      setActionMessage('An error occurred while updating the withdrawal hold');
      setActionType('error');
    }
  };

  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">Deposit Requests</h1>
          <p className="mt-1 text-[11px] text-muted md:text-xs">
            Review, approve or reject user deposit requests. Approvals will credit the user wallet
            and create a deposit transaction.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className="text-muted">Filter:</span>
            <button
              type="button"
              onClick={() => setDepositFilterStatus('pending')}
              className={
                'rounded-full px-3 py-1 text-[11px] border ' +
                (depositFilterStatus === 'pending'
                  ? 'bg-warning/10 border-border text-fg'
                  : 'border-border text-muted hover:opacity-95')
              }
            >
              Pending only
            </button>
            <button
              type="button"
              onClick={() => setDepositFilterStatus('all')}
              className={
                'rounded-full px-3 py-1 text-[11px] border ' +
                (depositFilterStatus === 'all'
                  ? 'bg-card text-heading border-border'
                  : 'border-border text-muted hover:opacity-95')
              }
            >
              All statuses
            </button>
            <button
              type="button"
              onClick={loadDepositRequests}
              className="ml-auto rounded-lg border border-border px-3 py-1 text-[11px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
            >
              Refresh
            </button>
          </div>
          {actionMessage && actionContext === 'deposit' && (
            <div
              className={
                'mt-3 rounded-lg border px-3 py-2 text-[11px] ' +
                (actionType === 'success'
                  ? 'border-border bg-success/10 text-fg'
                  : 'border-border bg-danger/10 text-fg')
              }
            >
              {actionMessage}
            </div>
          )}
        </div>
      </section>

      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 text-xs text-muted md:text-sm">
          <div className="arbix-card rounded-2xl overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-[11px]">
              <thead className="bg-surface/60 text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Request ID</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Referral</th>
                  <th className="px-3 py-2 text-left">Amount (USDT)</th>
                  <th className="px-3 py-2 text-left">Wallet Address</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Wallet Balance</th>
                  <th className="px-3 py-2 text-left">Requested At</th>
                  <th className="px-3 py-2 text-left">User Note</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted">
                {isLoadingDeposits ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-muted">
                      Loading deposit requests...
                    </td>
                  </tr>
                ) : filteredDepositRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-muted">
                      No deposit requests found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredDepositRequests.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-heading">#{r.id}</div>
                        {r.txHash && (
                          <div className="mt-0.5 text-[10px] text-muted">Tx: {shortAddr(r.txHash)}</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-heading">{r.userName || '(No name)'}</div>
                        <div className="text-[10px] text-muted">{r.email}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-muted">{r.referralCode || '-'}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-heading">${r.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-[10px] text-fg">{shortAddr(r.address)}</div>
                          <button
                            type="button"
                            onClick={() => r.address && handleCopy(r.address)}
                            className="rounded border border-border px-2 py-0.5 text-[10px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                            disabled={!r.address}
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            r.status === 'pending' && r.txHash
                              ? 'text-heading'
                              : r.status === 'pending'
                              ? 'text-muted'
                              : r.status === 'approved'
                              ? 'text-heading'
                              : r.status === 'rejected'
                              ? 'text-fg'
                              : 'text-muted'
                          }
                        >
                          {(() => {
                            const ttlMs = Math.max(1, depositRequestTtlMinutes) * 60 * 1000;
                            const createdMs = r.requestTime ? new Date(r.requestTime).getTime() : NaN;
                            const isExpired = r.status === 'pending' && !r.txHash && Number.isFinite(createdMs) && (nowMs - createdMs) >= ttlMs;
                            if (isExpired) return 'expired';
                            return r.status === 'pending' && r.txHash ? 'processing' : r.status;
                          })()}
                        </span>

                        {(() => {
                          const ttlMs = Math.max(1, depositRequestTtlMinutes) * 60 * 1000;
                          const createdMs = r.requestTime ? new Date(r.requestTime).getTime() : NaN;
                          const msRemaining = Number.isFinite(createdMs) ? (createdMs + ttlMs - nowMs) : NaN;
                          const showCountdown = r.status === 'pending' && !r.txHash && Number.isFinite(msRemaining);
                          if (!showCountdown) return null;
                          return (
                            <div className="mt-0.5 text-[10px] text-muted">
                              Time left: {formatCountdown(msRemaining)}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-fg">${r.userBalance.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-muted">{fmtDate(r.requestTime) || '-'}</span>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <span className="text-[10px] text-muted">{r.userNote || '-'}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {(() => {
                          const ttlMs = Math.max(1, depositRequestTtlMinutes) * 60 * 1000;
                          const createdMs = r.requestTime ? new Date(r.requestTime).getTime() : NaN;
                          const isExpired = r.status === 'pending' && !r.txHash && Number.isFinite(createdMs) && (nowMs - createdMs) >= ttlMs;
                          if (r.status !== 'pending' || isExpired) {
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setSelectedRequestType('deposit');
                                    setSelectedRequest(r);
                                    await loadUserDetails(r.userId);
                                  }}
                                  className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1 text-[10px] font-medium text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                                >
                                  View Details
                                </button>
                                <span className="text-[10px] text-muted">No actions</span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-col items-end gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  setSelectedRequestType('deposit');
                                  setSelectedRequest(r);
                                  await loadUserDetails(r.userId);
                                }}
                                className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1 text-[10px] font-medium text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDepositAction(r.id, 'approve')}
                                disabled={Boolean(r.txHash)}
                                className={
                                  'inline-flex items-center justify-center rounded-lg px-3 py-1 text-[10px] font-medium ' +
                                  (r.txHash
                                    ? 'bg-muted text-muted cursor-not-allowed'
                                    : 'bg-success text-success-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95')
                                }
                              >
                                {r.txHash ? 'Auto Processing' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDepositAction(r.id, 'reject')}
                                disabled={Boolean(r.txHash)}
                                className={
                                  'inline-flex items-center justify-center rounded-lg px-3 py-1 text-[10px] font-medium ' +
                                  (r.txHash
                                    ? 'bg-muted text-muted cursor-not-allowed'
                                    : 'bg-danger text-danger-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95')
                                }
                              >
                                {r.txHash ? 'Locked' : 'Reject'}
                              </button>
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

      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">Withdrawal Requests</h1>
          <p className="mt-1 text-[11px] text-muted md:text-xs">
            Review, approve or reject user withdrawal requests. Approvals will deduct from the user wallet
            and create a withdraw transaction.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 arbix-card rounded-2xl px-3 py-2 text-[11px] text-muted">
            <span className="font-semibold text-heading">Auto Withdrawals:</span>
            <span className={autoWithdrawEnabled ? 'text-heading' : 'text-muted'}>
              {isLoadingAutoWithdraw ? 'Loading...' : autoWithdrawEnabled ? 'ON' : 'OFF'}
            </span>
            <button
              type="button"
              disabled={isLoadingAutoWithdraw || isUpdatingAutoWithdraw}
              onClick={() => toggleAutoWithdraw(!autoWithdrawEnabled)}
              className={
                'ml-2 rounded-lg border border-border px-3 py-1 font-medium shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60 ' +
                (autoWithdrawEnabled ? 'bg-success/10 text-fg' : 'bg-warning/10 text-fg')
              }
            >
              {isUpdatingAutoWithdraw ? 'Updating...' : autoWithdrawEnabled ? 'Turn OFF' : 'Turn ON'}
            </button>
            <span className="ml-auto text-muted">
              Auto withdrawals are restricted to USDT on BSC.
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className="text-muted">Filter:</span>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={
                'rounded-full px-3 py-1 text-[11px] border ' +
                (filterStatus === 'pending'
                  ? 'bg-warning/10 border-border text-fg'
                  : 'border-border text-muted hover:opacity-95')
              }
            >
              Pending only
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={
                'rounded-full px-3 py-1 text-[11px] border ' +
                (filterStatus === 'all'
                  ? 'bg-card text-heading border-border'
                  : 'border-border text-muted hover:opacity-95')
              }
            >
              All statuses
            </button>
            <button
              type="button"
              onClick={loadRequests}
              className="ml-auto rounded-lg border border-border px-3 py-1 text-[11px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
            >
              Refresh
            </button>
          </div>
          {actionMessage && actionContext === 'withdrawal' && (
            <div
              className={
                'mt-3 rounded-lg border px-3 py-2 text-[11px] ' +
                (actionType === 'success'
                  ? 'border-border bg-success/10 text-fg'
                  : 'border-border bg-danger/10 text-fg')
              }
            >
              {actionMessage}
            </div>
          )}
        </div>
      </section>

      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 text-xs text-muted md:text-sm">
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface/60 shadow-theme-sm">
            <table className="min-w-full divide-y divide-border text-[11px]">
              <thead className="bg-surface/60 text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Request ID</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Referral</th>
                  <th className="px-3 py-2 text-left">Amount (USDT)</th>
                  <th className="px-3 py-2 text-left">Token</th>
                  <th className="px-3 py-2 text-left">Network</th>
                  <th className="px-3 py-2 text-left">Withdrawal Address</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Auto</th>
                  <th className="px-3 py-2 text-left">Wallet Balance</th>
                  <th className="px-3 py-2 text-left">Requested At</th>
                  <th className="px-3 py-2 text-left">User Note</th>
                  <th className="px-3 py-2 text-left">Tx</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted">
                {isLoading ? (
                  <tr>
                    <td colSpan={14} className="px-3 py-6 text-center text-muted">
                      Loading withdrawal requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-3 py-6 text-center text-muted">
                      No withdrawal requests found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-heading">#{r.id}</div>
                        {r.txHash && (
                          <div className="mt-0.5 text-[10px] text-muted">Tx: {shortAddr(r.txHash)}</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-heading">{r.userName || '(No name)'}</div>
                        <div className="text-[10px] text-muted">{r.email}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-muted">{r.referralCode || '-'}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-heading">${r.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-[10px] text-fg">{shortAddr(r.address)}</div>
                          <button
                            type="button"
                            onClick={() => r.address && handleCopy(r.address)}
                            className="rounded border border-border px-2 py-0.5 text-[10px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                            disabled={!r.address}
                          >
                            Copy
                          </button>
                        </div>
                        {r.walletAddress && (
                          <div className="mt-0.5 text-[10px] text-muted">
                            User wallet: {shortAddr(r.walletAddress)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            r.status === 'pending'
                              ? 'text-muted'
                              : r.status === 'processing'
                              ? 'text-muted'
                              : r.status === 'completed'
                              ? 'text-heading'
                              : r.status === 'failed'
                              ? 'text-fg'
                              : 'text-muted'
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {r.autoWithdrawEnabledAtRequest === null || r.autoWithdrawEnabledAtRequest === undefined ? (
                          <span className="text-[10px] text-muted">-</span>
                        ) : r.autoWithdrawEnabledAtRequest ? (
                          <span className="text-[10px] text-heading">ON</span>
                        ) : (
                          <span className="text-[10px] text-muted">OFF</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-fg">${r.userBalance.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-muted">{r.requestTime || '-'}</span>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <span className="text-[10px] text-muted">
                          {r.userNote || '-' }
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {r.txHash ? (
                          <a
                            href={bscscanTxUrl(r.txHash) || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-heading transition hover:opacity-90"
                          >
                            {shortAddr(r.txHash)}
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedRequestType('withdrawal');
                                setSelectedRequest(r);
                                await loadUserDetails(r.userId);
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1 text-[10px] font-medium text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(r.id, 'approve')}
                              className="inline-flex items-center justify-center rounded-lg bg-success px-3 py-1 text-[10px] font-medium text-success-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(r.id, 'reject')}
                              className="inline-flex items-center justify-center rounded-lg bg-danger px-3 py-1 text-[10px] font-medium text-danger-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                            >
                              Reject
                            </button>
                          </div>
                        ) : r.status === 'processing' ? (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedRequestType('withdrawal');
                                setSelectedRequest(r);
                                await loadUserDetails(r.userId);
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1 text-[10px] font-medium text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                            >
                              View Details
                            </button>
                            <span className="text-[10px] text-muted">Auto Processing</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedRequestType('withdrawal');
                                setSelectedRequest(r);
                                await loadUserDetails(r.userId);
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1 text-[10px] font-medium text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                            >
                              View Details
                            </button>
                            <span className="text-[10px] text-muted">No actions</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted md:text-sm">
          <div className="rounded-2xl border border-border bg-surface/60 shadow-theme-sm">
            <div className="border-b border-border px-4 py-3">
              <div className="text-[12px] font-semibold text-heading">Selected Request &amp; User</div>
              <p className="mt-0.5 text-[11px] text-muted">View selected request + user details.</p>
            </div>

            {!selectedRequest ? (
              <div className="px-4 py-10 text-center text-[12px] text-muted">
                Select a request and click View Details
              </div>
            ) : isLoadingDetails ? (
              <div className="px-4 py-10 text-center text-[12px] text-muted">Loading details...</div>
            ) : detailsError ? (
              <div className="px-4 py-8 text-center text-[12px] text-fg">{detailsError}</div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="rounded-xl border border-border bg-surface/40 p-3">
                  <div className="text-[11px] font-semibold text-heading">Request</div>
                  <div className="mt-2 grid gap-2 md:grid-cols-3 text-[11px] text-muted">
                    <div><span className="text-muted">Request ID:</span> #{selectedRequest.id}</div>
                    <div><span className="text-muted">Status:</span> {selectedRequest.status}</div>
                    <div><span className="text-muted">Amount:</span> ${selectedRequest.amount.toFixed(2)}</div>
                    {selectedRequestType === 'withdrawal' ? (
                      <>
                        <div><span className="text-muted">Token:</span> {String((selectedRequest as any)?.token || 'USDT')}</div>
                        <div><span className="text-muted">Network:</span> {String((selectedRequest as any)?.network || 'BSC')}</div>
                        <div>
                          <span className="text-muted">Auto at request:</span>{' '}
                          {((selectedRequest as any)?.autoWithdrawEnabledAtRequest === null || (selectedRequest as any)?.autoWithdrawEnabledAtRequest === undefined)
                            ? '-'
                            : (selectedRequest as any)?.autoWithdrawEnabledAtRequest
                            ? 'ON'
                            : 'OFF'}
                        </div>
                      </>
                    ) : null}
                    <div className="md:col-span-3 break-all">
                      <span className="text-muted">{selectedRequestType === 'deposit' ? 'Wallet Address:' : 'Withdrawal Address:'}</span> {selectedRequest.address}{' '}
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedRequest.address)}
                        className="ml-2 rounded border border-border px-2 py-0.5 text-[10px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
                      >
                        Copy
                      </button>
                    </div>
                    {selectedRequestType === 'withdrawal' && selectedRequest.txHash ? (
                      <div className="md:col-span-3 break-all">
                        <span className="text-muted">Tx Hash:</span>{' '}
                        <a
                          href={bscscanTxUrl(selectedRequest.txHash) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-heading transition hover:opacity-90"
                        >
                          {selectedRequest.txHash}
                        </a>
                      </div>
                    ) : null}
                    <div><span className="text-muted">Requested At:</span> {selectedRequest.requestTime || '-'}</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="text-[11px] font-semibold text-heading">User</div>
                    <div className="mt-2 space-y-1 text-[11px] text-muted">
                      <div><span className="text-muted">Name:</span> {selectedUserDetails?.user?.name || '-'}</div>
                      <div><span className="text-muted">Email:</span> {selectedUserDetails?.user?.email || '-'}</div>
                      <div><span className="text-muted">Phone:</span> {selectedUserDetails?.user?.phone || '-'}</div>
                      <div><span className="text-muted">Account:</span> {selectedUserDetails?.user?.accountStatus || '-'}</div>
                      <div><span className="text-muted">KYC:</span> {selectedUserDetails?.user?.kycStatus || '-'}</div>
                      <div><span className="text-muted">Joined:</span> {fmtDate(selectedUserDetails?.user?.createdAt || null)}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="text-[11px] font-semibold text-heading">Wallet + Referrals</div>
                    <div className="mt-2 space-y-1 text-[11px] text-muted">
                      <div className="break-all"><span className="text-muted">Wallet Address:</span> {selectedUserDetails?.user?.walletPublicAddress || '-'}</div>
                      <div>
                        <span className="text-muted">Balance:</span>{' '}
                        <span className="text-heading font-semibold">
                          ${Number(selectedUserDetails?.wallet?.balance || 0).toFixed(2)}
                        </span>
                        <span className="text-muted"> {selectedUserDetails?.wallet?.currency || 'USDT'}</span>
                      </div>
                      <div><span className="text-muted">Referral Code:</span> {selectedUserDetails?.user?.referralCode || '-'}</div>
                      <div><span className="text-muted">Referrals:</span> L1 {selectedUserDetails?.referrals?.l1Count ?? 0} / L2 {selectedUserDetails?.referrals?.l2Count ?? 0} / L3 {selectedUserDetails?.referrals?.l3Count ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface/40">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <div className="text-[11px] font-semibold text-heading">Packages</div>
                    <div className="text-[10px] text-muted">Total: {Array.isArray(selectedUserDetails?.packages) ? selectedUserDetails!.packages!.length : 0}</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-[11px]">
                      <thead className="text-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Package</th>
                          <th className="px-3 py-2 text-left">Capital</th>
                          <th className="px-3 py-2 text-left">Daily ROI</th>
                          <th className="px-3 py-2 text-left">Daily Rev</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-muted">
                        {Array.isArray(selectedUserDetails?.packages) && selectedUserDetails!.packages!.length ? (
                          selectedUserDetails!.packages!.map((p) => (
                            <tr key={p.id}>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-heading">{p.packageName}</div>
                                <div className="text-[10px] text-muted">{p.packageId} · #{p.id}</div>
                              </td>
                              <td className="px-3 py-2">${Number(p.capital || 0).toFixed(2)}</td>
                              <td className="px-3 py-2">{Number(p.dailyRoi || 0).toFixed(2)}%</td>
                              <td className="px-3 py-2 text-heading">${Number(p.dailyRevenue || 0).toFixed(4)}</td>
                              <td className="px-3 py-2">{p.status}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-muted">No packages found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface/40">
                  <div className="border-b border-border px-3 py-2">
                    <div className="text-[11px] font-semibold text-heading">Earnings Breakdown</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-[11px]">
                      <thead className="text-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-muted">
                        {earningsRows(selectedUserDetails?.earnings?.byType).length ? (
                          earningsRows(selectedUserDetails?.earnings?.byType).map((row) => (
                            <tr key={row.type}>
                              <td className="px-3 py-2">{row.type}</td>
                              <td className="px-3 py-2">${row.total.toFixed(4)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="px-3 py-4 text-center text-muted">No earnings data.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted md:text-sm">
          <div className="rounded-2xl border border-border bg-surface/60 shadow-theme-sm">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-heading">Withdrawal Limits (Global)</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Set global minimum/maximum withdrawal amounts and an instruction message shown to users.
              </p>
            </div>

            <div className="p-4 space-y-4">
              {withdrawalLimitsMessage ? (
                <div
                  className={
                    'rounded-lg border border-border px-3 py-2 text-[11px] ' +
                    (withdrawalLimitsMessageType === 'success' ? 'bg-success/10 text-fg' : 'bg-danger/10 text-fg')
                  }
                >
                  {withdrawalLimitsMessage}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] text-muted">Minimum Withdrawal (USDT)</label>
                  <input
                    value={withdrawalLimitsMin}
                    onChange={(e) => setWithdrawalLimitsMin(e.target.value)}
                    disabled={isLoadingWithdrawalLimits || isSavingWithdrawalLimits}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
                    placeholder="10"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted">Maximum Withdrawal (USDT)</label>
                  <input
                    value={withdrawalLimitsMax}
                    onChange={(e) => setWithdrawalLimitsMax(e.target.value)}
                    disabled={isLoadingWithdrawalLimits || isSavingWithdrawalLimits}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
                    placeholder="(optional)"
                    inputMode="decimal"
                  />
                  <div className="mt-1 text-[10px] text-muted">Leave empty for no maximum limit.</div>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={saveWithdrawalLimits}
                    disabled={isLoadingWithdrawalLimits || isSavingWithdrawalLimits}
                    className="w-full rounded-lg bg-theme-primary px-4 py-2 text-[11px] font-medium text-primary-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
                  >
                    {isSavingWithdrawalLimits ? 'Saving...' : 'Save Limits'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-muted">User Instructions / Reason (shown on user withdraw page)</label>
                <textarea
                  value={withdrawalLimitsNote}
                  onChange={(e) => setWithdrawalLimitsNote(e.target.value)}
                  disabled={isLoadingWithdrawalLimits || isSavingWithdrawalLimits}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
                  placeholder="Example: Maximum withdrawal is limited due to liquidity / compliance checks. Please try smaller amounts."
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={loadWithdrawalLimits}
                  disabled={isLoadingWithdrawalLimits || isSavingWithdrawalLimits}
                  className="rounded-lg border border-border px-3 py-2 text-[11px] font-medium text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
                >
                  {isLoadingWithdrawalLimits ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted md:text-sm">
          <div className="rounded-2xl border border-border bg-surface/60 shadow-theme-sm">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-heading">Withdrawal Hold Control (Per User)</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Search a user and place withdrawals on hold with a note. The note is shown only when the user submits a withdrawal request.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-muted">Search user (id / name / email / referral)</label>
                  <input
                    value={holdUserQuery}
                    onChange={(e) => setHoldUserQuery(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    placeholder="Search..."
                  />
                  <div className="mt-2 rounded-xl border border-border bg-surface/40">
                    <div className="flex items-center justify-between border-b border-border px-3 py-2">
                      <div className="text-[11px] font-semibold text-heading">Results</div>
                      <div className="text-[10px] text-muted">{isSearchingHoldUsers ? 'Searching...' : `${holdUserResults.length}`}</div>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {holdUserResults.length === 0 ? (
                        <div className="px-3 py-4 text-[11px] text-muted">Type to search users.</div>
                      ) : (
                        holdUserResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={async () => {
                              setHoldSelectedUserId(u.id);
                              await loadHoldUserDetails(u.id);
                            }}
                            className={
                              'w-full px-3 py-2 text-left text-[11px] transition hover:opacity-95 ' +
                              (holdSelectedUserId === u.id ? 'bg-muted' : '')
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="font-semibold text-heading">{u.email || u.name || `User #${u.id}`}</div>
                                <div className="text-[10px] text-muted">#{u.id} · {u.referralCode || '-'}</div>
                              </div>
                              <div
                                className={
                                  'rounded-full px-2 py-0.5 text-[10px] border border-border ' +
                                  (u.withdrawalHoldEnabled ? 'bg-warning/10 text-fg' : 'bg-success/10 text-fg')
                                }
                              >
                                {u.withdrawalHoldEnabled ? 'HOLD' : 'OK'}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {holdActionMessage && (
                    <div
                      className={
                        'rounded-lg border border-border px-3 py-2 text-[11px] ' +
                        (holdActionType === 'success' ? 'bg-success/10 text-fg' : 'bg-danger/10 text-fg')
                      }
                    >
                      {holdActionMessage}
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="text-[11px] font-semibold text-heading">Selected User</div>
                    <div className="mt-2 space-y-1 text-[11px] text-muted">
                      <div><span className="text-muted">ID:</span> {holdSelectedUserDetails?.user?.id ?? (holdSelectedUserId || '-')}</div>
                      <div><span className="text-muted">Name:</span> {holdSelectedUserDetails?.user?.name || '-'}</div>
                      <div><span className="text-muted">Email:</span> {holdSelectedUserDetails?.user?.email || '-'}</div>
                      <div><span className="text-muted">Phone:</span> {holdSelectedUserDetails?.user?.phone || '-'}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold text-heading">Withdrawal Hold</div>
                        <div className="mt-0.5 text-[10px] text-muted">
                          Current: {holdSelectedUserDetails?.user?.withdrawalHoldEnabled ? 'ON (Hold)' : 'OFF'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setWithdrawalHold(true)}
                          disabled={!holdSelectedUserId}
                          className="rounded-lg bg-warning px-3 py-2 text-[11px] font-medium text-warning-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
                        >
                          Hold
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithdrawalHold(false)}
                          disabled={!holdSelectedUserId}
                          className="rounded-lg border border-border bg-muted px-3 py-2 text-[11px] font-medium text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
                        >
                          Unhold
                        </button>
                      </div>
                    </div>

                    {holdSelectedUserDetails?.user?.withdrawalHoldEnabled && (
                      <div className="mt-3 rounded-lg border border-border bg-warning/10 p-3 text-[11px] text-fg">
                        <div className="font-semibold">Hold Note (shown to user)</div>
                        <div className="mt-1 whitespace-pre-wrap text-muted">{holdSelectedUserDetails?.user?.withdrawalHoldNote || '-'}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {rejectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-4 shadow-theme-md">
            <div className="text-[13px] font-semibold text-heading">Reject Withdrawal Request</div>
            <div className="mt-1 text-[11px] text-muted">Request #{rejectRequestId}</div>

            <div className="mt-4">
              <label className="block text-[11px] font-medium text-fg">Reason</label>
              <select
                value={rejectSelectedReason}
                onChange={(e) => setRejectSelectedReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-[11px] text-fg shadow-theme-sm"
              >
                {DEFAULT_WITHDRAW_REJECT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-medium text-fg">Custom reason (optional)</label>
              <textarea
                value={rejectCustomReason}
                onChange={(e) => setRejectCustomReason(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-border bg-surface/60 px-3 py-2 text-[11px] text-fg shadow-theme-sm"
                placeholder="Add extra details for the user (optional)"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectRequestId('');
                }}
                className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-[11px] font-medium text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const custom = rejectCustomReason.trim();
                  const note = custom ? `${rejectSelectedReason} - ${custom}` : rejectSelectedReason;
                  setRejectModalOpen(false);
                  const currentId = rejectRequestId;
                  setRejectRequestId('');
                  await submitWithdrawalAction(currentId, 'reject', undefined, note || undefined);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-danger px-3 py-2 text-[11px] font-medium text-danger-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
