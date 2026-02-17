import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const response = await fetch(`${baseUrl}/api/admin/site-assets`, {
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
    console.error('Admin site assets GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const url = new URL(request.url);
    const asset = url.searchParams.get('asset') || '';
    const body = await request.json().catch(() => null);

    const response = await fetch(`${baseUrl}/api/admin/site-assets/${encodeURIComponent(asset)}`, {
      method: 'POST',
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
    console.error('Admin site assets POST API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const url = new URL(request.url);
    const asset = url.searchParams.get('asset') || '';

    const response = await fetch(`${baseUrl}/api/admin/site-assets/${encodeURIComponent(asset)}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin site assets DELETE API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
