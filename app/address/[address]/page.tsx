import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from "@/components/ui/separator";
import { getAddress } from '@/lib/blockchain-api';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  ArrowLeftRight, 
  Banknote, 
  Download, 
  Upload,
  Wallet,
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';
import { CopyButton } from '@/components/copy-button';
import { FilterControls } from '@/components/filter-controls';
import Image from 'next/image';

// Define interfaces
interface AddressTransaction {
  txid: string;
  amount: number;
  blockindex: number;
  time: number;
}

interface AddressDetails {
  address: string;
  balance: number;
  received: number;
  sent: number;
  txCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  transactions: AddressTransaction[];
}

// Define a type for the raw transaction data from MongoDB
interface RawAddressTransaction {
  txid?: string;
  amount?: number | string;
  blockindex?: number | string;
  time?: number | string;
  _id?: unknown;
  [key: string]: unknown; // For any other properties that might exist
}

export default async function AddressPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ address: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await params and searchParams
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Now extract the values
  const { address } = resolvedParams;
  
  // Parse query parameters
  const page = parseInt(resolvedSearchParams.page as string) || 1;
  const filter = (resolvedSearchParams.filter as string) || 'all';
  const sort = (resolvedSearchParams.sort as string) || 'recent';
  
  // Fetch address data with filters and pagination
  const rawData = await getAddress(address, {
    page,
    limit: 25,
    filter: filter as 'all' | 'sent' | 'received',
    sort: sort as 'recent' | 'oldest' | 'highest' | 'lowest',
  });

  if (!rawData) {
    notFound();
  }

  // Transform the data to match your interface
  const addressData: AddressDetails = {
    address: rawData.address,
    balance: Number(rawData.balance || 0),
    received: Number(rawData.received || 0),
    sent: Number(rawData.sent || 0),
    txCount: Number(rawData.txCount || 0),
    pagination: {
      page: Number(rawData.pagination?.page || page),
      limit: Number(rawData.pagination?.limit || 25),
      totalPages: Number(rawData.pagination?.totalPages || 1),
      totalItems: Number(rawData.pagination?.totalItems || 0)
    },
    transactions: (rawData.transactions as RawAddressTransaction[] || []).map(tx => ({
      txid: tx.txid || '',
      amount: Number(tx.amount || 0),
      blockindex: Number(tx.blockindex || 0),
      time: Number(tx.time || 0)
    })) || []
  };
  
  // Create URLs for navigation (updated to use awaited values)
  const createUrl = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams();
    
    // Add current params
    if (filter) params.set('filter', filter);
    if (sort) params.set('sort', sort);
    if (page) params.set('page', page.toString());
    
    // Override with new params
    Object.entries(newParams).forEach(([key, value]) => {
      params.set(key, value.toString());
    });
    
    return `/address/${address}?${params.toString()}`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Address</h1>
          <p className="text-muted-foreground mt-1">Details for the following address</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Explorer Home
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* QR Code - now in the header next to address */}
            <div className="bg-white border border-border p-2 rounded-md mr-2 hidden md:block">
              <Image 
                src={`/api/qr?address=${address}`}
                alt={`QR Code for ${address}`} 
                width={90}
                height={90}
                className="h-auto w-auto"
                priority
              />
            </div>
            
            <div className="flex-1">
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Address Information
              </CardTitle>
              
              {/* Make address larger and on its own line */}
              <CardDescription className="mt-3">
                <span className="font-mono text-base md:text-lg break-all block mb-3">{address}</span>
                
                {/* Move buttons below address and make them consistent */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <CopyButton text={address} />
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/qr?address=${address}`} download={`${address}.png`}>
                      <Download className="mr-2 h-4 w-4" />
                      Download QR
                    </a>
                  </Button>
                </div>
              </CardDescription>
            </div>
          </div>
          
          {/* Mobile-only QR code display */}
          <div className="flex justify-center md:hidden mt-4">
            <div className="bg-white border border-border p-2 rounded-md">
              <Image 
                src={`/api/qr?address=${address}`}
                alt={`QR Code for ${address}`} 
                width={120}
                height={120}
                className="h-auto w-auto"
                priority
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Balance</h3>
              <div className="flex items-center">
                <Banknote className="h-4 w-4 mr-2 text-muted-foreground" />
                <div className="font-medium text-xl">
                  {(addressData.balance || 0).toLocaleString()} {process.env.NEXT_PUBLIC_COIN_SYMBOL || 'TENZ'}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Received</h3>
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>{(addressData.received || 0).toLocaleString()} {process.env.NEXT_PUBLIC_COIN_SYMBOL || 'TENZ'}</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Sent</h3>
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>{(addressData.sent || 0).toLocaleString()} {process.env.NEXT_PUBLIC_COIN_SYMBOL || 'TENZ'}</div>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Transaction Count</h3>
            <div className="flex items-center">
              <ArrowLeftRight className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>{addressData.txCount.toLocaleString()} transaction{addressData.txCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, addressData.txCount)} of {addressData.txCount.toLocaleString()} transactions
              </CardDescription>
            </div>
            
            {/* Use the client component here instead of embedding Select components directly */}
            <FilterControls 
              addressUrl={`/address/${address}`}  // Pass URL instead of raw address
              currentFilter={filter}
              currentSort={sort}
              currentPage={page}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addressData.transactions.length > 0 ? (
                addressData.transactions.map((tx, index) => (
                  <TableRow key={`${tx.txid}-${index}`}>
                    <TableCell>
                      <Link href={`/tx/${tx.txid}`} className="font-mono hover:underline truncate block max-w-[250px] text-primary">
                        {tx.txid}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/block/${tx.blockindex}`} className="hover:underline">
                        {tx.blockindex}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {tx.time ? format(new Date(tx.time * 1000), 'MMM d, yyyy HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} {process.env.NEXT_PUBLIC_COIN_SYMBOL}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No transactions found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination controls */}
          {addressData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-4">
              {page > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={createUrl({ page: page - 1 })}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
              )}
              
              <div className="text-sm text-muted-foreground">
                Page {page} of {addressData.pagination.totalPages}
              </div>
              
              {page < addressData.pagination.totalPages ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={createUrl({ page: page + 1 })}>
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}