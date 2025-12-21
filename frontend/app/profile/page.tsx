'use client';

import { useEffect, useMemo, useState } from 'react';

type KycStatus = 'pending' | 'approved' | 'rejected';

export default function ProfilePage() {
  // Demo data – later map from backend
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser && !cancelled) {
          setUser(JSON.parse(storedUser));
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

        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled) {
          if (data?.success && data?.user) {
            setUser(data.user);
            try {
              localStorage.setItem('user', JSON.stringify(data.user));
            } catch {
              // ignore
            }
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const userName = user?.name || user?.email || 'Account';
  const email = user?.email || '—';
  const phone = user?.phone || '—';
  const kycStatus = (user?.kyc_status as KycStatus) || 'pending';
  const referralCode = user?.referral_code || '—';
  const withdrawalAddress: string | null =
    user?.withdrawal_address || user?.withdrawalAddress || null;

  const memberSince = useMemo(() => {
    const d = user?.createdAt || user?.created_at;
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, { month: 'short', year: 'numeric' });
  }, [user?.createdAt, user?.created_at]);

  const joinDate = memberSince;
  const userId = user?.id ? `ARBX-${user.id}` : '—';
  const lastLogin = '—';

  const referralLink = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://arbix.space') ||
      'https://arbix.space';
    if (!referralCode || referralCode === '—') return `${base}/auth/signup`;
    return `${base}/auth/signup?ref=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const kycBlock = (() => {
    if (kycStatus === 'approved') {
      return {
        title: 'KYC Verified ✔',
        message: 'Your identity is successfully verified.',
        color: 'border-emerald-500/70 bg-emerald-950/20 text-emerald-100',
        button: null,
      } as const;
    }
    if (kycStatus === 'rejected') {
      return {
        title: 'KYC Rejected',
        message:
          'Your submitted documents could not be approved. Please upload them again.',
        color: 'border-red-500/70 bg-red-950/30 text-red-100',
        buttonLabel: 'Retry KYC Verification',
      } as const;
    }
    return {
      title: 'KYC Pending',
      message:
        'Please complete your KYC to unlock full withdrawal access and higher limits.',
      color: 'border-amber-500/70 bg-amber-950/30 text-amber-100',
      buttonLabel: 'Complete KYC',
    } as const;
  })();

  const maskedAddress = withdrawalAddress
    ? `${withdrawalAddress.slice(0, 6)}...${withdrawalAddress.slice(-4)}`
    : null;

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Profile Header */}
      <section className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
            {userName}{' '}
            {isLoading ? (
              <span className="text-[11px] font-medium text-slate-500">(loading...)</span>
            ) : null}
          </h1>
          <p className="mt-1 text-xs text-slate-300 md:text-sm">{email}</p>
          <p className="mt-1 text-[11px] text-slate-500">Member since: {memberSince}</p>
        </div>
      </section>

      {/* KYC Status Block */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs md:text-sm">
          <div className={`rounded-2xl border px-4 py-3 ${kycBlock.color}`}>
            <p className="text-[11px] font-semibold md:text-xs">{kycBlock.title}</p>
            <p className="mt-1 text-[11px] md:text-xs">{kycBlock.message}</p>
            {'buttonLabel' in kycBlock && kycBlock.buttonLabel && (
              <a
                href="/profile/kyc"
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-blue-500"
              >
                {kycBlock.buttonLabel}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-50 md:text-base">
              Personal Information
            </h2>
            <button className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500">
              Edit Profile
            </button>
          </div>
          <div className="mt-3 space-y-2 text-[11px] md:text-xs">
            <p>
              <span className="text-slate-400">Full Name:</span>{' '}
              <span className="font-semibold text-slate-100">{userName}</span>
            </p>
            <p>
              <span className="text-slate-400">Email Address:</span>{' '}
              <span className="font-semibold text-slate-100">{email}</span>
            </p>
            <p>
              <span className="text-slate-400">Phone Number:</span>{' '}
              <span className="font-semibold text-slate-100">{phone}</span>
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Note: Only non-sensitive fields (name and phone) should be editable.
              Email changes require support and additional verification.
            </p>
          </div>
        </div>
      </section>

      {/* Account Details */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Account Details
          </h2>
          <div className="mt-3 space-y-2 text-[11px] md:text-xs">
            <p>
              <span className="text-slate-400">User ID:</span>{' '}
              <span className="font-semibold text-slate-100">{userId}</span>
            </p>
            <p>
              <span className="text-slate-400">Referral Code:</span>{' '}
              <span className="font-semibold text-slate-100">{referralCode}</span>
            </p>
            <div>
              <span className="text-slate-400">Referral Link:</span>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-200">
                  <span className="break-all">{referralLink}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyReferralLink}
                  className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
            <p>
              <span className="text-slate-400">Join Date:</span>{' '}
              <span className="font-semibold text-slate-100">{joinDate}</span>
            </p>
            <p>
              <span className="text-slate-400">Last Login:</span>{' '}
              <span className="font-semibold text-slate-100">{lastLogin}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Security Settings */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Security Settings
          </h2>
          <div className="mt-3 space-y-3 text-[11px] md:text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-100">Change Password</p>
                <p className="text-slate-400">
                  Use the password reset flow to update your login password.
                </p>
              </div>
              <a
                href="/auth/forgot-password"
                className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500"
              >
                Reset Password
              </a>
            </div>

            <div className="flex items-center justify-between gap-2 opacity-70">
              <div>
                <p className="font-semibold text-slate-100">
                  Two-Factor Authentication (2FA)
                </p>
                <p className="text-slate-400">
                  Optional security layer (coming soon). Keep this off for now.
                </p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-400">
                Status: Off
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Withdrawal Address */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            Saved Withdrawal Address
          </h2>
          <div className="mt-3 flex flex-col gap-2 text-[11px] md:text-xs">
            {maskedAddress ? (
              <>
                <p>
                  <span className="text-slate-400">USDT (BEP20) Address:</span>{' '}
                  <span className="font-semibold text-slate-100">{maskedAddress}</span>
                </p>
                <button className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500">
                  Update Address
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-400">No withdrawal address saved yet.</p>
                <button className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500">
                  Add Withdrawal Address
                </button>
              </>
            )}
            <p className="mt-1 text-[10px] text-slate-500">
              For security reasons, withdrawal addresses may require additional
              verification before being changed.
            </p>
          </div>
        </div>
      </section>

      {/* System Settings */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">
            System Settings
          </h2>
          <div className="mt-3 space-y-2 text-[11px] md:text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="text-slate-400">Notifications</p>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-300">
                Default
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 opacity-70">
              <p className="text-slate-400">Language</p>
              <span className="rounded-full border border-slate-800 px-3 py-1 text-[10px] text-slate-500">
                English (default)
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 opacity-70">
              <p className="text-slate-400">Theme</p>
              <span className="rounded-full border border-slate-800 px-3 py-1 text-[10px] text-slate-500">
                Dark (default)
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              App Version: 1.0.0 (UI only – backend versioning can be shown here in
              future).
            </div>
          </div>
        </div>
      </section>

      {/* Logout Section */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <button className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
            Logout
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-500">
            Logging out will clear your current session and redirect you to the
            Login page.
          </p>
        </div>
      </section>
    </div>
  );
}
