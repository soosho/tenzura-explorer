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
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { Wallet, Coins } from 'lucide-react';
import { getBlockchainStats } from "@/lib/blockchain-api";
import { KnownAddressBadge } from "@/components/known-address-badge";

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: `Rich List | ${process.env.NEXT_PUBLIC_COIN_NAME} Explorer`,
  description: `Top addresses by balance on the ${process.env.NEXT_PUBLIC_COIN_NAME} blockchain`,
};

interface AddressBalance {
  address: string;
  balance: number;
  txCount: number;
}

// Function to format large balances
function formatBalance(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}M ${process.env.NEXT_PUBLIC_COIN_SYMBOL}`;
  } 
  else if (amount >= 100_000) {
    return `${(amount / 1_000).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}K ${process.env.NEXT_PUBLIC_COIN_SYMBOL}`;
  } 
  else {
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })} ${process.env.NEXT_PUBLIC_COIN_SYMBOL}`;
  }
}

// Get top addresses DIRECTLY from the addresses collection
async function getTopAddresses(limit: number = 100): Promise<AddressBalance[]> {
  const client = await clientPromise;
  const db = client.db();
  
  try {
    // Direct query from addresses collection - always fresh data
    const addressDocs = await db.collection('addresses')
      .find({ balance: { $gt: 0 } })  // Only addresses with positive balances
      .sort({ balance: -1 })          // Highest first
      .limit(limit)                   // Limit to top 100
      .toArray();
    
    // Debugging code
    const targetAddress = addressDocs.find(doc => doc.a_id === "TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK");
    if (targetAddress) {
      console.log("DEBUG - Problem Address:", {
        address: targetAddress.a_id,
        rawBalance: targetAddress.balance,
        numberBalance: Number(targetAddress.balance),
        formattedBalance: formatBalance(Number(targetAddress.balance))
      });
      
      // Check another address for comparison
      const otherAddress = addressDocs.find(doc => doc.balance > 5000000);
      if (otherAddress) {
        console.log("DEBUG - Comparison Address:", {
          address: otherAddress.a_id,
          rawBalance: otherAddress.balance,
          numberBalance: Number(otherAddress.balance),
          formattedBalance: formatBalance(Number(otherAddress.balance))
        });
      }
    }
    
    // Map to the required format
    return addressDocs.map(doc => ({
      address: doc.a_id,
      balance: Number(doc.balance || 0),
      txCount: (doc.txs?.length || 0)
    }));
  } catch (error) {
    console.error("Error fetching top addresses:", error);
    return [];
  }
}

export default async function RichListPage() {
  // Get top 100 addresses directly from the addresses collection
  const addresses = await getTopAddresses(100);
  
  // Get blockchain stats to calculate percentage of total supply
  const blockchainStats = await getBlockchainStats();
  const totalSupply = blockchainStats.moneysupply;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rich List</h1>
        <p className="text-muted-foreground">
          Top 100 addresses by balance on the {process.env.NEXT_PUBLIC_COIN_NAME} blockchain
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="h-5 w-5 mr-2" />
            Top 100 Addresses
          </CardTitle>
          <CardDescription>
            Ranked by balance in {process.env.NEXT_PUBLIC_COIN_SYMBOL}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">% of Supply</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.length > 0 ? (
                addresses.map((address, index) => {
                  const rank = index + 1;
                  const percentage = totalSupply > 0 ? (address.balance / totalSupply) * 100 : 0;
                  
                  return (
                    <TableRow key={address.address || index}>
                      <TableCell>{rank}</TableCell>
                      <TableCell className="font-mono max-w-[200px] truncate">
                        <div className="flex items-center">
                          <Link href={`/address/${address.address}`} className="hover:underline text-primary">
                            {address.address || "Unknown"}
                          </Link>
                          <KnownAddressBadge address={address.address} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Coins className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          <span>
                            {formatBalance(address.balance)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {percentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(address.txCount || 0)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No addresses found. The database may be empty.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}