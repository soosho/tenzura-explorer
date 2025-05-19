import { NextResponse } from 'next/server';
import { getBlockchainStats } from '@/lib/blockchain-api';

export async function GET() {
  try {
    const stats = await getBlockchainStats();
    return NextResponse.json(stats.difficulty);
  } catch (error) {
    console.error('Error fetching difficulty:', error);
    return NextResponse.json({ error: 'Failed to fetch difficulty' }, { status: 500 });
  }
}