'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [sendToAll, setSendToAll] = useState(true);
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) router.replace('/admin/login');
  }, [router]);

  const canSend = useMemo(() => {
    if (!title.trim() || !message.trim()) return false;
    if (!sendToAll && !String(userId || '').trim()) return false;
    return true;
  }, [message, sendToAll, title, userId]);

  const handleSend = async () => {
    setStatus(null);

    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    setIsSending(true);
    try {
      const body: any = {
        sendToAll,
        title: title.trim(),
        message: message.trim(),
      };
      if (!sendToAll) body.userId = String(userId).trim();

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setStatus({ type: 'error', text: String(data?.message || 'Failed to send notification') });
        return;
      }

      setStatus({ type: 'success', text: String(data?.message || 'Notification sent') });
      setTitle('');
      setMessage('');
      if (!sendToAll) setUserId('');
    } catch {
      setStatus({ type: 'error', text: 'Failed to send notification' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold">Notifications</h1>
              <p className="mt-1 text-xs text-slate-400">
                Send premium in-app notifications to users. Users will see a dot on the bell icon until they open notifications.
              </p>
            </div>
            <a
              href="/admin"
              className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-200 hover:border-slate-600"
            >
              Back
            </a>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold">Compose</div>
                  <div className="text-[11px] text-slate-400">Short title + clear message works best.</div>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSendToAll(true)}
                    className={
                      'rounded-lg border px-3 py-1.5 ' +
                      (sendToAll
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700')
                    }
                  >
                    Send to all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendToAll(false)}
                    className={
                      'rounded-lg border px-3 py-1.5 ' +
                      (!sendToAll
                        ? 'border-violet-500/60 bg-violet-500/10 text-violet-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700')
                    }
                  >
                    Send to user
                  </button>
                </div>
              </div>

              {!sendToAll && (
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">User ID</label>
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. 123"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[12px] text-slate-100 placeholder:text-slate-600"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Security update"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[12px] text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a clear message for the user..."
                  rows={5}
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[12px] text-slate-100 placeholder:text-slate-600"
                />
              </div>

              {status && (
                <div
                  className={
                    'rounded-xl border p-3 text-[12px] ' +
                    (status.type === 'success'
                      ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-100'
                      : 'border-rose-600/40 bg-rose-500/10 text-rose-100')
                  }
                >
                  {status.text}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] text-slate-500">
                  Tip: keep notifications concise. Users can see full details in their Notifications page.
                </div>
                <button
                  type="button"
                  disabled={!canSend || isSending}
                  onClick={handleSend}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-[12px] font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isSending ? 'Sending...' : 'Send notification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
