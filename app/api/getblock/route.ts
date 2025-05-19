import { NextResponse } from 'next/server';
import { getBlockByHash } from '@/lib/blockchain-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');
    
    if (!hash) {
      return NextResponse.json({ error: 'Missing required parameter: hash' }, { status: 400 });
    }
    
    const block = await getBlockByHash(hash);
    return NextResponse.json(block);
  } catch (error) {
    console.error('Error fetching block:', error);
    return NextResponse.json({ error: 'Failed to fetch block' }, { status: 500 });
  }
}