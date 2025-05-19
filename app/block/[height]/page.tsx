import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBlock } from '@/lib/blockchain-api';
import { formatDistance, format } from 'date-fns';
import Link from 'next/link';

// Define the Transaction interface that was missing
interface Transaction {
  txid: string;
  vin: {
    addresses: string;
    amount: number;
  }[];
  vout: {
    addresses: string;
    amount: number;
  }[];
  total: number;
}

// Create an interface for your block structure
interface BlockWithTransactions {
  hash: string;
  height: number;
  size: number;
  timestamp: number;
  difficulty: number;
  merkle: string;
  nonce: number;
  bits: string;
  txs: string[];
  transactions: Transaction[];
  prev_hash?: string;
  next_hash?: string;
}

export default async function BlockPage({ params }: { params: Promise<{ height: string }> }) {
  const resolvedParams = await params;
  const blockHeight = parseInt(resolvedParams.height, 10);
  
  if (isNaN(blockHeight)) {
    notFound();
  }
  
  // Use type assertion to fix block type issues
  const block = await getBlock(blockHeight) as BlockWithTransactions;
  
  if (!block) {
    notFound();
  }
  
  // Safely handle timestamp which might be undefined
  const timestamp = new Date((block.timestamp || 0) * 1000);
  const formattedDate = format(timestamp, 'PPpp');
  const timeAgo = formatDistance(timestamp, new Date(), { addSuffix: true });
  
  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Block #{block.height}</h1>
        <div className="flex gap-2">
          {block.height > 1 && (
            <Link href={`/block/${block.height - 1}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2">
              &lt; Previous Block
            </Link>
          )}
          <Link href={`/block/${block.height + 1}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2">
            Next Block &gt;
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Block Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Block Hash</div>
                <div className="font-mono break-all">{block.hash}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Timestamp</div>
                <div>{formattedDate} ({timeAgo})</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Transactions</div>
                <div>{block.txs?.length || 0} transactions</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Block Reward</div>
                <div>{getBlockReward(block)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Size</div>
                <div>{block.size?.toLocaleString() || 0} bytes</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Difficulty</div>
                <div>{block.difficulty?.toLocaleString() || 0}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Nonce</div>
                <div>{block.nonce || 0}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Merkle Root</div>
                <div className="font-mono truncate">{block.merkle}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.transactions?.length ? (
                block.transactions.map((tx) => (
                  <TableRow key={tx.txid}>
                    <TableCell>
                      <Link href={`/tx/${tx.txid}`} className="font-mono hover:underline truncate block max-w-[200px]">
                        {tx.txid}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {isCoinbase(tx) ? (
                        <Badge>Coinbase (New Coins)</Badge>
                      ) : (
                        <span>{tx.vout?.length || 0} recipient(s)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{tx.total || 0} {process.env.NEXT_PUBLIC_COIN_SYMBOL}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">Loading transactions...</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getBlockReward(block: BlockWithTransactions): number {
  // Find the coinbase transaction (first transaction in the block)
  const coinbaseTx = block.transactions?.find(tx => 
    tx.vin?.some(input => input.addresses === 'coinbase')
  );
  
  // Return the total output amount from the coinbase transaction
  return coinbaseTx?.total || 0;
}

function isCoinbase(tx: Transaction): boolean {
  return tx.vin?.some(input => input.addresses === 'coinbase') || false;
}