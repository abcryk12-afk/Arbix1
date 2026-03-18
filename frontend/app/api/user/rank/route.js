import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const normalizeBaseUrl = (raw) => {
  const base = (raw || 'http://localhost:5000').trim();
  return base.replace(/\/+$/, '').replace(/\/api$/, '');
};

export async function GET(request) {
  try {
    const baseUrl = normalizeBaseUrl(process.env.BACKEND_URL);
    const authHeader = request.headers.get('authorization') || '';

    const response = await fetch(`${baseUrl}/api/user/rank`, {
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
    console.error('User rank API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
