import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendBase() {
  const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
}

function getAdminKey() {
  return process.env.ADMIN_API_KEY;
}

export async function GET(request) {
  try {
    const baseUrl = getBackendBase();
    const adminKey = getAdminKey();
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const url = new URL(request.url);
    const qs = url.searchParams.toString();

    const response = await fetch(`${baseUrl}/api/admin/cms-pages${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data || { success: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Admin cms-pages list API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const baseUrl = getBackendBase();
    const adminKey = getAdminKey();
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${baseUrl}/api/admin/cms-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data || { success: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Admin cms-pages create API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
