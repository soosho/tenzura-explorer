import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    
    // Generate QR code as data URL instead of PNG buffer
    const qrDataUrl = await QRCode.toDataURL(address, {
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Extract the base64 data from the data URL
    const base64Data = qrDataUrl.split(',')[1];
    
    // Convert base64 to a Uint8Array which is a valid BodyInit type
    const binaryData = Buffer.from(base64Data, 'base64');
    
    // Create response with Uint8Array which is a valid BodyInit type
    return new Response(binaryData, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${address}.png"`,
        'Cache-Control': 'public, max-age=86400' // Cache for a day
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}