import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const body = await request.json();
    const { email, otp } = body;

    const response = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Verify email API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
