import { NextResponse } from 'next/server';
import { getNetworkInfo } from '@/lib/blockchain-api';

export async function GET() {
  try {
    const info = await getNetworkInfo();
    return NextResponse.json(info.connections);
  } catch (error) {
    console.error('Error fetching connection count:', error);
    return NextResponse.json({ error: 'Failed to fetch connection count' }, { status: 500 });
  }
}