'use client';

import { useMemo, useState } from 'react';

type WalletUser = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  publicAddress: string;
  privateAddress: string;
  createdAt: string;
};

const DEMO_USERS: WalletUser[] = [
  {
    id: 'u1',
    name: 'Ali Raza',
    email: 'ali.raza@example.com',
    referralCode: 'ABX123',
    publicAddress: '0x4F3C8b12A1dE90c7187cBf9a2bCE13F29C9A9A27',
    privateAddress: '0xprivkey1-demo-abcdef1234567890',
    createdAt: '2025-12-01 10:12',
  },
  {
    id: 'u2',
    name: 'Sana Malik',
    email: 'sana.malik@example.com',
    referralCode: 'SNM456',
    publicAddress: '0x98De45c1200e89fCbA3dfb22CEF56712AbCdE321',
    privateAddress: '0xprivkey2-demo-0987654321fedcba',
    createdAt: '2025-11-30 18:45',
  },
  {
    id: 'u3',
    name: 'Rehan Khan',
    email: 'rehan.khan@example.com',
    referralCode: 'RHK789',
    publicAddress: '0xAb45cDe1200e89fCbA3dfb22CEF56712AbCdE3FF',
    privateAddress: '0xprivkey3-demo-112233445566',
    createdAt: '2025-11-29 09:30',
  },
];

function shortAddr(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

export default function AdminUserWalletsPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_USERS;
    return DEMO_USERS.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q)
      );
    });
  }, [query]);

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
                {filtered.length === 0 ? (
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
                            {shortAddr(u.publicAddress)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(u.publicAddress)}
                            className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-200">
                            {shortAddr(u.privateAddress)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(u.privateAddress)}
                            className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:border-slate-500"
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
