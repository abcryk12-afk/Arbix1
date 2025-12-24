import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const url = new URL(request.url);
    const qs = url.searchParams.toString();

    const response = await fetch(`${baseUrl}/api/admin/deposit-scan-logs${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin deposit scan logs API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
