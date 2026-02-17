'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type GlobalSeo = {
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultKeywords: string;
  openGraphTitle: string;
  openGraphDescription: string;
  ogImageUrl: string;
  twitterCardType: string;
  canonicalBase: string;
  robotsIndex: boolean;
  googleVerification: string;
  updatedAt?: string;
};

type RouteOverride = {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  jsonLd: string;
  index: boolean;
  updatedAt?: string;
};

type AdminSeoResponse = {
  success: boolean;
  global?: GlobalSeo;
  routes?: Record<string, RouteOverride>;
  message?: string;
};

const DEFAULT_GLOBAL: GlobalSeo = {
  defaultMetaTitle: '',
  defaultMetaDescription: '',
  defaultKeywords: '',
  openGraphTitle: '',
  openGraphDescription: '',
  ogImageUrl: '',
  twitterCardType: 'summary_large_image',
  canonicalBase: '',
  robotsIndex: true,
  googleVerification: '',
};

function normalizePath(v: string) {
  const raw = String(v || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('/')) return '';
  if (raw.includes('?') || raw.includes('#') || raw.includes('..')) return '';
  if (raw.length > 200) return '';
  return raw === '/' ? '/' : raw.replace(/\/+$/, '');
}

export default function AdminSeoSettingsPage() {
  const router = useRouter();

  const [global, setGlobal] = useState<GlobalSeo>(DEFAULT_GLOBAL);
  const [routes, setRoutes] = useState<Record<string, RouteOverride>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [statusText, setStatusText] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error' | ''>('');

  const [newPath, setNewPath] = useState('');
  const [selectedPath, setSelectedPath] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setStatusText('');
      setStatusKind('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/seo-settings', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: AdminSeoResponse = await res.json().catch(() => ({ success: false } as any));
      if (!res.ok || !data?.success) {
        setStatusText(data?.message || 'Failed to load SEO settings');
        setStatusKind('error');
        return;
      }

      setGlobal({ ...DEFAULT_GLOBAL, ...(data.global || {}) });
      setRoutes(data.routes || {});

      const keys = Object.keys(data.routes || {}).sort();
      if (!selectedPath && keys.length) setSelectedPath(keys[0]);
    } catch {
      setStatusText('Failed to load SEO settings');
      setStatusKind('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveGlobal = async () => {
    try {
      setSaving(true);
      setStatusText('');
      setStatusKind('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/seo-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ global }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setStatusText(data?.message || 'Failed to save');
        setStatusKind('error');
        return;
      }

      setStatusText('SEO settings saved.');
      setStatusKind('success');
      await load();
    } catch {
      setStatusText('Failed to save');
      setStatusKind('error');
    } finally {
      setSaving(false);
    }
  };

  const routeKeys = useMemo(() => Object.keys(routes || {}).sort(), [routes]);

  const currentOverride = selectedPath && routes[selectedPath] ? routes[selectedPath] : null;

  const upsertRoute = async (path: string, override: RouteOverride) => {
    try {
      setSaving(true);
      setStatusText('');
      setStatusKind('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/route-seo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ path, override }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setStatusText(data?.message || 'Failed to save route override');
        setStatusKind('error');
        return;
      }

      setStatusText('Route SEO saved.');
      setStatusKind('success');
      await load();
      setSelectedPath(path);
    } catch {
      setStatusText('Failed to save route override');
      setStatusKind('error');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoute = async (path: string) => {
    try {
      setSaving(true);
      setStatusText('');
      setStatusKind('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`/api/admin/route-seo?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setStatusText(data?.message || 'Failed to delete route override');
        setStatusKind('error');
        return;
      }

      setStatusText('Route override removed.');
      setStatusKind('success');
      await load();
      setSelectedPath('');
    } catch {
      setStatusText('Failed to delete route override');
      setStatusKind('error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRoute = async () => {
    const path = normalizePath(newPath);
    if (!path) {
      setStatusText('Invalid path. Must start with / and not contain ? or #');
      setStatusKind('error');
      return;
    }

    const override: RouteOverride = {
      title: '',
      description: '',
      keywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImageUrl: '',
      jsonLd: '',
      index: true,
    };

    await upsertRoute(path, override);
    setNewPath('');
  };

  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">SEO Settings</h1>
              <p className="mt-1 text-[11px] text-muted md:text-xs">Global defaults + per-route overrides.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="rounded-lg border border-border px-3 py-1 text-[11px] text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
              >
                {loading ? 'Loading…' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={saveGlobal}
                disabled={saving}
                className="rounded-lg bg-info px-3 py-1.5 text-[11px] font-medium text-info-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Global'}
              </button>
            </div>
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
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="arbix-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-heading">Global Defaults</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] text-muted">Default Meta Title</label>
                <input
                  value={global.defaultMetaTitle}
                  onChange={(e) => setGlobal((p) => ({ ...p, defaultMetaTitle: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted">Canonical URL Base</label>
                <input
                  value={global.canonicalBase}
                  onChange={(e) => setGlobal((p) => ({ ...p, canonicalBase: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                  placeholder="https://example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] text-muted">Default Meta Description</label>
                <textarea
                  value={global.defaultMetaDescription}
                  onChange={(e) => setGlobal((p) => ({ ...p, defaultMetaDescription: e.target.value }))}
                  className="mt-1 min-h-[80px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] text-muted">Default Keywords</label>
                <input
                  value={global.defaultKeywords}
                  onChange={(e) => setGlobal((p) => ({ ...p, defaultKeywords: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                  placeholder="keyword1, keyword2"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted">Open Graph Title</label>
                <input
                  value={global.openGraphTitle}
                  onChange={(e) => setGlobal((p) => ({ ...p, openGraphTitle: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted">Twitter Card Type</label>
                <select
                  value={global.twitterCardType}
                  onChange={(e) => setGlobal((p) => ({ ...p, twitterCardType: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                >
                  <option value="summary">summary</option>
                  <option value="summary_large_image">summary_large_image</option>
                  <option value="app">app</option>
                  <option value="player">player</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-muted">Open Graph Description</label>
                <textarea
                  value={global.openGraphDescription}
                  onChange={(e) => setGlobal((p) => ({ ...p, openGraphDescription: e.target.value }))}
                  className="mt-1 min-h-[70px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-muted">Default OG Image URL</label>
                <input
                  value={global.ogImageUrl}
                  onChange={(e) => setGlobal((p) => ({ ...p, ogImageUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                  placeholder="/uploads/site/og-image-xxxx.jpg"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted">Robots Index</label>
                <select
                  value={global.robotsIndex ? 'index' : 'noindex'}
                  onChange={(e) => setGlobal((p) => ({ ...p, robotsIndex: e.target.value === 'index' }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                >
                  <option value="index">index</option>
                  <option value="noindex">noindex</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-muted">Google Verification Code</label>
                <input
                  value={global.googleVerification}
                  onChange={(e) => setGlobal((p) => ({ ...p, googleVerification: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                  placeholder="google-site-verification=..."
                />
              </div>
            </div>
          </div>

          <aside className="arbix-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-heading">Route Overrides</h2>
            <div className="mt-3">
              <label className="block text-[11px] text-muted">Add Path</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                  placeholder="/about"
                />
                <button
                  type="button"
                  onClick={handleCreateRoute}
                  disabled={saving}
                  className="rounded-lg border border-border px-3 py-2 text-[11px] text-fg hover:opacity-95 disabled:opacity-60"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] text-muted">Select Path</label>
              <select
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
              >
                <option value="">(none)</option>
                {routeKeys.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {currentOverride && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] text-muted">Meta Title</label>
                  <input
                    value={currentOverride.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRoutes((prev) => ({ ...prev, [selectedPath]: { ...prev[selectedPath], title: v } }));
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted">Meta Description</label>
                  <textarea
                    value={currentOverride.description}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRoutes((prev) => ({ ...prev, [selectedPath]: { ...prev[selectedPath], description: v } }));
                    }}
                    className="mt-1 min-h-[70px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted">Canonical URL</label>
                  <input
                    value={currentOverride.canonicalUrl}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRoutes((prev) => ({ ...prev, [selectedPath]: { ...prev[selectedPath], canonicalUrl: v } }));
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-muted">JSON-LD</label>
                  <textarea
                    value={currentOverride.jsonLd}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRoutes((prev) => ({ ...prev, [selectedPath]: { ...prev[selectedPath], jsonLd: v } }));
                    }}
                    className="mt-1 min-h-[110px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-mono text-fg"
                    placeholder={`{\n  "@context": "https://schema.org",\n  ...\n}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => upsertRoute(selectedPath, routes[selectedPath])}
                    disabled={saving}
                    className="rounded-lg bg-info px-3 py-2 text-[11px] font-medium text-info-fg shadow-theme-sm disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save Route'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRoute(selectedPath)}
                    disabled={saving}
                    className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[11px] font-medium text-danger disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {!currentOverride && (
              <div className="mt-4 text-[11px] text-muted">No override selected.</div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
