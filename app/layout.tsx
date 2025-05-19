import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { Layers, Users } from 'lucide-react';
import { getInfo, getNetworkInfo } from '@/lib/blockchain';
import { NavbarWrapper } from '@/components/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: process.env.NEXT_PUBLIC_COIN_NAME + ' Explorer',
  description: 'Blockchain explorer for ' + process.env.NEXT_PUBLIC_COIN_NAME,
  metadataBase: new URL('https://chain.tenzura.io'),
  other: {
    'Cache-Control': 'no-store, max-age=0',
  },
};

// Server component that fetches blockchain data
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch blockchain info and network info for the footer
  const [blockchainInfo, networkInfo] = await Promise.all([
    getInfo(),
    getNetworkInfo()
  ]);

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          {/* NavbarWrapper handles the client-side functionality */}
          <NavbarWrapper />
          
          <main className="flex-1 flex justify-center w-full py-8 mt-24">
            <div className="w-full max-w-7xl px-6 sm:px-8">
              {children}
            </div>
          </main>
          
          <footer className="border-t py-6">
            <div className="flex justify-center w-full">
              <div className="w-full max-w-7xl px-6 sm:px-8 text-sm">
                <div className="flex flex-col md:flex-row md:justify-between items-center gap-4">
                  <div className="text-center md:text-left">
                    © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COIN_NAME} Explorer
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <Layers className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Block Height: {blockchainInfo.blocks.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Connections: {networkInfo.connections}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
