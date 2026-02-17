'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type CmsPageListItem = {
  id: number;
  title: string;
  slug: string | null;
  isPublished: boolean;
  updatedAt?: string | null;
};

export default function AdminCmsPagesListPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [pages, setPages] = useState<CmsPageListItem[]>([]);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('adminToken') || '';
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const res = await fetch(`/api/admin/cms-pages${qs}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to load pages');
        setPages([]);
        return;
      }
      setPages(Array.isArray(data.pages) ? data.pages : []);
    } catch {
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createQuick = async () => {
    try {
      setSaving(true);
      setError('');

      const title = prompt('Page title');
      if (!title) return;
      const slug = prompt('Slug (no leading /). Example: about');
      if (!slug) return;

      const res = await fetch('/api/admin/cms-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          slug,
          isPublished: false,
          contentHtml: '',
          seo: {},
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to create page');
        return;
      }

      await load();
    } catch {
      setError('Failed to create page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-heading">CMS Pages</h1>
          <p className="mt-1 text-[12px] text-muted">Pages are served under /p/[slug]. Old slugs permanently redirect.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={createQuick}
            disabled={saving || !token}
            className="rounded-lg bg-info px-3 py-2 text-[12px] font-medium text-info-fg shadow-theme-sm disabled:opacity-60"
          >
            New Page
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title"
            className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-fg"
          />
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-[12px] text-fg disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Search'}
          </button>
        </div>
        {error ? <div className="mt-2 text-[12px] text-danger">{error}</div> : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-12 gap-2 border-b border-border px-4 py-2 text-[11px] text-muted">
          <div className="col-span-5">Title</div>
          <div className="col-span-3">Slug</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Actions</div>
        </div>

        {(pages || []).map((p) => (
          <div key={p.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-[12px]">
            <div className="col-span-5">
              <div className="font-medium text-heading">{p.title}</div>
              <div className="text-[11px] text-muted">Updated: {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '-'}</div>
            </div>
            <div className="col-span-3 font-mono text-[11px] text-fg/90">{p.slug || '-'}</div>
            <div className="col-span-2">
              <span className={
                "inline-flex rounded-md border px-2 py-0.5 text-[11px] " +
                (p.isPublished ? "border-success/40 bg-success/10 text-success" : "border-border bg-surface text-muted")
              }>
                {p.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Link
                href={`/admin/cms-pages/${p.id}`}
                className="rounded-md border border-border bg-surface/50 px-2 py-1 text-[11px] text-fg"
              >
                Edit
              </Link>
              {p.slug ? (
                <a
                  href={`/p/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border bg-surface/50 px-2 py-1 text-[11px] text-fg"
                >
                  View
                </a>
              ) : null}
            </div>
          </div>
        ))}

        {!loading && (!pages || pages.length === 0) ? (
          <div className="px-4 py-8 text-center text-[12px] text-muted">No pages yet.</div>
        ) : null}
      </div>
    </div>
  );
}
