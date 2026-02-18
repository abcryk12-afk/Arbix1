import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${baseUrl}/api/public/site-assets`, { cache: 'no-store' });
    const data = await res.json().catch(() => null);

    const url = data?.success && typeof data?.assets?.favicon?.url === 'string' ? data.assets.favicon.url : '';
    if (url) {
      const trimmed = String(url).trim();
      if (trimmed.startsWith('/')) {
        return new NextResponse(null, {
          status: 307,
          headers: {
            Location: trimmed,
          },
        });
      }

      const origin = new URL(request.url).origin;
      return NextResponse.redirect(new URL(trimmed, origin), 307);
    }
  } catch {
    // ignore
  }

  return new NextResponse(null, { status: 404 });
}
