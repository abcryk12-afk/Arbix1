import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json({ success: false, message: 'Slug is required' }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/api/public/cms-pages/${encodeURIComponent(slug)}`, {
      method: 'GET',
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data || { success: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Public cms-page API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
