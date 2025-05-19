import { getNetworkInfo, getBlockchainStats } from '@/lib/blockchain-api';
import clientPromise from '@/lib/mongodb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatNumber, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Block, Transaction } from '@/lib/models';
import { 
  BarChart3, 
  Layers,
  Network, 
  Clock, 
  Database,
  Users,
  ArrowUpDown,
  Zap,      // Added for hashrate
  Coins     // Added for coin supply
} from 'lucide-react';

async function getLatestBlocks(): Promise<Block[]> {  // Add return type
  const client = await clientPromise;
  const db = client.db();
  
  return db.collection('blocks')
    .find({})
    .sort({ height: -1 })
    .limit(10)
    .toArray() as Promise<Block[]>;  // Add type assertion
}

async function getLatestTransactions(): Promise<Transaction[]> {  // Add return type
  const client = await clientPromise;
  const db = client.db();
  
  return db.collection('txs')
    .find({})
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray() as Promise<Transaction[]>;  // Add type assertion
}

// Add this function to your existing utility functions or to lib/utils.ts
function formatCoinSupply(supply: number): string {
  // Format with commas as thousand separators and fixed decimal places
  const formattedNumber = supply.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  // For large numbers (millions+), add abbreviation
  if (supply >= 1_000_000) {
    const millions = supply / 1_000_000;
    return `${millions.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}M ${process.env.NEXT_PUBLIC_COIN_SYMBOL}`;
  }
  
  return `${formattedNumber} ${process.env.NEXT_PUBLIC_COIN_SYMBOL}`;
}

export default async function Home() {
  const [blockchainStats, networkInfo, latestBlocks, latestTxs] = await Promise.all([
    getBlockchainStats(),
    getNetworkInfo(),
    getLatestBlocks(),
    getLatestTransactions()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <p className="text-muted-foreground mt-1">Explore blocks, transactions and addresses on the blockchain</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/search">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Advanced Search
            </Link>
          </Button>
        </div>
      </div>

      {/* Network status bar */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Network className="h-3.5 w-3.5 mr-1" />
          <span>Network: <span className="font-medium">{blockchainStats.chain}</span></span>
        </div>
        <div className="flex items-center ml-0 sm:ml-4">
          <Users className="h-3.5 w-3.5 mr-1" />
          <span>Connections: <span className="font-medium">{networkInfo.connections}</span></span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Blockchain Statistics
          </CardTitle>
          <CardDescription>
            Current state of the {process.env.NEXT_PUBLIC_COIN_NAME} blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                <Layers className="h-4 w-4 mr-1" />
                Blocks
              </div>
              <div className="text-xl font-bold">{formatNumber(blockchainStats.blocks)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                Difficulty
              </div>
              <div className="text-xl font-bold">{formatNumber(blockchainStats.difficulty)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Network
              </div>
              <div className="text-xl font-bold">{formatNumber(blockchainStats.networkhashps / 1e9)} GH/s</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                <Coins className="h-4 w-4 mr-1" />
                Coin Supply
              </div>
              <div className="text-xl font-bold">
                {formatCoinSupply(blockchainStats.moneysupply)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Latest Blocks
            </CardTitle>
            <CardDescription>Most recent blocks added to the blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Height</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Txs</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestBlocks.map((block: Block) => (
                  <TableRow key={block.hash}>
                    <TableCell>
                      <Link href={`/block/${block.height}`} className="hover:underline text-primary">
                        {block.height}
                      </Link>
                    </TableCell>
                    <TableCell className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {timeAgo(block.timestamp * 1000)}
                    </TableCell>
                    <TableCell>{block.txs.length}</TableCell>
                    <TableCell className="text-right">{formatNumber(block.size)} bytes</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" asChild>
                <Link href="/blocks">
                  <Layers className="mr-2 h-4 w-4" />
                  View all blocks
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2" />
              Latest Transactions
            </CardTitle>
            <CardDescription>Most recent transactions on the network</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TX Hash</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestTxs.map((tx: Transaction) => (
                  <TableRow key={tx.txid}>
                    <TableCell className="font-mono">
                      <Link href={`/tx/${tx.txid}`} className="hover:underline text-primary">
                        {tx.txid.substring(0, 10)}...
                      </Link>
                    </TableCell>
                    <TableCell className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {timeAgo(tx.timestamp * 1000)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(tx.total)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" asChild>
                <Link href="/txs">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  View all transactions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
