import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const normalizeBaseUrl = (raw) => {
  const base = (raw || 'http://localhost:5000').trim();
  return base.replace(/\/+$/, '').replace(/\/api$/, '');
};

export async function GET() {
  try {
    const baseUrl = normalizeBaseUrl(process.env.BACKEND_URL);

    const response = await fetch(`${baseUrl}/api/public/investment-packages`, {
      method: 'GET',
    });

    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Public investment packages API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
