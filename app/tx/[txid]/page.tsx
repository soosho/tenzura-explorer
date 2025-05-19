import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from "@/components/ui/separator";
import { getTransaction } from '@/lib/blockchain-api';
import { formatDistance, format } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeftRight, 
  Calendar, 
  Check, 
  Clock, 
  ExternalLink, 
  History, 
  Info,
  Banknote, 
  Layers
} from 'lucide-react';
import { CopyButton } from '@/components/copy-button';

// Define our transaction interface
interface TransactionDetails {
  txid: string;
  blockindex?: number;
  blockhash?: string;
  timestamp: number;
  vin: {
    addresses: string;
    amount: number;
  }[];
  vout: {
    addresses: string;
    amount: number;
  }[];
  total: number;
  confirmations?: number;
  version?: number;
  locktime?: number;
}

export default async function TransactionPage({ params }: { params: Promise<{ txid: string }> }) {
  const { txid } = await params;
  
  const tx = await getTransaction(txid) as TransactionDetails;
  
  if (!tx) {
    notFound();
  }
  
  // Calculate fee - sum of inputs minus sum of outputs
  const inputTotal = tx.vin.reduce((sum, input) => sum + (input.amount || 0), 0);
  const outputTotal = tx.vout
    .filter(output => !(output.addresses === 'unknown' && output.amount === 0))
    .reduce((sum, output) => sum + (output.amount || 0), 0);
  const fee = inputTotal - outputTotal;
  
  // Format timestamp
  const timestamp = new Date((tx.timestamp || 0) * 1000);
  const formattedDate = format(timestamp, 'PPpp');
  const timeAgo = formatDistance(timestamp, new Date(), { addSuffix: true });
  
  // Check if it's a coinbase transaction
  const isCoinbase = tx.vin.some(input => input.addresses === 'coinbase');
  
  // Add this helper function at the top of your component
  function formatAmount(amount: number): string {
    // If it's a whole number, don't show decimals
    if (Math.floor(amount) === amount) {
      return amount.toLocaleString();
    }
    // Otherwise show up to 2 decimal places
    return amount.toLocaleString(undefined, { 
      minimumFractionDigits: 1,
      maximumFractionDigits: 2 
    });
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction</h1>
          <p className="text-muted-foreground mt-1">Details for transaction</p>
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
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Transaction Information
          </CardTitle>
          <CardDescription>
            {tx.confirmations && tx.confirmations > 0 ? (
              <span className="flex items-center">
                <Check className="h-4 w-4 mr-1 text-green-500" />
                {tx.confirmations >= 6 ? 
                  `Confirmed with ${tx.confirmations} confirmations` : 
                  `${tx.confirmations} confirmation${tx.confirmations !== 1 ? 's' : ''}`}
              </span>
            ) : (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                Pending - Waiting for confirmation
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Transaction ID</h3>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm break-all">{tx.txid}</p>
                <CopyButton text={tx.txid} label="Copy" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <div className="flex items-center">
                  {tx.confirmations && tx.confirmations > 0 ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {tx.confirmations >= 6 ? "Confirmed" : `${tx.confirmations} Confirmation${tx.confirmations !== 1 ? 's' : ''}`}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Timestamp</h3>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>{formattedDate} <span className="text-muted-foreground">({timeAgo})</span></div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tx.blockindex && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Block</h3>
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Link href={`/block/${tx.blockindex}`} className="text-primary hover:underline flex items-center">
                      {tx.blockindex}
                      <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h3>
                <div className="flex items-center">
                  <Banknote className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="font-medium">
                    {formatAmount(outputTotal)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}
                  </div>
                </div>
              </div>
              
              {!isCoinbase && fee > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Fee</h3>
                  <div className="flex items-center">
                    <History className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      {formatAmount(fee)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>
              {(() => {
                // Calculate the unique input sources once and store the result
                const inputSources = Object.keys(
                  tx.vin.reduce((acc: Record<string, boolean>, input) => {
                    if (input.addresses !== 'unknown' && input.addresses !== 'coinbase') {
                      acc[input.addresses] = true;
                    }
                    return acc;
                  }, {} as Record<string, boolean>)
                );
                
                // Use the calculated value for both the count and the plural check
                return `${inputSources.length} input source${inputSources.length !== 1 ? 's' : ''}`;
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Input Value:</span>
                <span className="font-medium">
                  {formatAmount(inputTotal)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}
                </span>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tx.vin.length > 0 ? (
                  // Group inputs by address, sum amounts, and sort by highest amount
                  Object.entries(tx.vin.reduce((acc, input) => {
                    // Skip unknown with 0 amount
                    if (input.addresses === 'unknown' && (!input.amount || input.amount === 0)) {
                      return acc;
                    }
                    
                    if (!acc[input.addresses]) {
                      acc[input.addresses] = {
                        address: input.addresses,
                        amount: 0,
                        count: 0
                      };
                    }
                    
                    acc[input.addresses].amount += input.amount || 0;
                    acc[input.addresses].count += 1;
                    
                    return acc;
                  }, {} as Record<string, { address: string, amount: number, count: number }>))
                  .sort(([, a], [, b]) => b.amount - a.amount) // Sort by amount descending
                  .map(([address, data], index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {address === 'coinbase' ? (
                          <Badge variant="secondary">Coinbase (New Coins)</Badge>
                        ) : address === 'unknown' ? (
                          <span className="text-muted-foreground">Unknown</span>
                        ) : (
                          <div>
                            <Link href={`/address/${address}`} className="font-mono hover:underline truncate block max-w-[400px] text-primary">
                              {address}
                            </Link>
                            {data.count > 1 && (
                              <span className="text-xs text-muted-foreground">
                                ({data.count} inputs)
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {address === 'coinbase' ? (
                          '—'
                        ) : (
                          <span className="font-medium">
                            {formatAmount(data.amount)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">No inputs</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Outputs</CardTitle>
            <CardDescription>
              {tx.vout.filter(output => !(output.addresses === 'unknown')).length} output{tx.vout.filter(output => !(output.addresses === 'unknown')).length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tx.vout.length > 0 ? (
                    // Filter and sort outputs by highest amount first
                    tx.vout
                      .filter(output => output.addresses !== 'unknown')
                      .sort((a, b) => b.amount - a.amount) // Sort by amount descending
                      .map((output, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Link href={`/address/${output.addresses}`} className="font-mono hover:underline truncate block max-w-[400px] text-primary">
                              {output.addresses}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">
                              {formatAmount(output.amount)} {process.env.NEXT_PUBLIC_COIN_SYMBOL}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">No outputs</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Debug Information Panel */}
      <Card className="bg-slate-50 dark:bg-slate-900 border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="M12 8h.01"></path>
              <path d="M12 12v4"></path>
            </svg>
            Debug Information (Raw Input Data)
          </CardTitle>
          <CardDescription>
            Raw transaction input data to help diagnose missing inputs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-4 rounded overflow-auto max-h-[400px]">
            <div className="space-y-4">
              <div>
                <p className="font-bold mb-2">Raw Transaction Inputs ({tx.vin.length}):</p>
                {tx.vin.map((input, idx) => (
                  <div key={idx} className="border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                    <p className="text-amber-600 font-bold">Input #{idx + 1}:</p>
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify({
                        address: input.addresses,
                        amount: input.amount,
                        rawAmount: typeof input.amount === 'number' ? 
                                   `${input.amount} (${input.amount.toFixed(8)})` : 
                                   'undefined/invalid',
                      }, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            
              <div>
                <p className="font-bold mb-2">Input Statistics:</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify({
                    totalInputs: tx.vin.length,
                    uniqueAddresses: Object.keys(tx.vin.reduce((acc, input) => {
                      if (input.addresses !== 'unknown' && input.addresses !== 'coinbase') {
                        acc[input.addresses] = true;
                      }
                      return acc;
                    }, {} as Record<string, boolean>)).length,
                    calculatedInputTotal: inputTotal,
                    outputTotal: outputTotal,
                    calculatedFee: fee
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-amber-600 font-semibold">Transaction Processing Issues:</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>If input total is much less than output total, some inputs may not be processing</li>
              <li>Check for invalid numbers, missing values, or NaN in the raw input data</li>
              <li>The current synchronization code uses Promise.all which can silently fail</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {(tx.version !== undefined || tx.locktime !== undefined || tx.blockhash) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Technical Details
            </CardTitle>
            <CardDescription>Additional information for developers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tx.version !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Version</h3>
                  <div>{tx.version}</div>
                </div>
              )}
              
              {tx.locktime !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Lock Time</h3>
                  <div>{tx.locktime}</div>
                </div>
              )}
              
              {tx.blockhash && (
                <div className="col-span-1 md:col-span-3">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Block Hash</h3>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm break-all">{tx.blockhash}</div>
                    <CopyButton text={tx.blockhash} label="Copy" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}