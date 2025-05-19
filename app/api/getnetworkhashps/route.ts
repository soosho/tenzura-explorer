import { NextResponse } from 'next/server';
import { getBlockchainStats } from '@/lib/blockchain-api';

export async function GET() {
  try {
    const stats = await getBlockchainStats();
    return NextResponse.json(stats.networkhashps);
  } catch (error) {
    console.error('Error fetching network hashrate:', error);
    return NextResponse.json({ error: 'Failed to fetch network hashrate' }, { status: 500 });
  }
}