import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { type NextRequest } from 'next/server';

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
    
    const address = await db.collection('addresses').findOne({ 
      $or: [
        { a_id: addressHash },
        { address: addressHash }
      ] 
    });
    
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    
    return NextResponse.json(address.balance || 0);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}