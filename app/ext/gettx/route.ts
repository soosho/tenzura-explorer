import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get tx hash from query parameter
    const url = new URL(request.url);
    const txHash = url.searchParams.get('txid');
    
    if (!txHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    const tx = await db.collection('txs').findOne({ txid: txHash });
    
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    return NextResponse.json(tx);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}