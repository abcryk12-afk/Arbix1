import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    
    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // For our simplified system, we'll just check if the token exists and is valid
    // In a real system, you'd verify the JWT token
    if (!token || !token.startsWith('YWRtaW4t')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 }
      );
    }

    // Return success for valid admin token
    return NextResponse.json({
      success: true,
      message: 'Admin authorized'
    });
  } catch (error) {
    console.error('Admin check API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
