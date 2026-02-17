import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = new URL(request.url);
    const path = url.searchParams.get('path') || '';

    const qs = new URLSearchParams();
    qs.set('path', path);

    const response = await fetch(`${baseUrl}/api/public/route-seo?${qs.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Public route-seo API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
