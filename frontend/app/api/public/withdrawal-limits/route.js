import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

    const response = await fetch(`${baseUrl}/api/public/withdrawal-limits`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);
    const res = NextResponse.json(data || { success: response.ok }, { status: response.status });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Public withdrawal limits API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
