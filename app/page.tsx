'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Block, Transaction } from '@/lib/models';
import { 
  BarChart3, Layers, Network, Clock, Database,
  Users, ArrowUpDown, Zap, Coins
} from 'lucide-react';

export default function Home() {
  // State for all the data that needs to refresh
  const [blockchainStats, setBlockchainStats] = useState({
    blocks: 0,
    difficulty: 0,
    networkhashps: 0,
    moneysupply: 0,
    chain: ""
  });
  const [networkInfo, setNetworkInfo] = useState({ connections: 0 });
  const [latestBlocks, setLatestBlocks] = useState<Block[]>([]);
  const [latestTxs, setLatestTxs] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch all data
  const fetchData = async () => {
    try {
      const timestamp = Date.now(); // To prevent caching
      
      // Fetch blockchain stats
      const statsRes = await fetch(`/api/stats?t=${timestamp}`);
      const stats = await statsRes.json();
      
      // Fetch network info
      const networkRes = await fetch(`/api/network?t=${timestamp}`);
      const network = await networkRes.json();
      
      // Fetch latest blocks
      const blocksRes = await fetch(`/api/blocks/latest?t=${timestamp}`);
      const blocks = await blocksRes.json();
      
      // Fetch latest transactions
      const txsRes = await fetch(`/api/transactions/latest?t=${timestamp}`);
      const txs = await txsRes.json();
      
      // Update all state
      setBlockchainStats(stats);
      setNetworkInfo(network);
      setLatestBlocks(blocks);
      setLatestTxs(txs);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Initial data fetch and set up auto-refresh
  useEffect(() => {
    fetchData();
    
    // Set up 30-second refresh interval
    const intervalId = setInterval(fetchData, 30000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Show loading state while initial data loads
  if (isLoading) {
    return <div className="flex justify-center items-center p-12">Loading blockchain data...</div>;
  }

  // Render the same UI you already have, but with state variables
  return (
    <div className="space-y-6">
      {/* Keep your existing UI structure */}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
              <div className="text-xl font-bold">{formatNumber(blockchainStats.moneysupply)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Connections
              </div>
              <div className="text-xl font-bold">{networkInfo.connections}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                <Network className="h-4 w-4 mr-1" />
                Network
              </div>
              <div className="text-xl font-bold">{blockchainStats.chain}</div>
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
                {latestBlocks.map((block) => (
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
                {latestTxs.map((tx) => (
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
