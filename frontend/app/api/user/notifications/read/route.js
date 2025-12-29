import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function forward(request, method) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const authHeader = request.headers.get('authorization') || '';

    const body = await request.json();

    const response = await fetch(`${baseUrl}/api/user/notifications/read`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('User notifications read API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  return forward(request, 'POST');
}

export async function PUT(request) {
  return forward(request, 'PUT');
}
