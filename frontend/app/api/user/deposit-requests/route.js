import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const authHeader = request.headers.get('authorization') || '';

    const url = new URL(request.url);
    const qs = url.searchParams.toString();
    const targetUrl = `${baseUrl}/api/user/deposit-requests${qs ? `?${qs}` : ''}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('User deposit requests API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const authHeader = request.headers.get('authorization') || '';

    const body = await request.json();

    const response = await fetch(`${baseUrl}/api/user/deposit-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('User submit deposit request API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
