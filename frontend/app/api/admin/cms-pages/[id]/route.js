import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendBase() {
  const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
}

function getAdminKey() {
  return process.env.ADMIN_API_KEY;
}

export async function GET(request, { params }) {
  try {
    const baseUrl = getBackendBase();
    const adminKey = getAdminKey();
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Page id is required' }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/api/admin/cms-pages/${id}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data || { success: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Admin cms-pages details API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const baseUrl = getBackendBase();
    const adminKey = getAdminKey();
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Page id is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${baseUrl}/api/admin/cms-pages/${id}`, {
      method: 'PUT',
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
    console.error('Admin cms-pages update API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const baseUrl = getBackendBase();
    const adminKey = getAdminKey();
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json({ success: false, message: 'Admin API key is not configured' }, { status: 500 });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Page id is required' }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/api/admin/cms-pages/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data || { success: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Admin cms-pages delete API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
