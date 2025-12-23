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
    const targetUrl = `${baseUrl}/api/admin/deposit-requests${qs ? `?${qs}` : ''}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin list deposit requests API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const body = await request.json();

    let response = await fetch(`${baseUrl}/api/admin/deposit-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      response = await fetch(`${baseUrl}/api/admin/deposit-requests/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin update deposit request API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
