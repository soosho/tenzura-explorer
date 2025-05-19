import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle ext/getaddress/[hash]
  if (path.startsWith('/ext/getaddress/') && path.split('/').length === 4) {
    const hash = path.split('/').pop();
    return NextResponse.redirect(new URL(`/ext/getaddress?address=${hash}`, url.origin));
  }
  
  // Handle ext/getbalance/[hash]
  if (path.startsWith('/ext/getbalance/') && path.split('/').length === 4) {
    const hash = path.split('/').pop();
    return NextResponse.redirect(new URL(`/ext/getbalance?address=${hash}`, url.origin));
  }
  
  // Handle ext/gettx/[hash]
  if (path.startsWith('/ext/gettx/') && path.split('/').length === 4) {
    const hash = path.split('/').pop();
    return NextResponse.redirect(new URL(`/ext/gettx?txid=${hash}`, url.origin));
  }
  
  // Handle ext/getlasttxsajax/[min]
  if (path.startsWith('/ext/getlasttxsajax/') && path.split('/').length === 4) {
    const min = path.split('/').pop();
    return NextResponse.redirect(new URL(`/ext/getlasttxsajax?min=${min}`, url.origin));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/ext/:path*'],
};