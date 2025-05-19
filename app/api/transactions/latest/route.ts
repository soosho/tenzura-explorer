import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const txs = await db.collection('txs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
      
    return NextResponse.json(txs, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching latest transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch latest transactions' }, { status: 500 });
  }
}