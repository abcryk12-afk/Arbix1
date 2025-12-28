'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type KycStatus = 'pending' | 'approved' | 'rejected';

export default function ProfilePage() {
  const router = useRouter();
  // Demo data – later map from backend
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error' | ''>('');

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

  const handleStartEdit = () => {
    setSaveMessage('');
    setSaveMessageType('');
    setFormName(user?.name != null ? String(user.name) : '');
    setFormPhone(user?.phone != null ? String(user.phone) : '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSaveMessage('');
    setSaveMessageType('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaveMessage('');
      setSaveMessageType('');

      const token = localStorage.getItem('token');
      if (!token) {
        setSaveMessage('Not logged in');
        setSaveMessageType('error');
        return;
      }

      const payload = {
        name: formName.trim() ? formName.trim() : null,
        phone: formPhone.trim() ? formPhone.trim() : null,
      };

      setIsSaving(true);
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data?.success && data?.user) {
        setUser(data.user);
        try {
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch {
          // ignore
        }
        try {
          window.dispatchEvent(new Event('arbix-user-updated'));
        } catch {
          // ignore
        }
        setSaveMessage(data?.message || 'Profile updated');
        setSaveMessageType('success');
        setIsEditing(false);
      } else {
        setSaveMessage(data?.message || 'Failed to update profile');
        setSaveMessageType('error');
      }
    } catch {
      setSaveMessage('An error occurred while updating your profile');
      setSaveMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
    router.replace('/auth/login');
  };

  const kycBlock = (() => {
    if (kycStatus === 'approved') {
      return {
        title: 'KYC Verified ✔',
        message: 'Your identity is successfully verified.',
        variant: 'emerald',
        button: null,
      } as const;
    }
    if (kycStatus === 'rejected') {
      return {
        title: 'KYC Rejected',
        message:
          'Your submitted documents could not be approved. Please upload them again.',
        variant: 'red',
        buttonLabel: 'Retry KYC Verification',
      } as const;
    }
    return {
      title: 'KYC Pending',
      message:
        'Please complete your KYC to unlock full withdrawal access and higher limits.',
      variant: 'amber',
      buttonLabel: 'Complete KYC',
    } as const;
  })();

  const maskedAddress = withdrawalAddress
    ? `${withdrawalAddress.slice(0, 6)}...${withdrawalAddress.slice(-4)}`
    : null;

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      {/* Profile Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950/95 network-grid-bg">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary ring-1 ring-primary/20">
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
          <div
            className={
              [
                'arbix-card arbix-3d arbix-shine rounded-2xl px-4 py-3',
                kycBlock.variant === 'emerald'
                  ? 'arbix-card-emerald arbix-3d-emerald arbix-shine-emerald text-emerald-100'
                  : kycBlock.variant === 'red'
                  ? 'arbix-card-red arbix-3d-red arbix-shine-red text-red-100'
                  : 'arbix-card-amber arbix-3d-amber arbix-shine-amber text-amber-100',
                kycBlock.variant === 'amber' ? 'arbix-shine-active' : '',
              ].join(' ')
            }
          >
            <p className="text-[11px] font-semibold md:text-xs">{kycBlock.title}</p>
            <p className="mt-1 text-[11px] md:text-xs">{kycBlock.message}</p>
            {'buttonLabel' in kycBlock && kycBlock.buttonLabel && (
              <a
                href="/aml-kyc"
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-500 hover:shadow-lg"
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
          <div className="arbix-card arbix-3d rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-50 md:text-base">
                Personal Information
              </h2>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 transition hover:border-slate-500"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 transition hover:border-slate-500 disabled:opacity-70"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-lg bg-primary px-3 py-1 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-500 hover:shadow-lg disabled:opacity-70"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {saveMessage && (
              <div
                className={
                  'mt-3 rounded-lg border px-3 py-2 text-[11px] ' +
                  (saveMessageType === 'success'
                    ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200'
                    : 'border-red-500/60 bg-red-950/20 text-red-200')
                }
              >
                {saveMessage}
              </div>
            )}

            <div className="mt-3 space-y-2 text-[11px] md:text-xs">
              <div>
                <div className="text-slate-400">Full Name</div>
                {isEditing ? (
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="mt-1 font-semibold text-slate-100">{userName}</div>
                )}
              </div>
              <div>
                <div className="text-slate-400">Email Address</div>
                <input
                  value={email}
                  readOnly
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300"
                />
                <div className="mt-1 text-[10px] text-slate-500">Email cannot be changed.</div>
              </div>
              <div>
                <div className="text-slate-400">Phone Number</div>
                {isEditing ? (
                  <input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="mt-1 font-semibold text-slate-100">{phone}</div>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Note: Only non-sensitive fields (name and phone) should be editable.
                Email changes require support and additional verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Account Details */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="arbix-card arbix-3d rounded-2xl p-4">
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
                  <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-200">
                    <span className="break-all">{referralLink}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReferralLink}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 transition hover:border-slate-500"
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
        </div>
      </section>

      {/* Security Settings */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="arbix-card arbix-3d rounded-2xl p-4">
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
                  className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 transition hover:border-slate-500"
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
        </div>
      </section>

      {/* Withdrawal Address */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="arbix-card arbix-3d rounded-2xl p-4">
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
                  <button className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 transition hover:border-slate-500">
                    Update Address
                  </button>
                </>
              ) : (
                <>
                  <p className="text-slate-400">No withdrawal address saved yet.</p>
                  <button className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1 text-[11px] text-slate-100 transition hover:border-slate-500">
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
        </div>
      </section>

      {/* System Settings */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="arbix-card arbix-3d rounded-2xl p-4">
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
        </div>
      </section>

      {/* Logout Section */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8 text-xs text-slate-300 md:text-sm">
          <div className="arbix-card arbix-3d rounded-2xl p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 hover:shadow-lg"
            >
              Logout
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Logging out will clear your current session and redirect you to the
              Login page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
