import { NextResponse } from 'next/server';

// Define proper types for the geolocation data
interface GeoLocationData {
  status: string;
  message?: string;
  countryCode?: string;
  country?: string;
}

// Define a type for cache entries
interface CacheEntry {
  data: GeoLocationData;
  timestamp: number;
}

// Use the proper types in the cache
const geoCache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 86400000; // 24 hours in milliseconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get('ip');
  
  if (!ip) {
    return NextResponse.json({ error: 'IP parameter is required' }, { status: 400 });
  }
  
  try {
    // Check cache
    const now = Date.now();
    if (geoCache[ip] && (now - geoCache[ip].timestamp) < CACHE_DURATION) {
      return NextResponse.json(geoCache[ip].data);
    }
    
    // Use ip-api.com's free service (has rate limits: 45 req/min)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,countryCode,country`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch geolocation data');
    }
    
    const geoData = await response.json() as GeoLocationData;
    
    // Cache the result if successful
    if (geoData.status === 'success') {
      geoCache[ip] = {
        data: geoData,
        timestamp: now
      };
    }
    
    return NextResponse.json(geoData);
  } catch (error) {
    console.error('Error fetching geolocation data:', error);
    return NextResponse.json({ error: 'Failed to fetch geolocation data' }, { status: 500 });
  }
}