import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// Set this in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-secure-password-here';

// Simple password authentication
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return token === ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  // Only allow in development mode for safety
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }
  
  // Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Create a temporary file change to trigger Next.js hot reload
    const triggerPath = path.join(process.cwd(), 'tmp', 'reload-trigger.txt');
    const timestamp = new Date().toISOString();
    await writeFile(triggerPath, `Server reload triggered at ${timestamp}`);
    
    return NextResponse.json({ success: true, message: 'Reload signal sent' });
  } catch (error) {
    console.error('Error triggering reload:', error);
    return NextResponse.json({ error: 'Failed to trigger reload' }, { status: 500 });
  }
}