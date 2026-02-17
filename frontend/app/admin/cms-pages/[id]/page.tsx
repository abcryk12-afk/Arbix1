'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type CmsPageSeo = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterCardType?: string;
  robotsIndex?: boolean;
  jsonLd?: string;
};

type CmsPageAdminDto = {
  id: number;
  title: string;
  slug: string | null;
  isPublished: boolean;
  contentHtml: string;
  seo: CmsPageSeo;
};

type SlugHistoryItem = {
  slug: string;
  isCurrent: boolean;
  createdAt?: string | null;
};

export default function AdminCmsPageEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params?.id;

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('adminToken') || '';
  }, []);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState<CmsPageAdminDto | null>(null);
  const [slugHistory, setSlugHistory] = useState<SlugHistoryItem[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/admin/cms-pages/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to load page');
        return;
      }
      setPage(data.page);
      setSlugHistory(Array.isArray(data.slugHistory) ? data.slugHistory : []);
    } catch {
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateField = (key: keyof CmsPageAdminDto, value: any) => {
    setPage((prev) => (prev ? ({ ...prev, [key]: value } as CmsPageAdminDto) : prev));
  };

  const updateSeo = (key: keyof CmsPageSeo, value: any) => {
    setPage((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        seo: {
          ...(prev.seo || {}),
          [key]: value,
        },
      };
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      setError('');

      const res = await fetch(`/api/admin/cms-pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(page || {}),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to save');
        return;
      }

      await load();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm('Delete this page?')) return;

    try {
      setSaving(true);
      setError('');

      const res = await fetch(`/api/admin/cms-pages/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to delete');
        return;
      }

      router.push('/admin/cms-pages');
    } catch {
      setError('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !page) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="text-[12px] text-muted">Loading…</div>
        {error ? <div className="mt-2 text-[12px] text-danger">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-heading">Edit Page</h1>
          <div className="mt-1 text-[12px] text-muted">ID: {page.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/cms-pages"
            className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-[12px] text-fg"
          >
            Back
          </Link>
          {page.slug ? (
            <a
              href={`/p/${page.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-[12px] text-fg"
            >
              View
            </a>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-info px-3 py-2 text-[12px] font-medium text-info-fg shadow-theme-sm disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={del}
            disabled={saving}
            className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] font-medium text-danger disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[12px] font-semibold text-heading">Content</div>

          <label className="mt-3 block text-[11px] text-muted">Title</label>
          <input
            value={page.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px]"
          />

          <label className="mt-3 block text-[11px] text-muted">Slug</label>
          <input
            value={page.slug || ''}
            onChange={(e) => updateField('slug', e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[12px]"
          />
          <div className="mt-1 text-[11px] text-muted">Changing slug keeps history and creates an automatic 301 redirect.</div>

          <label className="mt-3 block text-[11px] text-muted">Published</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!page.isPublished}
              onChange={(e) => updateField('isPublished', e.target.checked)}
            />
            <span className="text-[12px] text-fg">Visible on /p/[slug]</span>
          </div>

          <label className="mt-3 block text-[11px] text-muted">HTML Content</label>
          <textarea
            value={page.contentHtml || ''}
            onChange={(e) => updateField('contentHtml', e.target.value)}
            className="mt-1 min-h-[260px] w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[12px]"
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[12px] font-semibold text-heading">SEO</div>

          <label className="mt-3 block text-[11px] text-muted">Meta Title</label>
          <input
            value={page.seo?.metaTitle || ''}
            onChange={(e) => updateSeo('metaTitle', e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px]"
          />

          <label className="mt-3 block text-[11px] text-muted">Meta Description</label>
          <textarea
            value={page.seo?.metaDescription || ''}
            onChange={(e) => updateSeo('metaDescription', e.target.value)}
            className="mt-1 min-h-[90px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px]"
          />

          <label className="mt-3 block text-[11px] text-muted">Meta Keywords (comma separated)</label>
          <input
            value={page.seo?.metaKeywords || ''}
            onChange={(e) => updateSeo('metaKeywords', e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px]"
          />

          <label className="mt-3 block text-[11px] text-muted">Canonical URL</label>
          <input
            value={page.seo?.canonicalUrl || ''}
            onChange={(e) => updateSeo('canonicalUrl', e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[12px]"
          />

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-[11px] text-muted">OG Title</label>
              <input
                value={page.seo?.ogTitle || ''}
                onChange={(e) => updateSeo('ogTitle', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted">Twitter Card</label>
              <select
                value={page.seo?.twitterCardType || ''}
                onChange={(e) => updateSeo('twitterCardType', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px]"
              >
                <option value="">(inherit global)</option>
                <option value="summary">summary</option>
                <option value="summary_large_image">summary_large_image</option>
              </select>
            </div>
          </div>

          <label className="mt-3 block text-[11px] text-muted">OG Description</label>
          <textarea
            value={page.seo?.ogDescription || ''}
            onChange={(e) => updateSeo('ogDescription', e.target.value)}
            className="mt-1 min-h-[90px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px]"
          />

          <label className="mt-3 block text-[11px] text-muted">OG Image URL</label>
          <input
            value={page.seo?.ogImageUrl || ''}
            onChange={(e) => updateSeo('ogImageUrl', e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[12px]"
          />

          <label className="mt-3 block text-[11px] text-muted">Robots Index</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={page.seo?.robotsIndex !== false}
              onChange={(e) => updateSeo('robotsIndex', e.target.checked)}
            />
            <span className="text-[12px] text-fg">Allow indexing</span>
          </div>

          <label className="mt-3 block text-[11px] text-muted">JSON-LD</label>
          <textarea
            value={page.seo?.jsonLd || ''}
            onChange={(e) => updateSeo('jsonLd', e.target.value)}
            className="mt-1 min-h-[140px] w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[12px]"
            placeholder={`{\n  "@context": "https://schema.org",\n  ...\n}`}
          />

          <div className="mt-4 rounded-lg border border-border bg-surface/50 p-3">
            <div className="text-[12px] font-semibold text-heading">Slug history</div>
            <div className="mt-2 space-y-1 text-[11px] text-muted">
              {(slugHistory || []).map((s) => (
                <div key={s.slug} className="flex items-center justify-between gap-2">
                  <span className="font-mono">{s.slug}</span>
                  <span>{s.isCurrent ? 'current' : 'redirects'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
