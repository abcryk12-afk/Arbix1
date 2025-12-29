'use client';

import { useEffect, useMemo, useState } from 'react';

type UserNotification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | null;
};

function fmtDate(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 19).replace('T', ' ');
}

export default function DashboardNotificationsPage() {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMarking, setIsMarking] = useState(false);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const load = async (): Promise<UserNotification[]> => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not logged in');
        setItems([]);
        return [];
      }

      const res = await fetch('/api/user/notifications?limit=50', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(String(data?.message || 'Failed to load notifications'));
        setItems([]);
        return [];
      }

      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      const mapped = list.map((n: any) => ({
        id: Number(n.id),
        title: String(n.title || 'Notification'),
        message: String(n.message || ''),
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt ? String(n.createdAt) : null,
      }));
      setItems(mapped);
      return mapped;
    } catch {
      setError('Failed to load notifications');
      setItems([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const markRead = async (mode: 'all' | 'one', id?: number) => {
    setIsMarking(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const body =
        mode === 'all'
          ? { all: true }
          : { ids: [Number(id)] };

      const res = await fetch('/api/user/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        if (mode === 'all') {
          setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } else {
          setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        }
        window.dispatchEvent(new Event('arbix-notifications-updated'));
      }
    } catch {
      // ignore
    } finally {
      setIsMarking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const latest = await load();
      if (cancelled) return;
      const hasUnread = (latest || []).some((n) => !n.isRead);
      if (hasUnread) await markRead('all');
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(100vh-140px)] bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Notifications</h1>
              <p className="mt-1 text-xs text-slate-400">
                Important updates from Arbix. New notifications show a dot on your bell icon.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isMarking || unreadCount === 0}
                onClick={() => markRead('all')}
                className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-200 hover:border-slate-700 disabled:opacity-50"
              >
                {isMarking ? 'Working...' : 'Mark all as read'}
              </button>
              <a
                href="/dashboard"
                className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-200 hover:border-slate-700"
              >
                Back
              </a>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] text-slate-400">
            <span>Total: {items.length}</span>
            <span>Unread: {unreadCount}</span>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-700/40 bg-rose-500/10 p-4 text-[12px] text-rose-100">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-[12px] text-slate-300">
              Loading notifications...
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        {!isLoading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-[12px] text-slate-400">
            No notifications yet.
          </div>
        )}

        <div className="grid gap-3">
          {items.map((n) => (
            <div
              key={String(n.id)}
              className={
                'rounded-2xl border bg-slate-950/60 p-4 ' +
                (n.isRead ? 'border-slate-800' : 'border-emerald-600/40')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-100">{n.title}</div>
                    {!n.isRead && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{fmtDate(n.createdAt)}</div>
                </div>

                {!n.isRead && (
                  <button
                    type="button"
                    disabled={isMarking}
                    onClick={() => markRead('one', n.id)}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-[11px] text-slate-200 hover:border-slate-700 disabled:opacity-50"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="mt-3 text-[12px] leading-relaxed text-slate-200 whitespace-pre-line">
                {n.message}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
