import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${baseUrl}/api/public/site-assets`, { cache: 'no-store' });
    const data = await res.json().catch(() => null);

    const url = data?.success && typeof data?.assets?.favicon?.url === 'string' ? data.assets.favicon.url : '';
    if (url) {
      return NextResponse.redirect(new URL(url, 'http://localhost'), 307);
    }
  } catch {
    // ignore
  }

  return new NextResponse(null, { status: 404 });
}
