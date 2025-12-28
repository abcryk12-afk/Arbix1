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
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const response = await fetch(`${baseUrl}/api/admin/auto-withdraw`, {
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
    console.error('Admin auto withdraw GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const baseUrl = normalizeBaseUrl(process.env.BACKEND_URL);
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${baseUrl}/api/admin/auto-withdraw`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json().catch(() => null);
    const res = NextResponse.json(data || { success: response.ok }, { status: response.status });
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Vary', 'Authorization');
    return res;
  } catch (error) {
    console.error('Admin auto withdraw PUT API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
