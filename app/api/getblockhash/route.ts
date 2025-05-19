import { NextResponse } from 'next/server';
import { getBlockhashByHeight } from '@/lib/blockchain-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const index = searchParams.get('index');
    
    if (!index) {
      return NextResponse.json({ error: 'Missing required parameter: index' }, { status: 400 });
    }
    
    const blockHeight = parseInt(index, 10);
    if (isNaN(blockHeight)) {
      return NextResponse.json({ error: 'Invalid block height' }, { status: 400 });
    }
    
    const hash = await getBlockhashByHeight(blockHeight);
    return NextResponse.json(hash);
  } catch (error) {
    console.error('Error fetching block hash:', error);
    return NextResponse.json({ error: 'Failed to fetch block hash' }, { status: 500 });
  }
}