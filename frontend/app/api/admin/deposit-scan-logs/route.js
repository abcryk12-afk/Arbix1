import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return NextResponse.json(
    { success: false, message: 'Deposit scan logs are no longer available (deposit detection migrated to Moralis Streams).' },
    { status: 410 },
  );
}
