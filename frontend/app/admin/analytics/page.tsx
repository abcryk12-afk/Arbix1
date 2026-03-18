'use client';

import { useEffect, useMemo, useState } from 'react';

type AnalyticsUserRow = {
  id: number;
  name: string;
  email: string;
  accountStatus: string | null;
  createdAt: string | null;
  lastLoginAt: string | null;
};

type SummaryData = {
  cards: {
    totalUsersToday: number;
    totalSessionsToday: number;
    totalLoginsToday: number;
    totalLogoutsToday: number;
    activeUsersToday: number;
  };
  dailyVisits: Array<{ date: string | null; sessions: number }>;
  dailyLoginsLogouts: Array<{ date: string | null; logins: number; logouts: number }>;
  hourlyPeak: Array<{ hour: number; sessions: number }>;
  newVsReturning: Array<{ date: string | null; newUsers: number; returningUsers: number }>;
};

type UserActivityResponse = {
  kpis: {
    totalLogins: number;
    totalLogouts: number;
    lastLoginAt: string | null;
    lastLogoutAt: string | null;
    totalActiveTimeMs: number;
    failedLoginAttempts: number;
  };
  daily: Array<{ date: string | null; logins: number; logouts: number; totalSessionMs: number }>;
  sessions: Array<{
    sessionId: string;
    loginTime: string | null;
    logoutTime: string | null;
    durationMs: number | null;
    ipAddress: string | null;
    deviceInfo: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function formatMs(ms: number | null) {
  if (ms == null) return '-';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

function LineChart({ points }: { points: Array<{ label: string; value: number }> }) {
  const w = 640;
  const h = 160;
  const pad = 14;

  const maxV = Math.max(1, ...points.map((p) => p.value));
  const minV = 0;

  const d = points
    .map((p, i) => {
      const x = pad + (points.length <= 1 ? 0 : (i * (w - pad * 2)) / (points.length - 1));
      const y = h - pad - ((p.value - minV) * (h - pad * 2)) / (maxV - minV);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
      {points.map((p, i) => {
        const x = pad + (points.length <= 1 ? 0 : (i * (w - pad * 2)) / (points.length - 1));
        const y = h - pad - ((p.value - minV) * (h - pad * 2)) / (maxV - minV);
        return <circle key={p.label + i} cx={x} cy={y} r={3} className="fill-primary" />;
      })}
    </svg>
  );
}

function BarChart({ rows }: { rows: Array<{ label: string; a: number; b: number }> }) {
  const w = 640;
  const h = 180;
  const pad = 14;
  const barW = rows.length ? (w - pad * 2) / rows.length : 0;

  const maxV = Math.max(1, ...rows.flatMap((r) => [r.a, r.b]));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
      {rows.map((r, i) => {
        const x0 = pad + i * barW;
        const aH = ((r.a || 0) * (h - pad * 2)) / maxV;
        const bH = ((r.b || 0) * (h - pad * 2)) / maxV;
        const aX = x0 + barW * 0.18;
        const bX = x0 + barW * 0.54;
        const bw = barW * 0.22;

        return (
          <g key={r.label + i}>
            <rect x={aX} y={h - pad - aH} width={bw} height={aH} className="fill-primary/70" />
            <rect x={bX} y={h - pad - bH} width={bw} height={bH} className="fill-accent/70" />
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [view, setView] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [userQuery, setUserQuery] = useState('');
  const [userStatus, setUserStatus] = useState<'all' | 'active' | 'hold'>('all');
  const [userResults, setUserResults] = useState<AnalyticsUserRow[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const [userActivityLoading, setUserActivityLoading] = useState(false);
  const [userActivity, setUserActivity] = useState<UserActivityResponse | null>(null);
  const [sessionPage, setSessionPage] = useState(1);

  const rangeParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set('view', view);
    if (view === 'custom') {
      if (from) p.set('from', from);
      if (to) p.set('to', to);
    }
    return p;
  }, [view, from, to]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setSummaryLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const res = await fetch(`/api/admin/analytics/summary?${rangeParams.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);
        if (!cancelled && data?.success) {
          setSummary(data?.data || null);
        }
      } catch {
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [rangeParams]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setUserLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const params = new URLSearchParams();
        if (userQuery.trim()) params.set('q', userQuery.trim());
        if (userStatus !== 'all') params.set('status', userStatus);
        params.set('limit', userQuery.trim() ? '20' : '10');

        const res = await fetch(`/api/admin/analytics/users?${params.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);
        if (!cancelled && data?.success && Array.isArray(data?.users)) {
          setUserResults(
            data.users.map((u: any) => ({
              id: Number(u.id),
              name: String(u.name || ''),
              email: String(u.email || ''),
              accountStatus: u.accountStatus != null ? String(u.accountStatus) : null,
              createdAt: u.createdAt != null ? String(u.createdAt) : null,
              lastLoginAt: u.lastLoginAt != null ? String(u.lastLoginAt) : null,
            }))
          );
          if (!selectedUserId && data.users.length) {
            setSelectedUserId(Number(data.users[0].id));
          }
        }
      } catch {
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [userQuery, userStatus, selectedUserId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!selectedUserId) {
        setUserActivity(null);
        return;
      }

      try {
        setUserActivityLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const params = new URLSearchParams(rangeParams);
        params.set('userId', String(selectedUserId));
        params.set('page', String(sessionPage));
        params.set('limit', '25');

        const res = await fetch(`/api/admin/analytics/user-activity?${params.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);
        if (!cancelled && data?.success) {
          setUserActivity(data);
        }
      } catch {
      } finally {
        if (!cancelled) setUserActivityLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedUserId, rangeParams, sessionPage]);

  const linePoints = useMemo(() => {
    const rows = summary?.dailyVisits || [];
    return rows.map((r) => ({ label: r.date || '-', value: Number(r.sessions || 0) }));
  }, [summary]);

  const barRows = useMemo(() => {
    const rows = summary?.dailyLoginsLogouts || [];
    return rows.map((r) => ({ label: r.date || '-', a: Number(r.logins || 0), b: Number(r.logouts || 0) }));
  }, [summary]);

  const totalSessionPages = useMemo(() => {
    const total = Number(userActivity?.total || 0);
    const limit = Number(userActivity?.limit || 25);
    return Math.max(1, Math.ceil(total / Math.max(1, limit)));
  }, [userActivity]);

  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 md:py-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Analytics</h1>
              <p className="mt-1 text-[11px] text-muted">User activity & visit monitoring (non-invasive v1).</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setView('today')} className={`rounded-lg border px-3 py-1 text-[11px] ${view === 'today' ? 'border-border2 bg-card text-heading' : 'border-border text-muted hover:text-heading'}`}>Today</button>
                <button type="button" onClick={() => setView('7d')} className={`rounded-lg border px-3 py-1 text-[11px] ${view === '7d' ? 'border-border2 bg-card text-heading' : 'border-border text-muted hover:text-heading'}`}>Last 7 days</button>
                <button type="button" onClick={() => setView('30d')} className={`rounded-lg border px-3 py-1 text-[11px] ${view === '30d' ? 'border-border2 bg-card text-heading' : 'border-border text-muted hover:text-heading'}`}>Last 30 days</button>
                <button type="button" onClick={() => setView('custom')} className={`rounded-lg border px-3 py-1 text-[11px] ${view === 'custom' ? 'border-border2 bg-card text-heading' : 'border-border text-muted hover:text-heading'}`}>Custom</button>
              </div>
              {view === 'custom' && (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] text-muted mb-1">From</div>
                    <input value={from} onChange={(e) => setFrom(e.target.value)} type="date" className="h-9 w-full rounded-lg border border-border bg-surface/60 px-3 text-[12px]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted mb-1">To</div>
                    <input value={to} onChange={(e) => setTo(e.target.value)} type="date" className="h-9 w-full rounded-lg border border-border bg-surface/60 px-3 text-[12px]" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] text-muted mb-1">User search</div>
              <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Name, email, or ID" className="h-9 w-full rounded-lg border border-border bg-surface/60 px-3 text-[12px]" />
              <div className="mt-2 flex items-center gap-2">
                <select value={userStatus} onChange={(e) => setUserStatus(e.target.value as any)} className="h-9 w-full rounded-lg border border-border bg-surface/60 px-3 text-[12px]">
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="hold">Hold</option>
                </select>
              </div>
              <div className="mt-2 text-[11px] text-muted">{userLoading ? 'Searching…' : `${userResults.length} results`}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              {['totalUsersToday', 'totalSessionsToday', 'totalLoginsToday', 'totalLogoutsToday', 'activeUsersToday'].map((k) => (
                <div key={k} className="rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted">{k.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="mt-2 text-lg font-semibold text-heading">
                    {summaryLoading ? '-' : String((summary?.cards as any)?.[k] ?? 0)}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-heading">Daily visits</div>
                  <div className="text-[11px] text-muted">Sessions per day</div>
                </div>
              </div>
              <div className="mt-2">
                {summaryLoading ? (
                  <div className="text-[12px] text-muted">Loading…</div>
                ) : linePoints.length ? (
                  <LineChart points={linePoints} />
                ) : (
                  <div className="text-[12px] text-muted">No data</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm">
              <div>
                <div className="text-sm font-semibold text-heading">Logins vs Logouts</div>
                <div className="text-[11px] text-muted">Daily bars</div>
              </div>
              <div className="mt-2">
                {summaryLoading ? (
                  <div className="text-[12px] text-muted">Loading…</div>
                ) : barRows.length ? (
                  <BarChart rows={barRows.map((r) => ({ label: r.label, a: r.a, b: r.b }))} />
                ) : (
                  <div className="text-[12px] text-muted">No data</div>
                )}
              </div>
              <div className="mt-2 text-[11px] text-muted">Primary=Logins, Accent=Logouts</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm">
              <div className="text-sm font-semibold text-heading">Selected user</div>
              <div className="mt-2 space-y-2">
                <select
                  value={selectedUserId ?? ''}
                  onChange={(e) => {
                    setSessionPage(1);
                    const v = e.target.value ? Number(e.target.value) : null;
                    setSelectedUserId(v);
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-surface/60 px-3 text-[12px]"
                >
                  {userResults.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ? `${u.name} (${u.email})` : u.email}#{u.id}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted">Total logins</div>
                    <div className="mt-1 text-sm font-semibold text-heading">{userActivityLoading ? '-' : String(userActivity?.kpis?.totalLogins ?? 0)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted">Total logouts</div>
                    <div className="mt-1 text-sm font-semibold text-heading">{userActivityLoading ? '-' : String(userActivity?.kpis?.totalLogouts ?? 0)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted">Last login</div>
                    <div className="mt-1 text-[11px] text-muted break-words">{userActivityLoading ? '-' : (userActivity?.kpis?.lastLoginAt ?? '-')}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted">Active time</div>
                    <div className="mt-1 text-sm font-semibold text-heading">{userActivityLoading ? '-' : formatMs(userActivity?.kpis?.totalActiveTimeMs ?? 0)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-4 shadow-theme-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-heading">Sessions</div>
                  <div className="text-[11px] text-muted">Latest logins (paginated)</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={sessionPage <= 1}
                    onClick={() => setSessionPage((p) => clamp(p - 1, 1, 100000))}
                    className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <div className="text-[11px] text-muted">{sessionPage}/{totalSessionPages}</div>
                  <button
                    type="button"
                    disabled={sessionPage >= totalSessionPages}
                    onClick={() => setSessionPage((p) => clamp(p + 1, 1, 100000))}
                    className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-3 overflow-auto">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="text-muted">
                    <tr>
                      <th className="px-2 py-2">Login</th>
                      <th className="px-2 py-2">Logout</th>
                      <th className="px-2 py-2">Duration</th>
                      <th className="px-2 py-2">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(userActivity?.sessions || []).map((s) => (
                      <tr key={s.sessionId} className="border-t border-border/60">
                        <td className="px-2 py-2 whitespace-nowrap">{s.loginTime || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{s.logoutTime || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{formatMs(s.durationMs)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{s.ipAddress || '-'}</td>
                      </tr>
                    ))}
                    {!userActivityLoading && (!userActivity?.sessions || userActivity.sessions.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-2 py-3 text-muted">No sessions found</td>
                      </tr>
                    )}
                    {userActivityLoading && (
                      <tr>
                        <td colSpan={4} className="px-2 py-3 text-muted">Loading…</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
