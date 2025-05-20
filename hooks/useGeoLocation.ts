import { useState, useEffect } from 'react';
import { Peer } from '@/types/blockchain';

export function useGeoLocation(peers: Peer[]) {
  const [peersWithLocation, setPeersWithLocation] = useState<Peer[]>(peers);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  
  useEffect(() => {
    if (peers.length === 0) return;
    
    const fetchGeoData = async () => {
      setIsLoadingGeo(true);
      
      const updatedPeers = [...peers];
      
      // Process peers in batches to avoid rate limits
      const batchSize = 20;
      for (let i = 0; i < updatedPeers.length; i += batchSize) {
        const batch = updatedPeers.slice(i, i + batchSize);
        
        const promises = batch.map(async (peer) => {
          try {
            // Extract IP from addr (remove port)
            const ip = peer.addr.split(':')[0];
            
            // Skip local IPs
            if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
              peer.country = 'Local Network';
              peer.countryCode = 'local';
              return peer;
            }
            
            const response = await fetch(`/api/geoip?ip=${ip}`);
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'success') {
                peer.country = data.country;
                peer.countryCode = data.countryCode.toLowerCase();
              }
            }
            return peer;
          } catch (error) {
            console.error('Error fetching geo data for peer:', peer.addr, error);
            return peer;
          }
        });
        
        await Promise.all(promises);
        
        // Update state incrementally as batches complete
        setPeersWithLocation([...updatedPeers]);
        
        // Add a small delay between batches to avoid rate limits
        if (i + batchSize < updatedPeers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setIsLoadingGeo(false);
    };
    
    fetchGeoData();
  }, [peers]);
  
  return { peersWithLocation, isLoadingGeo };
}