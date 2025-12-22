import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, secretCode } = body;

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    // Forward to backend admin login route with email + secret code
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, secretCode }),
    });

    const data = await response.json();

    // Return the same response from backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
