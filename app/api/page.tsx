import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { headers } from "next/headers";
import Link from "next/link";

export const metadata: Metadata = {
  title: `API Documentation | ${process.env.NEXT_PUBLIC_COIN_NAME} Explorer`,
  description: `API documentation for the ${process.env.NEXT_PUBLIC_COIN_NAME} blockchain explorer`,
};

export default async function ApiPage() {
  // Get the current domain dynamically using headers
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  
  // Use the detected domain or fall back to environment variable
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mb-4">
          The {process.env.NEXT_PUBLIC_COIN_NAME} block explorer provides an API allowing users and/or applications to retrieve information from the network without the need for a local wallet.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>API Calls</CardTitle>
          <p className="text-sm text-muted-foreground">Return data from {process.env.NEXT_PUBLIC_COIN_NAME} daemon</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">getdifficulty</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns the current difficulty.</p>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/api/getdifficulty`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/getdifficulty
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getconnectioncount</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns the number of connections the block explorer has to other nodes.</p>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/api/getconnectioncount`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/getconnectioncount
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getblockcount</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns the current block index.</p>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/api/getblockcount`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/getblockcount
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getblockhash [index]</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns the hash of the block at index; index 0 is the genesis block.</p>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/api/getblockhash?index=1337`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/getblockhash?index=1337
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getblock [hash]</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns information about the block with the given hash.</p>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/api/getblock?hash=000000562eceff5150e07065c2907ed71ee225f701cc93b7f0d737fcd120270b`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/getblock?hash=000000562eceff5150e07065c2907ed71ee225f701cc93b7f0d737fcd120270b
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getrawtransaction [txid] [decrypt]</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns raw transaction representation for given transaction id. decrypt can be set to 0(false) or 1(true).</p>
            <code className="text-xs bg-muted p-2 rounded-md block mb-2">
              <Link href={`/api/getrawtransaction?txid=728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723&decrypt=0`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/getrawtransaction?txid=728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723&decrypt=0
              </Link>
            </code>
            <code className="text-xs bg-muted p-2 rounded-md block">
              <Link href={`/api/getrawtransaction?txid=728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723&decrypt=1`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/getrawtransaction?txid=728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723&decrypt=1
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getnetworkhashps</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns the current network hashrate. (hash/s)</p>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/api/getnetworkhashps`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/getnetworkhashps
              </Link>
            </code>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Extended API</CardTitle>
          <p className="text-sm text-muted-foreground">Return data from local indexes</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">getmoneysupply</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns current money supply</p>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/ext/getmoneysupply`} target="_blank" className="hover:text-primary">
                {baseUrl}/ext/getmoneysupply
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getdistribution</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns wealth distribution stats</p>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/ext/getdistribution`} target="_blank" className="hover:text-primary">
                {baseUrl}/ext/getdistribution
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getaddress</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns information for given address</p>
            <code className="text-xs bg-muted p-2 rounded-md block mb-2">
              <Link href={`/ext/getaddress?address=TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK`} target="_blank" className="hover:text-primary">
                {baseUrl}/ext/getaddress?address=TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK
              </Link>
            </code>
            <p className="text-muted-foreground text-xs italic mb-1">Legacy format (redirects to the above): {baseUrl}/ext/getaddress/TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">gettx</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns information for given tx hash</p>
            <code className="text-xs bg-muted p-2 rounded-md block mb-2">
              <Link href={`/ext/gettx?txid=728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723`} target="_blank" className="hover:text-primary">
                {baseUrl}/ext/gettx?txid=728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723
              </Link>
            </code>
            <p className="text-muted-foreground text-xs italic mb-1">Legacy format (redirects to the above): {baseUrl}/ext/gettx/728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getbalance</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns current balance of given address</p>
            <code className="text-xs bg-muted p-2 rounded-md block mb-2">
              <Link href={`/ext/getbalance?address=TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK`} target="_blank" className="hover:text-primary">
                {baseUrl}/ext/getbalance?address=TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK
              </Link>
            </code>
            <p className="text-muted-foreground text-xs italic mb-1">Legacy format (redirects to the above): {baseUrl}/ext/getbalance/TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">getlasttxsajax</h3>
            <p className="text-muted-foreground text-sm mb-1">Returns last transactions greater than [min]</p>
            <p className="text-muted-foreground text-xs italic mb-1">Note: returned values are in satoshis</p>
            <code className="text-xs bg-muted p-2 rounded-md block mb-2">
              <Link href={`/ext/getlasttxsajax?min=100`} target="_blank" className="hover:text-primary">
                {baseUrl}/ext/getlasttxsajax?min=100
              </Link>
            </code>
            <p className="text-muted-foreground text-xs italic mb-1">Legacy format (redirects to the above): {baseUrl}/ext/getlasttxsajax/100</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Linking (GET)</CardTitle>
          <p className="text-sm text-muted-foreground">Linking to the block explorer</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">transaction (/tx/txid)</h3>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/tx/728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723`} target="_blank" className="hover:text-primary">
                {baseUrl}/tx/728814c83c34c68ad1fbb057b9fbdb0a1c8b4235cc74b99f2af89375bc9f1723
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">block (/block/hash)</h3>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/block/000000562eceff5150e07065c2907ed71ee225f701cc93b7f0d737fcd120270b`} target="_blank" className="hover:text-primary">
                {baseUrl}/block/000000562eceff5150e07065c2907ed71ee225f701cc93b7f0d737fcd120270b
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">address (/address/hash)</h3>
            <code className="text-xs bg-muted p-2 rounded-md inline-block">
              <Link href={`/address/TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK`} target="_blank" className="hover:text-primary">
                {baseUrl}/address/TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK
              </Link>
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">qrcode</h3>
            <code className="text-xs bg-muted p-2 rounded-md block mb-2">
              <Link href={`/api/qr?address=TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK`} target="_blank" className="hover:text-primary">
                {baseUrl}/api/qr?address=TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK
              </Link>
            </code>
            <p className="text-muted-foreground text-xs italic mb-1">Legacy format (redirects to the above): {baseUrl}/qr/TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}