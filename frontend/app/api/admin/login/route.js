import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    // For admin login, we'll create a simple token-based system
    // Check if the email is the admin email
    if (email !== 'wanum01234@gmail.com') {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 }
      );
    }

    // Create a simple token (in production, use JWT)
    const token = Buffer.from(`admin-${Date.now()}`).toString('base64');

    // Return success with token and user info
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: 13,
        email: email,
        name: 'Admin'
      }
    });
  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
