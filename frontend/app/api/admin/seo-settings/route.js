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

    const response = await fetch(`${baseUrl}/api/admin/seo-settings`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin seo-settings GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => null);

    const response = await fetch(`${baseUrl}/api/admin/seo-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin seo-settings PUT API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
