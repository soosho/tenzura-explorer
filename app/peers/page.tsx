'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Network, Clock, Copy, Globe, ArrowDown, ArrowUp } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { Peer } from '@/types/blockchain';
import 'flag-icons/css/flag-icons.min.css';

export default function PeersPage() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Use our new hook to get peer locations
  const { peersWithLocation, isLoadingGeo } = useGeoLocation(peers);
  
  // Fetch peers data
  useEffect(() => {
    async function fetchPeers() {
      try {
        const timestamp = Date.now(); // To prevent caching
        const response = await fetch(`/api/peers?t=${timestamp}`);
        if (response.ok) {
          const data = await response.json();
          setPeers(data);
        } else {
          console.error('Failed to fetch peers');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching peers:', error);
        setIsLoading(false);
      }
    }

    fetchPeers();
    
    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(fetchPeers, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Format bytes to human readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Copy connection string to clipboard
  const copyConnectionString = (peer: Peer) => {
    // Extract ip:port from address
    const connectionString = peer.addr;
    
    // Copy to clipboard
    navigator.clipboard.writeText(`addnode=${connectionString}`).then(() => {
      setCopied(connectionString);
      setTimeout(() => setCopied(null), 2000);
    }).catch(err => {
      console.error('Failed to copy connection string:', err);
    });
  };

  // Add a function to render country flag
  const renderCountryFlag = (countryCode?: string, country?: string) => {
    if (!countryCode || !country) return <Globe className="h-4 w-4" />;
    
    if (countryCode === 'local') {
      return '🏠';
    }
    
    return (
      <span 
        className={`fi fi-${countryCode.toLowerCase()}`} 
        title={country}
      />
    );
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center p-12">Loading peer information...</div>;
  }

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Network Peers</h1>
      <p className="text-muted-foreground">Currently connected peers on the {process.env.NEXT_PUBLIC_COIN_NAME} network</p>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="h-5 w-5 mr-2" />
            Connected Peers
          </CardTitle>
          <CardDescription>
            {peers.length} peers currently connected to this node
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="bg-background border rounded-lg p-4 flex-1">
                <div className="text-sm text-muted-foreground">Inbound Connections</div>
                <div className="text-2xl font-bold">{peers.filter(p => p.inbound).length}</div>
              </div>
              <div className="bg-background border rounded-lg p-4 flex-1">
                <div className="text-sm text-muted-foreground">Outbound Connections</div>
                <div className="text-2xl font-bold">{peers.filter(p => !p.inbound).length}</div>
              </div>
              <div className="bg-background border rounded-lg p-4 flex-1">
                <div className="text-sm text-muted-foreground">Total Data Transferred</div>
                <div className="text-2xl font-bold">
                  {formatBytes(peers.reduce((sum, peer) => sum + peer.bytessent + peer.bytesrecv, 0))}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node Address</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Connection</TableHead>
                    <TableHead>Connected Since</TableHead>
                    <TableHead>Data Transfer</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {peersWithLocation.map((peer) => (
                    <TableRow key={peer.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          {peer.addr}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-lg mr-1">{renderCountryFlag(peer.countryCode, peer.country)}</span>
                          <span className="text-xs text-muted-foreground">{peer.country || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{peer.subver}</div>
                      </TableCell>
                      <TableCell>
                        {peer.inbound ? (
                          <div className="flex items-center">
                            <ArrowDown className="h-4 w-4 mr-1 text-green-500" />
                            Inbound
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <ArrowUp className="h-4 w-4 mr-1 text-blue-500" />
                            Outbound
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          {timeAgo(peer.conntime * 1000)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          ↑ {formatBytes(peer.bytessent)} / ↓ {formatBytes(peer.bytesrecv)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyConnectionString(peer)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          {copied === peer.addr ? 'Copied!' : 'Copy'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {isLoadingGeo && (
              <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading country information...
              </div>
            )}
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <h3 className="font-semibold mb-2">Adding Nodes to Your Configuration</h3>
              <p className="mb-2">To add these nodes to your {process.env.NEXT_PUBLIC_COIN_NAME} configuration:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click the &quot;Copy&quot; button next to a node address</li>
                <li>Add the copied text to your <code className="bg-muted px-1 py-0.5 rounded">{process.env.NEXT_PUBLIC_COIN_NAME?.toLowerCase()}.conf</code> file</li>
                <li>Restart your wallet or node for changes to take effect</li>
              </ol>
              <p className="mt-2 text-muted-foreground">
                Example: <code className="bg-muted px-1 py-0.5 rounded">addnode=127.0.0.1:12444</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}