'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type WalletUser = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  publicAddress: string;
  privateAddress: string;
  createdAt: string;
};

function shortAddr(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

export default function AdminUserWalletsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q)
      );
    });
  }, [query, users]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const token = localStorage.getItem('token');
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
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/admin/login');
          return;
        }

        const res = await fetch('/api/admin/wallets?limit=100', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!cancelled) {
          if (data?.success && Array.isArray(data?.wallets)) {
            setUsers(
              data.wallets.map((w: any) => ({
                id: String(w.id),
                name: String(w.name || ''),
                email: String(w.email || ''),
                referralCode: String(w.referralCode || ''),
                publicAddress: String(w.publicAddress || ''),
                privateAddress: String(w.privateAddress || ''),
                createdAt: w.createdAt ? String(w.createdAt).slice(0, 19).replace('T', ' ') : '',
              }))
            );
          } else {
            setUsers([]);
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setUsers([]);
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore copy errors in demo
    }
  };

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      {/* Header + Search */}
      <section className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">
              User Wallets
            </h1>
            <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
              Auto-generated wallet records for each new signup user.
            </p>
          </div>
          <div className="w-full md:w-72">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
              placeholder="Search by name, email or referral code"
            />
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full divide-y divide-slate-800 text-[11px]">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">User Name</th>
                  <th className="px-3 py-2 text-left">Email Address</th>
                  <th className="px-3 py-2 text-left">Referral Code</th>
                  <th className="px-3 py-2 text-left">Public Address (Wallet)</th>
                  <th className="px-3 py-2 text-left">Private Address (Wallet)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      No users match this search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td className="px-3 py-2 align-top">
                        <div className="font-semibold text-slate-100">{u.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Joined: {u.createdAt}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">{u.email}</td>
                      <td className="px-3 py-2 align-top">{u.referralCode}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-200">
                            {u.publicAddress ? shortAddr(u.publicAddress) : '-'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(u.publicAddress)}
                            className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
                            disabled={!u.publicAddress}
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-200">
                            {u.privateAddress ? shortAddr(u.privateAddress) : '-'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(u.privateAddress)}
                            className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
                            disabled={!u.privateAddress}
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[10px] text-slate-500">
            Data source (conceptual): users table — name, email, referral_code,
            wallet_public_key, wallet_private_key; ordered by created_at DESC.
          </p>
        </div>
      </section>
    </div>
  );
}
