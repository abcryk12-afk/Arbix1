import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization') || '';

    const response = await fetch(`${baseUrl}/api/user/daily-checkin/claim`, {
      method: 'POST',
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
    console.error('User daily check-in claim API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
