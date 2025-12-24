import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function proxyJson({ request, method, path, body }) {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const authHeader = request.headers.get('authorization') || '';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      Authorization: authHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return { response, data };
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const qs = url.searchParams.toString();
    const suffix = qs ? `?${qs}` : '';

    const primary = await proxyJson({ request, method: 'GET', path: `/api/user/deposit-requests${suffix}` });
    if (primary.response.status === 404 && primary?.data?.message === 'Route not found') {
      const fallback = await proxyJson({ request, method: 'GET', path: `/api/user/deposit_requests${suffix}` });
      return NextResponse.json(fallback.data, { status: fallback.response.status });
    }

    return NextResponse.json(primary.data, { status: primary.response.status });
  } catch (error) {
    console.error('User deposit requests API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const primary = await proxyJson({ request, method: 'POST', path: '/api/user/deposit-requests', body });
    if (primary.response.status === 404 && primary?.data?.message === 'Route not found') {
      const fallback = await proxyJson({ request, method: 'POST', path: '/api/user/deposit_requests', body });
      return NextResponse.json(fallback.data, { status: fallback.response.status });
    }

    return NextResponse.json(primary.data, { status: primary.response.status });
  } catch (error) {
    console.error('User submit deposit request API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
