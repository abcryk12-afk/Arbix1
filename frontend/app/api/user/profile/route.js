import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const authHeader = request.headers.get('authorization') || '';

    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${baseUrl}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
