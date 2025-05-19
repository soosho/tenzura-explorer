import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const blocks = await db.collection('blocks')
      .find({})
      .sort({ height: -1 })
      .limit(10)
      .toArray();
      
    return NextResponse.json(blocks, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching latest blocks:', error);
    return NextResponse.json({ error: 'Failed to fetch latest blocks' }, { status: 500 });
  }
}