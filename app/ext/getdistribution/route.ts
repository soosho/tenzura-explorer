import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get total supply
    const stats = await db.collection('stats').findOne({});
    const totalSupply = stats?.supply || 0;
    
    // Get distribution data
    const addressAggregation = await db.collection('addresses').aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ['$balance', 1000000] },
              '1000000+',
              {
                $cond: [
                  { $gte: ['$balance', 100000] },
                  '100000-999999',
                  {
                    $cond: [
                      { $gte: ['$balance', 10000] },
                      '10000-99999',
                      {
                        $cond: [
                          { $gte: ['$balance', 1000] },
                          '1000-9999',
                          {
                            $cond: [
                              { $gte: ['$balance', 100] },
                              '100-999',
                              {
                                $cond: [
                                  { $gte: ['$balance', 10] },
                                  '10-99',
                                  {
                                    $cond: [
                                      { $gte: ['$balance', 1] },
                                      '1-9',
                                      '0-0.99'
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 },
          total: { $sum: '$balance' }
        }
      },
      { $sort: { total: -1 } }
    ]).toArray();
    
    // Format distribution data
    const distribution = addressAggregation.map(item => ({
      range: item._id,
      addresses: item.count,
      amount: item.total,
      percentage: (item.total / totalSupply * 100).toFixed(2)
    }));
    
    return NextResponse.json({
      supply: totalSupply,
      distribution
    });
  } catch (error) {
    console.error('Error fetching distribution:', error);
    return NextResponse.json({ error: 'Failed to fetch distribution' }, { status: 500 });
  }
}