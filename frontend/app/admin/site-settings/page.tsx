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

function previewBoxClass(key: 'favicon' | 'logo' | 'ogImage') {
  if (key === 'favicon') return 'h-10 w-10';
  if (key === 'logo') return 'h-16 w-auto max-w-full';
  return 'h-24 w-auto max-w-full';
}

export default function AdminSiteSettingsPage() {
  const router = useRouter();

  const [assets, setAssets] = useState<AdminAssetsResponse['assets']>({});
  const [loading, setLoading] = useState(false);

  const [pendingFiles, setPendingFiles] = useState<Partial<Record<'favicon' | 'logo' | 'ogImage', File>>>({});

  const [pendingPreviewUrls, setPendingPreviewUrls] = useState<Partial<Record<'favicon' | 'logo' | 'ogImage', string>>>({});

  const [statusText, setStatusText] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error' | ''>('');

  const [busyKey, setBusyKey] = useState<'' | 'favicon' | 'logo' | 'ogImage'>('');

  const [backupPassword, setBackupPassword] = useState('');
  const [dbBusy, setDbBusy] = useState(false);
  const [importSqlFile, setImportSqlFile] = useState<File | null>(null);

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
        setStatusText(data?.message || 'Failed to load site assets');
        setStatusKind('error');
        return;
      }

      setAssets(data.assets || {});
    } catch {
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

  useEffect(() => {
    setPendingPreviewUrls((prev) => {
      const next: Partial<Record<'favicon' | 'logo' | 'ogImage', string>> = { ...prev };

      (['favicon', 'logo', 'ogImage'] as const).forEach((k) => {
        const f = pendingFiles[k];
        const existing = next[k];

        if (!f && existing) {
          URL.revokeObjectURL(existing);
          delete (next as any)[k];
          return;
        }

        if (f) {
          if (existing) URL.revokeObjectURL(existing);
          next[k] = URL.createObjectURL(f);
        }
      });

      return next;
    });

    return () => {
      setPendingPreviewUrls((prev) => {
        Object.values(prev).forEach((u) => {
          if (u) URL.revokeObjectURL(u);
        });
        return {};
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFiles.favicon, pendingFiles.logo, pendingFiles.ogImage]);

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
      setPendingFiles((prev) => {
        const next = { ...prev };
        delete (next as any)[key];
        return next;
      });
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

  const downloadDb = async () => {
    try {
      setStatusText('');
      setStatusKind('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      if (!backupPassword.trim()) {
        setStatusText('Backup password is required.');
        setStatusKind('error');
        return;
      }

      setDbBusy(true);
      const res = await fetch('/api/admin/db-backup', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Backup-Password': backupPassword.trim(),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatusText(data?.message || 'Database export failed');
        setStatusKind('error');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const disposition = res.headers.get('content-disposition') || '';
      const m = disposition.match(/filename="?([^";]+)"?/i);
      const filename = m?.[1] ? String(m[1]) : 'database-backup.sql';

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatusText('Database export started.');
      setStatusKind('success');
    } catch {
      setStatusText('Database export failed.');
      setStatusKind('error');
    } finally {
      setDbBusy(false);
    }
  };

  const importDb = async () => {
    try {
      setStatusText('');
      setStatusKind('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      if (!backupPassword.trim()) {
        setStatusText('Backup password is required.');
        setStatusKind('error');
        return;
      }

      if (!importSqlFile) {
        setStatusText('Please select a .sql file to import.');
        setStatusKind('error');
        return;
      }

      setDbBusy(true);

      const text = await importSqlFile.text();
      const res = await fetch('/api/admin/db-backup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Backup-Password': backupPassword.trim(),
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: text,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setStatusText(data?.message || 'Database import failed');
        setStatusKind('error');
        return;
      }

      setStatusText(data?.message || 'Database import completed');
      setStatusKind('success');
      setImportSqlFile(null);
    } catch {
      setStatusText('Database import failed.');
      setStatusKind('error');
    } finally {
      setDbBusy(false);
    }
  };

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
        <div className="arbix-card rounded-2xl p-4 mb-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold text-heading">Database Backup</div>
              <div className="mt-0.5 text-[11px] text-muted">
                Download a full SQL backup or import a SQL file to restore data.
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-col">
                <label className="text-[10px] text-subtle">Backup password</label>
                <input
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface/40 px-3 py-2 text-[11px] text-fg outline-none"
                  placeholder="Enter backup password"
                  disabled={dbBusy}
                />
              </div>

              <button
                type="button"
                onClick={downloadDb}
                disabled={dbBusy}
                className="rounded-lg bg-theme-primary px-3 py-2 text-[11px] font-medium text-primary-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
              >
                {dbBusy ? 'Working…' : 'Download DB'}
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <div className="md:col-span-2">
              <input
                type="file"
                accept=".sql,text/plain,application/sql"
                onChange={(e) => setImportSqlFile(e.target.files?.[0] || null)}
                disabled={dbBusy}
                className="block w-full text-[11px] text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface/40 file:px-3 file:py-1.5 file:text-[11px] file:text-fg"
                aria-label="Import SQL file"
              />
              {importSqlFile ? (
                <div className="mt-1 text-[10px] text-subtle break-all">
                  Selected: {importSqlFile.name} ({formatBytes(importSqlFile.size)})
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={importDb}
              disabled={dbBusy || !importSqlFile}
              className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-[11px] font-medium text-warning transition hover:border-warning/70 hover:shadow-theme-sm disabled:opacity-60"
            >
              {dbBusy ? 'Working…' : 'Import DB'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {rows.map((r) => {
            const current = (assets as any)?.[r.key] as SiteAsset;
            const isBusy = busyKey === r.key;
            const pending = (pendingFiles as any)?.[r.key] as File | undefined;
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
                      <div className="rounded-lg border border-border bg-black/5 p-2">
                        <img
                          src={current.url}
                          alt={`${r.label} preview`}
                          className={previewBoxClass(r.key)}
                          loading="lazy"
                        />
                      </div>
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
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (!f) return;
                      setPendingFiles((prev) => ({ ...prev, [r.key]: f }));
                    }}
                    disabled={isBusy}
                    className="block w-full text-[11px] text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface/40 file:px-3 file:py-1.5 file:text-[11px] file:text-fg"
                    aria-label={`${r.label} upload`}
                  />

                  <button
                    type="button"
                    onClick={() => upload(r.key, pending || null)}
                    disabled={isBusy || !pending}
                    className="rounded-lg bg-theme-primary px-3 py-2 text-[11px] font-medium text-primary-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-50"
                  >
                    {isBusy ? 'Uploading…' : pending ? 'Save' : 'Select a file first'}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeAsset(r.key)}
                    disabled={isBusy || !current?.url}
                    className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[11px] font-medium text-danger transition hover:border-danger/60 hover:shadow-theme-sm disabled:opacity-50"
                  >
                    {isBusy ? 'Working…' : 'Remove'}
                  </button>
                </div>

                {pending ? (
                  <div className="mt-2 space-y-2">
                    <div className="text-[10px] text-subtle break-all">
                      Selected: {pending.name} ({formatBytes(pending.size)})
                    </div>
                    {pendingPreviewUrls[r.key] ? (
                      <div className="rounded-lg border border-border bg-black/5 p-2">
                        <img
                          src={pendingPreviewUrls[r.key]}
                          alt={`${r.label} selected preview`}
                          className={previewBoxClass(r.key)}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

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
