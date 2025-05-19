import { NextResponse } from 'next/server';
import { getBlockchainStats } from '@/lib/blockchain-api';

export async function GET() {
  try {
    const stats = await getBlockchainStats();
    return NextResponse.json(stats.moneysupply);
  } catch (error) {
    console.error('Error fetching money supply:', error);
    return NextResponse.json({ error: 'Failed to fetch money supply' }, { status: 500 });
  }
}