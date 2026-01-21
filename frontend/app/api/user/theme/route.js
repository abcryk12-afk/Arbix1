import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendBaseUrl() {
  const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
}

export async function GET(request) {
  try {
    const baseUrl = getBackendBaseUrl();
    const authHeader = request.headers.get('authorization') || '';

    const response = await fetch(`${baseUrl}/api/user/theme`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: authHeader,
      },
    });

    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Vary', 'Authorization');
    return res;
  } catch (error) {
    console.error('User theme API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const baseUrl = getBackendBaseUrl();
    const authHeader = request.headers.get('authorization') || '';
    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${baseUrl}/api/user/theme`, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Vary', 'Authorization');
    return res;
  } catch (error) {
    console.error('User theme update API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
