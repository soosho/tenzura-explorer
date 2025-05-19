import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { type NextRequest } from 'next/server';

// Define an interface for the transaction input
interface TxInput {
  address: string;
  amount?: number;
  txid?: string;
  vout?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get address from query parameter
    const url = new URL(request.url);
    const addressHash = url.searchParams.get('address');
    
    if (!addressHash) {
      return NextResponse.json({ error: 'Address hash is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get address data
    const addressData = await db.collection('addresses').findOne({ 
      $or: [
        { a_id: addressHash },
        { address: addressHash }
      ] 
    });
    
    if (!addressData) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    
    // Get transactions for this address
    const txs = await db.collection('txs')
      .find({
        $or: [
          { 'vin.address': addressHash },
          { 'vout.address': addressHash }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    return NextResponse.json({
      address: addressData.a_id || addressData.address,
      balance: addressData.balance,
      received: addressData.received || 0,
      sent: addressData.sent || 0,
      txCount: addressData.txs?.length || 0,
      transactions: txs.map(tx => ({
        txid: tx.txid,
        timestamp: tx.timestamp,
        amount: tx.total,
        type: tx.vin.some((vin: TxInput) => vin.address === addressHash) ? 'sent' : 'received'
      }))
    });
  } catch (error) {
    console.error('Error fetching address data:', error);
    return NextResponse.json({ error: 'Failed to fetch address data' }, { status: 500 });
  }
}