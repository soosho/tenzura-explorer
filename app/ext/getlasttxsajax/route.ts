import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get min value from query parameter
    const url = new URL(request.url);
    const minParam = url.searchParams.get('min');
    
    if (!minParam) {
      return NextResponse.json({ error: 'Minimum value is required' }, { status: 400 });
    }
    
    const minValue = parseInt(minParam, 10);
    
    if (isNaN(minValue)) {
      return NextResponse.json({ error: 'Invalid minimum value' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get transactions with amount greater than min
    const txs = await db.collection('txs')
      .find({ total: { $gt: minValue } })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    // Convert to satoshis as specified in the docs
    const satoshiTxs = txs.map(tx => ({
      txid: tx.txid,
      timestamp: tx.timestamp,
      amount: Math.round(tx.total * 100000000), // Convert to satoshis
      blockhash: tx.blockhash,
      blockindex: tx.blockindex
    }));
    
    return NextResponse.json(satoshiTxs);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}