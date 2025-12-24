import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const authHeader = request.headers.get('authorization') || '';

    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');

    const response = await fetch(`${baseUrl}/api/user/deposit-scan-logs${limit ? `?limit=${encodeURIComponent(limit)}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Deposit scan logs API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
