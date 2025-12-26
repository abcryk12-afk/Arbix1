import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'User id is required' }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/api/admin/users/${id}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin user details API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'User id is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    const headers = {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'X-Admin-Key': adminKey,
    };

    let response = await fetch(`${baseUrl}/api/admin/users/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body || {}),
    });

    let data = await response.json().catch(() => null);

    if (response.status === 404 && data?.message === 'Route not found') {
      response = await fetch(`${baseUrl}/api/admin/users/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body || {}),
      });
      data = await response.json().catch(() => null);
    }

    if (response.status === 404 && data?.message === 'Route not found') {
      response = await fetch(`${baseUrl}/api/admin/users/${id}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body || {}),
      });
      data = await response.json().catch(() => null);
    }

    return NextResponse.json(data || { success: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Admin update user status API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'User id is required' }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
    });

    let data = await response.json().catch(() => null);

    if (response.status === 404 && data?.message === 'Route not found') {
      const fallback = await fetch(`${baseUrl}/api/admin/users/${id}/delete`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'X-Admin-Key': adminKey,
        },
      });

      const fallbackData = await fallback.json().catch(() => null);
      return NextResponse.json(
        fallbackData || { success: fallback.ok },
        { status: fallback.status },
      );
    }

    return NextResponse.json(data || { success: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Admin delete user API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
