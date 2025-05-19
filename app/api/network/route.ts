import { NextResponse } from 'next/server';
import { getNetworkInfo } from '@/lib/blockchain-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const networkInfo = await getNetworkInfo();
    return NextResponse.json(networkInfo, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching network info:', error);
    return NextResponse.json({ error: 'Failed to fetch network info' }, { status: 500 });
  }
}