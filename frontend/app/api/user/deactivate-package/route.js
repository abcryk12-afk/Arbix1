import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization') || '';
    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${baseUrl}/api/user/deactivate-package`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Deactivate package API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
