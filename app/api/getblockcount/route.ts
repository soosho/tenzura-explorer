import { NextResponse } from 'next/server';
import { getBlockchainStats } from '@/lib/blockchain-api';

export async function GET() {
  try {
    const stats = await getBlockchainStats();
    return NextResponse.json(stats.blocks);
  } catch (error) {
    console.error('Error fetching block count:', error);
    return NextResponse.json({ error: 'Failed to fetch block count' }, { status: 500 });
  }
}