import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type PublicSeoResponse = {
  success: boolean;
  global?: {
    canonicalBase?: string;
    robotsIndex?: boolean;
  };
};

function safeOrigin(raw: string | undefined | null) {
  const v = String(raw || '').trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.origin;
  } catch {
    return null;
  }
}

export async function GET() {
  const backendBase = process.env.BACKEND_URL || 'http://localhost:5000';

  const seo = await fetch(`${backendBase}/api/public/seo-settings`, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => null) as PublicSeoResponse | null;

  const robotsIndex = seo?.success ? (seo?.global?.robotsIndex !== false) : true;
  const origin = safeOrigin(seo?.success ? seo?.global?.canonicalBase : '') || '';

  const lines: string[] = [];
  lines.push('User-agent: *');
  lines.push(robotsIndex ? 'Allow: /' : 'Disallow: /');
  lines.push('');

  if (origin) {
    lines.push(`Sitemap: ${origin.replace(/\/+$/, '')}/sitemap.xml`);
  }

  const body = lines.join('\n') + '\n';

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
