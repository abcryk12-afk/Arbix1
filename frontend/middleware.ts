import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/p/:slug*'],
};

type PublicCmsPageResponse = {
  success: boolean;
  redirect?: {
    to: string;
    permanent: boolean;
  } | null;
};

function getBackendBase() {
  const raw = process.env.BACKEND_URL || 'http://localhost:5000';
  return raw.replace(/\/+$/, '').replace(/\/api$/, '');
}

export async function middleware(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const pathname = url.pathname || '';

    if (!pathname.startsWith('/p/')) {
      return NextResponse.next();
    }

    const slug = pathname.slice(3);
    if (!slug) {
      return NextResponse.next();
    }

    const baseUrl = getBackendBase();

    const res = await fetch(`${baseUrl}/api/public/cms-pages/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = (await res.json().catch(() => null)) as PublicCmsPageResponse | null;

    if (data?.success && data.redirect?.to) {
      const target = new URL(data.redirect.to, url.origin);
      return NextResponse.redirect(target, 301);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}
