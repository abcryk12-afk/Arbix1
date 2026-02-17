import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    const response = await fetch(`${baseUrl}/api/public/site-assets`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Public site-assets API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
