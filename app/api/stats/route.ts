import { NextResponse } from 'next/server';
import { getBlockchainStats } from '@/lib/blockchain-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getBlockchainStats();
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    return NextResponse.json({ error: 'Failed to fetch blockchain stats' }, { status: 500 });
  }
}