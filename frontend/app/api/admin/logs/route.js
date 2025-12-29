import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const normalizeBaseUrl = (raw) => {
  const base = (raw || 'http://localhost:5000').trim();
  return base.replace(/\/+$/, '').replace(/\/api$/, '');
};

export async function GET(request) {
  try {
    const baseUrl = normalizeBaseUrl(process.env.BACKEND_URL);
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const url = new URL(request.url);
    const qs = url.searchParams.toString();
    const targetUrl = `${baseUrl}/api/admin/logs${qs ? `?${qs}` : ''}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    const data = await response.json().catch(() => null);
    const res = NextResponse.json(data || { success: response.ok }, { status: response.status });
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Vary', 'Authorization');
    return res;
  } catch (error) {
    console.error('Admin logs GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
