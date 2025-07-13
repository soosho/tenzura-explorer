# Tenzura Explorer

A blockchain explorer built with Next.js for Tenzura and other Bitcoin-based cryptocurrencies. This explorer connects directly to your blockchain node via RPC to provide real-time blockchain data and optionally uses MongoDB for enhanced features like address tracking and rich lists.

🔗 **Live Demo**: [https://chain.tenzura.io](https://chain.tenzura.io)

## Features

- **Real-time Blockchain Data**: Connects directly to your node via RPC for live stats
- **Block Explorer**: Browse blocks and view detailed block information  
- **Transaction Explorer**: View transaction details with inputs/outputs
- **Address Lookup**: Search for specific addresses (requires MongoDB sync)
- **Rich List**: Top addresses by balance (requires MongoDB sync)
- **Network Statistics**: Difficulty, hash rate, peer connections
- **Admin Panel**: Manage known addresses and sync operations
- **Multi-coin Support**: Configurable for any Bitcoin-based cryptocurrency
- **Modern UI**: Built with Next.js, shadcn/ui and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Radix UI, Tailwind CSS  
- **Database**: MongoDB (optional - enables richlist and address features)
- **Blockchain**: Bitcoin Core RPC client
- **Charts**: Chart.js for statistics

## Architecture

The explorer works in two modes:

### 1. **RPC-Only Mode** (MongoDB not required)
- Direct blockchain queries via RPC
- Real-time network statistics
- Block and transaction viewing
- Basic search functionality

### 2. **Full Mode** (MongoDB required)  
- All RPC-only features PLUS:
- Address balance tracking
- Rich list functionality  
- Transaction history for addresses
- Faster search and pagination
- Historical data storage

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A running blockchain node with RPC enabled (Tenzura or compatible Bitcoin-based coin)
- [MongoDB](https://www.mongodb.com/docs/manual/installation/) *(Optional - only needed for richlist and address features)*

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/soosho/tenzura-explorer.git
cd tenzura-explorer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Blockchain node connection (REQUIRED)
WALLET_HOST=127.0.0.1
WALLET_PORT=9766
WALLET_USERNAME=your_rpc_username
WALLET_PASSWORD=your_rpc_password

# Explorer branding
NEXT_PUBLIC_COIN_NAME=Tenzura
NEXT_PUBLIC_COIN_SYMBOL=TENZ
NEXT_PUBLIC_LOGO_PATH=https://raw.githubusercontent.com/Tenzura/Tenzura/refs/heads/main/share/pixmaps/tenzura256.png

# Admin panel password
ADMIN_PASSWORD=your_admin_password

# MongoDB connection (OPTIONAL - only for richlist/address features)
MONGODB_URI=mongodb://username:password@localhost:27017/explorer
```

### 4. Set Up Your Blockchain Node

Ensure your blockchain node is running with RPC enabled. Add these lines to your coin's configuration file (e.g., `tenzura.conf`):

```conf
rpcuser=your_rpc_username
rpcpassword=your_rpc_password
rpcport=9766
rpcallowip=127.0.0.1
server=1
daemon=1
txindex=1
```

### 5. Initialize Database (Optional - for MongoDB features only)

If you want richlist and address tracking features, set up MongoDB and initialize:

```bash
npm run init-db
```

### 6. Sync Blockchain Data (Optional - for MongoDB features only)

For initial sync of historical data to MongoDB:

```bash
npm run sync:index:reindex
```

For regular updates:

```bash
npm run sync:index:update
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Mode

```bash
npm run build
npm start
```

## Sync Commands (MongoDB Features)

The explorer includes sync commands for maintaining blockchain data in MongoDB:

| Command | Description |
|---------|-------------|
| `npm run sync:index:update` | Update from last synced block to current |
| `npm run sync:index:check` | Check for missing transactions/addresses |  
| `npm run sync:index:reindex` | Full resync from genesis block |
| `npm run sync:index:richlist` | Update richlist only |
| `npm run sync:clean-locks` | Remove stale lock files |
| `npm run sync:force` | Force update (removes locks first) |
| `npm run sync:daemon` | Start automatic scheduled sync |

### Automated Sync

For production with MongoDB, run the sync daemon:

```bash
npm run sync:daemon
```

This keeps your MongoDB data synchronized with the blockchain automatically.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── blocks/            # Block explorer pages
│   ├── tx/                # Transaction pages
│   └── address/           # Address pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── blockchain.ts     # Blockchain RPC client
│   ├── mongodb.ts        # Database connection
│   └── models.ts         # Data models
├── scripts/              # Sync and maintenance scripts
├── config/               # Configuration files
└── types/                # TypeScript type definitions
```

## API Endpoints

### Direct RPC Endpoints (always available)
- `/api/stats` - Blockchain statistics  
- `/api/network` - Network information
- `/api/getblock` - Get block by hash/height
- `/api/getrawtransaction` - Get transaction by hash
- `/api/getblockcount` - Current block count
- `/api/getdifficulty` - Current difficulty  
- `/api/peers` - Connected peers

### MongoDB-dependent Endpoints (require sync)
- `/api/blocks/latest` - Latest blocks from database
- `/api/transactions/latest` - Latest transactions from database

## Configuration for Other Coins

To use this explorer with other Bitcoin-based cryptocurrencies:

1. **Update RPC Settings**: Set the correct host, port, username, and password for your node
2. **Update Branding**: Change coin name, symbol, and logo in environment variables
3. **Adjust Known Addresses**: Edit `config/known-addresses.ts` for your coin's notable addresses

Example for Bitcoin:

```env
WALLET_PORT=8332
NEXT_PUBLIC_COIN_NAME=Bitcoin  
NEXT_PUBLIC_COIN_SYMBOL=BTC
NEXT_PUBLIC_LOGO_PATH=https://example.com/bitcoin-logo.png
```

The explorer should work with any Bitcoin Core compatible RPC interface.

## Support the Development

If you find this project useful, consider supporting its development through cryptocurrency donations:

🚀 **[Donate with Crypto](https://nowpayments.io/donation/soosho)** - Supports multiple cryptocurrencies

## Issues

If you encounter any issues:

1. Check the [Issues](https://github.com/soosho/tenzura-explorer/issues) page
2. Create a new issue with your setup details and error logs

---

**Tenzura Explorer** - Explore the blockchain with style and efficiency! 🚀
