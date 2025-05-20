import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Set this in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-secure-password-here';

// Log the loaded password (for debugging, remove in production)
console.log('API loaded with password:', ADMIN_PASSWORD);

// Simple password authentication
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  console.log("Auth header received:", authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log("Comparing tokens:", { 
    received: token, 
    expected: ADMIN_PASSWORD,
    match: token === ADMIN_PASSWORD 
  });
  
  return token === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Instead of parsing the TS file, simply return an empty object if the file doesn't exist
    // This allows the admin to start adding addresses
    const filePath = path.join(process.cwd(), 'config', 'known-addresses.ts');
    
    if (!existsSync(filePath)) {
      // Create the file with basic structure if it doesn't exist
      const initialContent = `export interface KnownAddress {
  label: string;
  description?: string;
  type: 'developer' | 'exchange' | 'funding' | 'team' | 'foundation' | 'other';
  verified: boolean;
}

const knownAddresses: Record<string, KnownAddress> = {
  // Addresses will be added here by the admin interface
};

export default knownAddresses;

export function getKnownAddress(address: string): KnownAddress | null {
  return knownAddresses[address] || null;
}

export function isKnownAddress(address: string): boolean {
  return address in knownAddresses;
}`;
      
      await writeFile(filePath, initialContent, 'utf8');
      return NextResponse.json({ addresses: {} });
    }
    
    // For existing files, use a more direct approach - read the actual knownAddresses module
    // This requires the server to be restarted when changes are made
    // Delete require cache to ensure we get fresh data
    try {
      // For Next.js API routes, use dynamic import instead of require
      const knownAddressesModule = await import('@/config/known-addresses');
      const addresses = knownAddressesModule.default;
      
      return NextResponse.json({ addresses });
    } catch (importError) {
      console.error('Error importing known addresses:', importError);
      return NextResponse.json({ addresses: {} });
    }
  } catch (error) {
    console.error('Error reading known addresses:', error);
    return NextResponse.json({ error: 'Failed to read addresses' }, { status: 500 });
  }
}

// Update the POST handler to better handle updates
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { address, data } = await request.json();
  
  // Validate input
  if (!address || !data || !data.label || !data.type) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  
  // Validate address format
  if (!/^[a-zA-Z0-9]{26,35}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
  }
  
  // Escape data to prevent breaking file
  const safeLabel = (data.label || '').replace(/"/g, '\\"');
  const safeDesc = (data.description || '').replace(/"/g, '\\"');
  
  try {
    // Read current file
    const filePath = path.join(process.cwd(), 'config', 'known-addresses.ts');
    let fileContent = await readFile(filePath, 'utf8');
    
    // Create the new entry with escaped values
    const newEntry = `  "${address}": {\n    label: "${safeLabel}",\n    description: "${safeDesc}",\n    type: "${data.type}",\n    verified: ${data.verified || false}\n  },\n`;
    
    const isUpdate = fileContent.includes(`"${address}":`);
    
    if (isUpdate) {
      // More precise update pattern that matches the whole address block
      const pattern = new RegExp(`\\s*"${address}":\\s*{[^}]*},?\\n?`, 'g');
      fileContent = fileContent.replace(pattern, newEntry);
    } else {
      // Add new entry - insert after opening bracket
      fileContent = fileContent.replace(/(const knownAddresses[^{]*{)/, `$1\n${newEntry}`);
    }
    
    await writeFile(filePath, fileContent, 'utf8');
    
    return NextResponse.json({ 
      success: true,
      action: isUpdate ? 'updated' : 'added'
    });
  } catch (error) {
    console.error('Error updating known addresses:', error);
    return NextResponse.json({ error: 'Failed to update addresses' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get the address from the URL
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'No address provided' }, { status: 400 });
  }
  
  try {
    // Read current file
    const filePath = path.join(process.cwd(), 'config', 'known-addresses.ts');
    let fileContent = await readFile(filePath, 'utf8');
    
    // Check if the address exists in the file
    if (!fileContent.includes(`"${address}":`)) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    
    // Remove the address entry
    fileContent = fileContent.replace(
      new RegExp(`\\s*"${address}":\\s*{[^}]*},?\\n?`, 'g'), 
      ''
    );
    
    // Clean up any trailing commas in the object
    fileContent = fileContent.replace(/,(\s*})/g, '$1');
    
    await writeFile(filePath, fileContent, 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting known address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}