import { NextResponse } from 'next/server';
import { getRawTransaction } from '@/lib/blockchain-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');
    const decrypt = searchParams.get('decrypt') === '1';
    
    if (!txid) {
      return NextResponse.json({ error: 'Missing required parameter: txid' }, { status: 400 });
    }
    
    const tx = await getRawTransaction(txid, decrypt);
    return NextResponse.json(tx);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}