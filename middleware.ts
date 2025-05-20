import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle admin routes protection
  if (path.startsWith('/admin') && !path.startsWith('/api/admin') && !path.startsWith('/admin/login')) {
    // Check for admin cookie to avoid redirect loops
    const adminCookie = request.cookies.get('adminAuthenticated')?.value;
    
    if (adminCookie !== 'true') {
      // Only redirect if no admin cookie found
      const response = NextResponse.redirect(new URL('/admin/login', url.origin));
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      return response;
    }
  }
  
  // Handle redirections for ext/* endpoints
  if (path.startsWith('/ext/')) {
    let response = null;
    
    // Handle ext/getaddress/[hash]
    if (path.startsWith('/ext/getaddress/') && path.split('/').length === 4) {
      const hash = path.split('/').pop();
      response = NextResponse.redirect(new URL(`/ext/getaddress?address=${hash}`, url.origin));
    }
    
    // Handle ext/getbalance/[hash]
    else if (path.startsWith('/ext/getbalance/') && path.split('/').length === 4) {
      const hash = path.split('/').pop();
      response = NextResponse.redirect(new URL(`/ext/getbalance?address=${hash}`, url.origin));
    }
    
    // Handle ext/gettx/[hash]
    else if (path.startsWith('/ext/gettx/') && path.split('/').length === 4) {
      const hash = path.split('/').pop();
      response = NextResponse.redirect(new URL(`/ext/gettx?txid=${hash}`, url.origin));
    }
    
    // Handle ext/getlasttxsajax/[min]
    else if (path.startsWith('/ext/getlasttxsajax/') && path.split('/').length === 4) {
      const min = path.split('/').pop();
      response = NextResponse.redirect(new URL(`/ext/getlasttxsajax?min=${min}`, url.origin));
    }
    
    // If we're redirecting, add cache headers and return
    if (response) {
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      response.headers.set('CDN-Cache-Control', 'no-store');
      response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
      return response;
    }
  }
  
  // For all other routes, return the response with no-cache headers
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  return response;
}

// Update the matcher to continue applying to all routes except Next.js assets
export const config = {
  matcher: [
    // Matches all routes except Next.js assets 
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};