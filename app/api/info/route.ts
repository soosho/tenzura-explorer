import { NextResponse } from 'next/server';
import { getInfo, getNetworkInfo } from '@/lib/blockchain';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    // Get blockchain data from RPC
    const [blockchainInfo, networkInfo] = await Promise.all([
      getInfo(),
      getNetworkInfo()
    ]);
    
    // Get stats from database
    const client = await clientPromise;
    const db = client.db();
    const stats = await db.collection('stats').findOne({ 
      coin: process.env.NEXT_PUBLIC_COIN_SYMBOL 
    });

    return NextResponse.json({
      coin: process.env.NEXT_PUBLIC_COIN_NAME,
      symbol: process.env.NEXT_PUBLIC_COIN_SYMBOL,
      blocks: blockchainInfo.blocks,
      difficulty: blockchainInfo.difficulty,
      connections: networkInfo.connections,
      supply: stats?.supply || 0,
      lastPrice: stats?.last_price || 0
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blockchain info' },
      { status: 500 }
    );
  }
}