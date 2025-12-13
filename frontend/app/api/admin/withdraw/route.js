import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('authorization') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${baseUrl}/api/admin/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin withdraw API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
