import { Metadata } from "next";
import clientPromise from "@/lib/mongodb";
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
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Transaction } from '@/lib/models';

export const metadata: Metadata = {
  title: `Transactions | ${process.env.NEXT_PUBLIC_COIN_NAME} Explorer`,
  description: `Browse all transactions on the ${process.env.NEXT_PUBLIC_COIN_NAME} blockchain`,
};

async function getTransactions(page: number = 1, limit: number = 25) {
  const client = await clientPromise;
  const db = client.db();
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get total count for pagination
  const totalTxs = await db.collection('txs').countDocuments({});
  const totalPages = Math.ceil(totalTxs / limit);
  
  // Get transactions with pagination
  const transactions = await db.collection('txs')
    .find({})
    .sort({ timestamp: -1 }) // Sort by timestamp descending (newest first)
    .skip(skip)
    .limit(limit)
    .toArray() as Transaction[];
    
  return {
    transactions,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems: totalTxs
    }
  };
}

// @ts-expect-error - Next.js 15 type issue with page props
export default async function TransactionsPage(props) {
  // Get the searchParams from props
  const { searchParams = {} } = props;
  
  // Parse query parameters with fallbacks
  const page = parseInt(searchParams?.page as string) || 1;
  
  // Get transactions with pagination
  const { transactions, pagination } = await getTransactions(page);
  
  // Function to create pagination URLs
  const createPageUrl = (pageNum: number) => {
    return `/txs?page=${pageNum}`;
  };
  
  // Function to truncate hash
  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Browse all transactions on the {process.env.NEXT_PUBLIC_COIN_NAME} blockchain
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowUpDown className="h-5 w-5 mr-2" />
            All Transactions
          </CardTitle>
          <CardDescription>
            Total of {formatNumber(pagination.totalItems)} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TxID</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.txid}>
                  <TableCell className="font-mono">
                    <Link href={`/tx/${tx.txid}`} className="hover:underline text-primary">
                      {truncateHash(tx.txid)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/block/${tx.blockindex}`} className="hover:underline">
                      {tx.blockindex || 'Pending'}
                    </Link>
                  </TableCell>
                  <TableCell className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {tx.timestamp ? timeAgo(tx.timestamp * 1000) : 'Pending'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(tx.total || 0)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              {/* First page button */}
              {page > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={createPageUrl(1)}>
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
              )}
              
              {/* Previous button */}
              {page > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={createPageUrl(page - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
              )}
              
              <div className="text-sm">
                Page {page} of {pagination.totalPages}
              </div>
              
              {/* Next button */}
              {page < pagination.totalPages ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={createPageUrl(page + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              
              {/* Last page button */}
              {page < pagination.totalPages ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={createPageUrl(pagination.totalPages)}>
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}