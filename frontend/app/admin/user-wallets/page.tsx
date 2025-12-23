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
  pathIndex: number | null;
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

  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const selectedUser = useMemo(() => {
    if (!filtered.length) return null;
    if (!selectedUserId) return filtered[0];
    const match = filtered.find((u) => u.id === selectedUserId);
    return match || filtered[0];
  }, [filtered, selectedUserId]);

  useEffect(() => {
    setPage(1);
  }, [query, users.length]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
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
                pathIndex:
                  typeof w.pathIndex === 'number'
                    ? w.pathIndex
                    : w.pathIndex != null
                    ? Number(w.pathIndex)
                    : null,
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

      {/* Wallet inspector for a single selected user */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-4 md:py-6 text-xs text-slate-300 md:text-sm">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 md:text-base">
                  Wallet details for selected user
                </h2>
                <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                  Select a user to inspect their deposit page wallet address and HD path index.
                </p>
              </div>
              <div className="w-full md:w-80">
                <label className="mb-1 block text-[11px] text-slate-400 md:text-xs">
                  Select user
                </label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] text-slate-100 outline-none focus:border-primary"
                  value={selectedUser ? selectedUser.id : ''}
                  onChange={(e) => setSelectedUserId(e.target.value || null)}
                >
                  {filtered.length === 0 ? (
                    <option value="">No users available</option>
                  ) : (
                    filtered.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || '(No name)'}  {u.email}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedUser && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] font-semibold text-slate-300 md:text-xs">
                    Basic info
                  </p>
                  <p className="text-[11px] text-slate-400 md:text-xs">
                    <span className="text-slate-500">Name:</span>{' '}
                    <span className="text-slate-100">{selectedUser.name || '-'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 md:text-xs">
                    <span className="text-slate-500">Email:</span>{' '}
                    <span className="text-slate-100">{selectedUser.email || '-'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 md:text-xs">
                    <span className="text-slate-500">Referral code:</span>{' '}
                    <span className="text-slate-100">{selectedUser.referralCode || '-'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 md:text-xs">
                    <span className="text-slate-500">Joined:</span>{' '}
                    <span className="text-slate-100">{selectedUser.createdAt || '-'}</span>
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] font-semibold text-slate-300 md:text-xs">
                    Wallet + HD index
                  </p>
                  <p className="break-all text-[11px] text-slate-400 md:text-xs">
                    <span className="text-slate-500">Deposit page wallet address:</span>{' '}
                    <span className="text-slate-100">
                      {selectedUser.publicAddress || '-'}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 md:text-xs">
                    <span className="text-slate-500">HD path index (pathIndex):</span>{' '}
                    <span className="text-slate-100">
                      {selectedUser.pathIndex !== null && selectedUser.pathIndex !== undefined
                        ? selectedUser.pathIndex
                        : '-'}
                    </span>
                  </p>
                  <div>
                    <p className="text-[11px] text-slate-400 md:text-xs">
                      <span className="text-slate-500">Decrypted private key:</span>
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 overflow-x-auto rounded border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-200">
                        {selectedUser.privateAddress
                          ? showPrivateKey
                            ? selectedUser.privateAddress
                            : '••••••••••••••••••••••••••••••••'
                          : '-'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey((v) => !v)}
                        className="whitespace-nowrap rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-100 hover:border-slate-500 disabled:opacity-40"
                        disabled={!selectedUser.privateAddress}
                      >
                        {showPrivateKey ? 'Hide' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          selectedUser.privateAddress && handleCopy(selectedUser.privateAddress)
                        }
                        className="whitespace-nowrap rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-100 hover:border-slate-500 disabled:opacity-40"
                        disabled={!selectedUser.privateAddress}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-amber-400">
                    Keep this information secret. Anyone with this private key can control this wallet.
                  </p>
                </div>
              </div>
            )}
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
                  paginated.map((u) => (
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
                          <div className="max-w-[180px] overflow-x-auto whitespace-nowrap rounded border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-200 md:max-w-none">
                            {u.privateAddress || '-'}
                          </div>
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

          <div className="mt-3 flex flex-col gap-2 text-[11px] text-slate-400 md:flex-row md:items-center md:justify-between">
            <div>
              {filtered.length === 0 ? (
                'No wallet records to display'
              ) : (
                (() => {
                  const startIndex = (page - 1) * PAGE_SIZE + 1;
                  const endIndex = Math.min(filtered.length, page * PAGE_SIZE);
                  return (
                    <>
                      Showing <span className="font-semibold text-slate-100">{startIndex}</span>–
                      <span className="font-semibold text-slate-100">{endIndex}</span> of
                      <span className="font-semibold text-slate-100"> {filtered.length}</span> users
                    </>
                  );
                })()
              )}
            </div>
            {filtered.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-800 px-2 py-1 text-[10px] text-slate-200 hover:border-slate-600 disabled:opacity-40 disabled:hover:border-slate-800"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === page;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-800 px-2 py-1 text-[10px] text-slate-200 hover:border-slate-600 disabled:opacity-40 disabled:hover:border-slate-800"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
