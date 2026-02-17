import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBaseUrl() {
  const rawBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
}

function getAdminKey() {
  return process.env.ADMIN_API_KEY;
}

export async function GET(request) {
  try {
    const baseUrl = getBaseUrl();
    const adminKey = getAdminKey();
    const authHeader = request.headers.get('authorization') || '';
    const backupPassword = request.headers.get('x-backup-password') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const response = await fetch(`${baseUrl}/api/admin/db-backup/export`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
        'X-Backup-Password': backupPassword,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return NextResponse.json(data || { success: false, message: 'Export failed' }, { status: response.status });
    }

    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    const disposition = response.headers.get('content-disposition');
    if (contentType) headers.set('Content-Type', contentType);
    if (disposition) headers.set('Content-Disposition', disposition);

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Admin db backup export API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const baseUrl = getBaseUrl();
    const adminKey = getAdminKey();
    const authHeader = request.headers.get('authorization') || '';
    const backupPassword = request.headers.get('x-backup-password') || '';

    if (!adminKey) {
      return NextResponse.json(
        { success: false, message: 'Admin API key is not configured' },
        { status: 500 },
      );
    }

    const bodyText = await request.text();

    const response = await fetch(`${baseUrl}/api/admin/db-backup/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        Authorization: authHeader,
        'X-Admin-Key': adminKey,
        'X-Backup-Password': backupPassword,
      },
      body: bodyText,
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin db backup import API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
