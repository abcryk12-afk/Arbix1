'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type SiteAsset = {
  url: string;
  mime: string;
  bytes: number;
  updatedAt: string;
} | null;

type AdminAssetsResponse = {
  success: boolean;
  assets?: {
    favicon?: SiteAsset;
    logo?: SiteAsset;
    ogImage?: SiteAsset;
  };
  message?: string;
};

const MAX_BYTES = {
  favicon: 200 * 1024,
  logo: 1024 * 1024,
  ogImage: 2 * 1024 * 1024,
} as const;

const ACCEPT = {
  favicon: 'image/x-icon,image/vnd.microsoft.icon,image/png',
  logo: 'image/png,image/jpeg,image/webp,image/svg+xml',
  ogImage: 'image/png,image/jpeg,image/webp',
} as const;

function formatBytes(bytes: number) {
  const b = Number(bytes || 0);
  if (!Number.isFinite(b) || b <= 0) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

export default function AdminSiteSettingsPage() {
  const router = useRouter();

  const [assets, setAssets] = useState<AdminAssetsResponse['assets']>({});
  const [loading, setLoading] = useState(false);

  const [statusText, setStatusText] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error' | ''>('');

  const [busyKey, setBusyKey] = useState<'' | 'favicon' | 'logo' | 'ogImage'>('');

  const loadAssets = async () => {
    try {
      setLoading(true);
      setStatusText('');
      setStatusKind('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/site-assets', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: AdminAssetsResponse = await res.json().catch(() => ({ success: false } as any));
      if (!res.ok || !data?.success) {
        setAssets({});
        setStatusText(data?.message || 'Failed to load site assets');
        setStatusKind('error');
        return;
      }

      setAssets(data.assets || {});
    } catch {
      setAssets({});
      setStatusText('Failed to load site assets');
      setStatusKind('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (key: 'favicon' | 'logo' | 'ogImage', file: File | null) => {
    if (!file) return;

    setStatusText('');
    setStatusKind('');

    const max = MAX_BYTES[key];
    if (file.size > max) {
      setStatusText(`File too large. Max allowed is ${formatBytes(max)}.`);
      setStatusKind('error');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      setBusyKey(key);

      const dataUrl = await readFileAsDataUrl(file);

      const res = await fetch(`/api/admin/site-assets?asset=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dataUrl }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setStatusText(data?.message || 'Upload failed');
        setStatusKind('error');
        return;
      }

      setStatusText('Asset uploaded successfully.');
      setStatusKind('success');
      await loadAssets();
    } catch {
      setStatusText('Upload failed. Please try again.');
      setStatusKind('error');
    } finally {
      setBusyKey('');
    }
  };

  const removeAsset = async (key: 'favicon' | 'logo' | 'ogImage') => {
    setStatusText('');
    setStatusKind('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      setBusyKey(key);

      const res = await fetch(`/api/admin/site-assets?asset=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setStatusText(data?.message || 'Delete failed');
        setStatusKind('error');
        return;
      }

      setStatusText('Asset removed.');
      setStatusKind('success');
      await loadAssets();
    } catch {
      setStatusText('Delete failed. Please try again.');
      setStatusKind('error');
    } finally {
      setBusyKey('');
    }
  };

  const rows = useMemo(
    () =>
      [
        { key: 'favicon' as const, label: 'Favicon', help: 'Accepted: .ico or .png' },
        { key: 'logo' as const, label: 'Site Logo', help: 'Accepted: png/jpg/webp/svg' },
        { key: 'ogImage' as const, label: 'Default OG Image', help: 'Accepted: png/jpg/webp' },
      ] as const,
    [],
  );

  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Site Settings</h1>
              <p className="mt-1 text-[11px] text-muted md:text-xs">Upload favicon/logo/OG image for the entire site.</p>
            </div>

            <button
              type="button"
              onClick={loadAssets}
              disabled={loading}
              className="rounded-lg border border-border px-3 py-1 text-[11px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {statusText && (
            <div
              className={
                'mt-3 rounded-lg border p-3 text-[11px] ' +
                (statusKind === 'success'
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-danger/40 bg-danger/10 text-danger')
              }
            >
              {statusText}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        <div className="grid gap-4 md:grid-cols-3">
          {rows.map((r) => {
            const current = (assets as any)?.[r.key] as SiteAsset;
            const isBusy = busyKey === r.key;
            return (
              <div key={r.key} className="arbix-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-heading">{r.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{r.help}</div>
                  </div>
                  <div className="text-[11px] text-subtle">
                    {current?.bytes ? formatBytes(current.bytes) : '—'}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-border bg-surface/40 p-3">
                  {current?.url ? (
                    <div className="space-y-2">
                      <div className="text-[11px] text-muted break-all">{current.url}</div>
                      <div className="text-[10px] text-subtle">Updated: {current.updatedAt ? String(current.updatedAt).slice(0, 19).replace('T', ' ') : '—'}</div>
                      <a
                        href={current.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg border border-border px-3 py-1 text-[11px] text-fg hover:opacity-95"
                      >
                        Preview
                      </a>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted">No file uploaded.</div>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <input
                    type="file"
                    accept={(ACCEPT as any)[r.key]}
                    onChange={(e) => upload(r.key, e.target.files?.[0] || null)}
                    disabled={isBusy}
                    className="block w-full text-[11px] text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface/40 file:px-3 file:py-1.5 file:text-[11px] file:text-fg"
                    aria-label={`${r.label} upload`}
                  />

                  <button
                    type="button"
                    onClick={() => removeAsset(r.key)}
                    disabled={isBusy || !current?.url}
                    className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[11px] font-medium text-danger transition hover:border-danger/60 hover:shadow-theme-sm disabled:opacity-50"
                  >
                    {isBusy ? 'Working…' : 'Remove'}
                  </button>
                </div>

                <div className="mt-3 text-[10px] text-subtle">
                  Max size: {formatBytes((MAX_BYTES as any)[r.key])}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
