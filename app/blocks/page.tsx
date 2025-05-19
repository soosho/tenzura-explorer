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
import { Clock, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Block } from '@/lib/models';

export const metadata: Metadata = {
  title: `Blocks | ${process.env.NEXT_PUBLIC_COIN_NAME} Explorer`,
  description: `Browse all blocks on the ${process.env.NEXT_PUBLIC_COIN_NAME} blockchain`,
};

async function getBlocks(page: number = 1, limit: number = 25) {
  const client = await clientPromise;
  const db = client.db();
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get total count for pagination
  const totalBlocks = await db.collection('blocks').countDocuments({});
  const totalPages = Math.ceil(totalBlocks / limit);
  
  // Get blocks with pagination
  const blocks = await db.collection('blocks')
    .find({})
    .sort({ height: -1 }) // Sort by block height descending (newest first)
    .skip(skip)
    .limit(limit)
    .toArray() as Block[];
    
  return {
    blocks,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems: totalBlocks
    }
  };
}

// Use the more specific type-checking bypass
// @ts-expect-error - Next.js 15 type issue with page props
export default async function BlocksPage(props) {
  // Get the searchParams from props
  const { searchParams = {} } = props;
  
  // Parse query parameters with fallbacks
  const page = parseInt(searchParams?.page as string) || 1;
  
  // Get blocks with pagination
  const { blocks, pagination } = await getBlocks(page);
  
  // Function to create pagination URLs
  const createPageUrl = (pageNum: number) => {
    return `/blocks?page=${pageNum}`;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blocks</h1>
        <p className="text-muted-foreground">
          Browse all blocks on the {process.env.NEXT_PUBLIC_COIN_NAME} blockchain
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            All Blocks
          </CardTitle>
          <CardDescription>
            Total of {formatNumber(pagination.totalItems)} blocks mined
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Height</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead className="text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.map((block) => (
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
                  <TableCell>{block.txs?.length || 0}</TableCell>
                  <TableCell className="text-right">{formatNumber(block.size)} bytes</TableCell>
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