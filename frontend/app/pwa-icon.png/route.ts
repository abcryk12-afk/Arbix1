import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${baseUrl}/api/public/site-assets`, { cache: 'no-store' });
    const data = await res.json().catch(() => null);

    const logoUrl = data?.success && typeof data?.assets?.logo?.url === 'string' ? String(data.assets.logo.url).trim() : '';

    if (logoUrl) {
      if (logoUrl.startsWith('/')) {
        return new NextResponse(null, {
          status: 307,
          headers: {
            Location: logoUrl,
          },
        });
      }

      const origin = new URL(request.url).origin;
      return NextResponse.redirect(new URL(logoUrl, origin), 307);
    }
  } catch {
    // ignore
  }

  return NextResponse.redirect(new URL('/icon.svg', new URL(request.url).origin), 307);
}
