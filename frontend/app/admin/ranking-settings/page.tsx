'use client';

import { useEffect, useMemo, useState } from 'react';

type RankRow = {
  rank_name: string;
  min_balance: number;
};

const desiredRanks = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'];

export default function AdminRankingSettingsPage() {
  const [rows, setRows] = useState<RankRow[]>(desiredRanks.map((r) => ({ rank_name: r, min_balance: 0 })));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const normalizedRows = useMemo(() => {
    const by = new Map(rows.map((r) => [String(r.rank_name).toUpperCase(), r]));
    return desiredRanks.map((name) => {
      const found = by.get(name);
      return {
        rank_name: name,
        min_balance: Number(found?.min_balance || 0),
      };
    });
  }, [rows]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setMessage('');
        setMessageType('');

        const token = localStorage.getItem('adminToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/admin/ranking/config', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && data?.success && Array.isArray(data?.ranks)) {
          setRows(
            desiredRanks.map((name) => {
              const match = data.ranks.find((x: any) => String(x?.rank_name || x?.rankName).toUpperCase() === name);
              return {
                rank_name: name,
                min_balance: Number(match?.min_balance ?? match?.minBalance ?? 0),
              };
            })
          );
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateValue = (rank: string, value: string) => {
    const n = Number(value);
    const v = Number.isFinite(n) ? Math.max(0, n) : 0;
    setRows((prev) => prev.map((r) => (r.rank_name === rank ? { ...r, min_balance: v } : r)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      setMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setMessage('Not logged in');
        setMessageType('error');
        return;
      }

      const payload = {
        ranks: normalizedRows.map((r) => ({ rank_name: r.rank_name, min_balance: Number(r.min_balance || 0) })),
      };

      const res = await fetch('/api/admin/ranking/config', {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setMessage('Ranking settings updated');
        setMessageType('success');
      } else {
        setMessage(data?.message || 'Failed to update ranking settings');
        setMessageType('error');
      }
    } catch {
      setMessage('Failed to update ranking settings');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-5 md:py-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Ranking Settings</h1>
              <p className="mt-1 text-[11px] text-muted">Configure A1–A7 thresholds (Total Team Active Balance).</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-lg bg-theme-primary px-4 py-2 text-[12px] font-medium text-primary-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {message && (
            <div
              className={
                'mt-4 rounded-xl border px-4 py-3 text-[12px] ' +
                (messageType === 'success'
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-danger/40 bg-danger/10 text-danger')
              }
            >
              {message}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-surface/60 shadow-theme-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 text-[11px] text-muted">
            Minimum Total Team Active Balance (USD)
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-left text-[12px]">
              <thead className="text-muted">
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Min Balance</th>
                </tr>
              </thead>
              <tbody>
                {normalizedRows.map((r) => (
                  <tr key={r.rank_name} className="border-b border-border/40">
                    <td className="px-4 py-3 font-semibold text-heading">{r.rank_name}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={Number(r.min_balance || 0)}
                        onChange={(e) => updateValue(r.rank_name, e.target.value)}
                        disabled={loading}
                        className="h-9 w-56 rounded-lg border border-border bg-surface/40 px-3 text-[12px] outline-none focus:border-primary"
                      />
                    </td>
                  </tr>
                ))}

                {loading && (
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-[12px] text-muted">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-[11px] text-muted">
          Rank assignment picks the highest rank where team active balance ≥ min.
        </div>
      </div>
    </div>
  );
}
