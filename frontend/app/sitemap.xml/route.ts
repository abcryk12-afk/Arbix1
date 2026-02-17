import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type PublicSeoResponse = {
  success: boolean;
  global?: {
    canonicalBase?: string;
  };
};

type PublicCmsPagesListResponse = {
  success: boolean;
  pages?: Array<{ slug: string; updatedAt?: string | null; publishedAt?: string | null }>;
};

function safeBaseUrl(raw: string | undefined | null) {
  const v = String(raw || '').trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
}

function xmlEscape(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const backendBase = process.env.BACKEND_URL || 'http://localhost:5000';

  const [seo, cms] = await Promise.all([
    fetch(`${backendBase}/api/public/seo-settings`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null) as Promise<PublicSeoResponse | null>,
    fetch(`${backendBase}/api/public/cms-pages`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null) as Promise<PublicCmsPagesListResponse | null>,
  ]);

  const canonical = safeBaseUrl(seo?.success ? seo?.global?.canonicalBase : '');
  const site = canonical?.toString().replace(/\/+$/, '') || '';

  const staticPaths = ['/', '/about', '/contact', '/privacy', '/terms'];

  const cmsPages = (cms?.success && Array.isArray(cms.pages)) ? cms.pages : [];

  const urlEntries: Array<{ loc: string; lastmod?: string }> = [];

  for (const p of staticPaths) {
    if (!site) continue;
    urlEntries.push({ loc: `${site}${p}` });
  }

  for (const p of cmsPages) {
    if (!site) continue;
    if (!p?.slug) continue;
    const loc = `${site}/p/${encodeURIComponent(p.slug)}`;
    const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined;
    urlEntries.push({ loc, lastmod });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urlEntries
      .map((u) => {
        const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : '';
        return `  <url><loc>${xmlEscape(u.loc)}</loc>${lastmod}</url>`;
      })
      .join('\n') +
    `\n</urlset>\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
