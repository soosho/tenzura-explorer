import clientPromise from './mongodb';
import client from './blockchain';
import { Block } from 'bitcoin-core';

// Define proper interfaces for the blockchain data
interface RPCTransaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: RPCTransactionInput[];
  vout: RPCTransactionOutput[];
}

interface RPCTransactionInput {
  txid?: string;
  vout?: number;
  scriptSig?: {
    asm: string;
    hex: string;
  };
  sequence: number;
  coinbase?: string;
}

interface RPCTransactionOutput {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs?: number;
    type: string;
    addresses?: string[];
  };
}

interface TransactionOutput {
  addresses: string;
  amount: number;
}

interface TransactionInput {
  addresses: string;
  amount: number;
}

interface FormattedTransaction {
  txid: string;
  vin: TransactionInput[];
  vout: TransactionOutput[];
  total: number;
}

export interface BlockchainStats {
  blocks: number;
  difficulty: number;
  networkhashps: number;
  moneysupply: number;
  chain: string;
}

// Add this interface at the top with your other interfaces
interface CoinInfo {
  version: number;
  protocolversion: number;
  walletversion?: number;
  balance?: number;
  blocks: number;
  timeoffset: number;
  connections: number;
  proxy?: string;
  difficulty: number;
  testnet: boolean;
  keypoololdest?: number;
  keypoolsize?: number;
  paytxfee?: number;
  relayfee?: number;
  errors: string;
  moneysupply: number;
  chain?: string;
  [key: string]: unknown; // For other properties that might exist
}

// Add this interface near your other interfaces
interface NetworkAddress {
  name: string;
  limited: boolean;
  reachable: boolean;
  proxy: string;
  proxy_randomize_credentials: boolean;
}

interface LocalAddress {
  address: string;
  port: number;
  score: number;
}

interface NetworkInfo {
  version: number;
  subversion: string;
  protocolversion: number;
  connections: number;
  networks: NetworkAddress[];
  relayfee: number;
  localaddresses: LocalAddress[];
  warnings: string;
  [key: string]: unknown; // For other properties
}

// Add this interface to your existing interfaces
interface UTXOSetInfo {
  height: number;
  bestblock: string;
  transactions: number;
  txouts: number;
  bogosize: number;
  hash_serialized_2: string;
  disk_size: number;
  total_amount: number;
}

interface AddressTx {
  _id?: string;
  a_id: string;
  txid: string;
  blockindex: number;
  amount: number;
  time?: number;
}

interface GroupedAddressTx {
  txid: string;
  blockindex: number;
  amount: number;
  time: number;
  count: number;
}

export async function getBlock(height: number) {
  try {
    const mongo = await clientPromise;
    const db = mongo.db();
    
    // Try to get block from database first
    const block = await db.collection('blocks').findOne({ height });
    
    if (block) {
      // Get transactions for the block
      const transactions = await db.collection('txs')
        .find({ blockhash: block.hash })
        .sort({ _id: 1 })
        .limit(100) // Limit for performance, can paginate if needed
        .toArray();
      
      return {
        ...block,
        transactions
      };
    }
    
    // If not found in DB, try to get from node
    const blockHash = await client.getBlockHash(height);
    const blockData = await client.getBlock(blockHash, 2) as Block; // Verbose with tx data
    
    // Process and return block data
    return {
      hash: blockData.hash,
      height: blockData.height,
      confirmations: blockData.confirmations,
      size: blockData.size,
      timestamp: blockData.time,
      bits: blockData.bits,
      nonce: blockData.nonce,
      difficulty: blockData.difficulty,
      merkle: blockData.merkleroot,
      prev_hash: blockData.previousblockhash,
      next_hash: blockData.nextblockhash,
      txs: blockData.tx.map((tx) => typeof tx === 'string' ? tx : tx.txid),
      transactions: blockData.tx.map((tx): FormattedTransaction => {
        if (typeof tx === 'string') {
          return { txid: tx, vin: [], vout: [], total: 0 };
        }
        
        const rpcTx = tx as unknown as RPCTransaction;
        
        const inputs: TransactionInput[] = rpcTx.vin.map((input: RPCTransactionInput) => {
          if (input.coinbase) {
            return { addresses: 'coinbase', amount: 0 };
          }
          return { addresses: 'unknown', amount: 0 }; // Would need additional RPC call to get input addresses
        });
        
        const outputs: TransactionOutput[] = rpcTx.vout.map((output: RPCTransactionOutput) => ({
          addresses: output.scriptPubKey.addresses?.[0] || 'unknown',
          amount: output.value
        }));
        
        const total = outputs.reduce((sum: number, output: TransactionOutput) => sum + output.amount, 0);
        
        return {
          txid: rpcTx.txid,
          vin: inputs,
          vout: outputs,
          total
        };
      })
    };
  } catch (error) {
    console.error('Error fetching block:', error);
    return null;
  }
}

// Add this function to your existing blockchain-api.ts file

export async function getTransaction(txid: string) {
  try {
    const mongo = await clientPromise;
    const db = mongo.db();
    
    // Get current height directly from blocks collection instead of stats
    const highestBlockResult = await db.collection('blocks')
      .find({})
      .sort({ height: -1 })
      .limit(1)
      .toArray();
        
    const currentHeight = highestBlockResult?.[0]?.height || 0;
    
    // Try to get transaction from database first
    const tx = await db.collection('txs').findOne({ txid });
    
    if (tx) {
      // Calculate current confirmations based on the latest blockchain height
      const blockindex = Number(tx.blockindex); // Ensure it's a number
      const confirmations = blockindex ? (currentHeight - blockindex + 1) : 0;
      
      return {
        ...tx,
        confirmations: Math.max(confirmations, 0) // Ensure we never show negative confirmations
      };
    }
    
    // Fallback to RPC if not in database
    const txData = await client.getRawTransaction(txid, true);
    
    if (typeof txData === 'string') {
      return null;
    }
    
    // Format transaction data
    const inputs = await Promise.all(txData.vin.map(async (input) => {
      if (input.coinbase) {
        return { addresses: 'coinbase', amount: 0 };
      }
      
      try {
        if (input.txid && input.vout !== undefined) {
          const vinTx = await client.getRawTransaction(input.txid, true);
          
          if (typeof vinTx !== 'string' && 'vout' in vinTx) {
            const vinOut = vinTx.vout[input.vout];
            return {
              addresses: vinOut.scriptPubKey.addresses?.[0] || 'unknown',
              amount: Number(vinOut.value) || 0
            };
          }
        }
        return { addresses: 'unknown', amount: 0 };
      } catch (e) {
        console.error(`Error processing input for ${txid}:`, e);
        return { addresses: 'unknown', amount: 0 };
      }
    }));
    
    const outputs = txData.vout.map((output) => ({
      addresses: output.scriptPubKey.addresses?.[0] || 'unknown',
      amount: Number(output.value) || 0
    }));
    
    const total = outputs.reduce((sum, output) => sum + output.amount, 0);
    
    // Get block info if available
    let blockData = null;
    if (txData.blockhash) {
      blockData = await db.collection('blocks').findOne({ hash: txData.blockhash }) || 
                  await client.getBlock(txData.blockhash);
    }
    
    return {
      txid: txData.txid,
      blockindex: blockData?.height || 0,
      blockhash: txData.blockhash || '',
      timestamp: blockData?.time || txData.time || 0,
      vin: inputs,
      vout: outputs,
      total,
      confirmations: txData.confirmations || 0,
      size: txData.size || 0,
      version: txData.version || 0,
      locktime: txData.locktime || 0
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

// Update the getAddress function to consolidate duplicate transactions

export async function getAddress(address: string, options: {
  page?: number;
  limit?: number;
  filter?: 'all' | 'sent' | 'received';
  sort?: 'recent' | 'oldest' | 'highest' | 'lowest';
} = {}) {
  try {
    const mongo = await clientPromise;
    const db = mongo.db();
    
    // Default options
    const page = options.page || 1;
    const limit = options.limit || 25;
    const filter = options.filter || 'all';
    const sort = options.sort || 'recent';
    
    // Get address info from database
    const addressInfo = await db.collection('addresses').findOne({ a_id: address });
    
    if (!addressInfo) {
      return null;
    }
    
    // Build query for transactions
    const query: Record<string, unknown> = { a_id: address };
    
    // Apply filter
    if (filter === 'sent') {
      query.amount = { $lt: 0 };
    } else if (filter === 'received') {
      query.amount = { $gt: 0 };
    }
    
    // Get all transactions for this address
const allTxs = await db.collection('addresstxs')
  .find(query)
  .sort({ blockindex: -1 })
  .toArray() as unknown as AddressTx[];
    
    // Group transactions by txid and calculate total amount
    const groupedTxs = allTxs.reduce((acc: Record<string, GroupedAddressTx>, tx: AddressTx) => {
      const txid = tx.txid;
      
      if (!acc[txid]) {
        acc[txid] = {
          txid: txid,
          blockindex: tx.blockindex,
          amount: 0,
          time: 0,
          count: 0
        };
      }
      
      // Sum up amounts for the same transaction
      acc[txid].amount += Number(tx.amount || 0);
      acc[txid].count++;
      
      return acc;
    }, {});
    
    // Convert to array and sort
    const consolidatedTxs = Object.values(groupedTxs);
    
    // Determine sort order
    switch (sort) {
      case 'oldest':
        consolidatedTxs.sort((a: GroupedAddressTx, b: GroupedAddressTx) => a.blockindex - b.blockindex);
        break;
      case 'highest':
        consolidatedTxs.sort((a: GroupedAddressTx, b: GroupedAddressTx) => Math.abs(b.amount) - Math.abs(a.amount));
        break;
      case 'lowest':
        consolidatedTxs.sort((a: GroupedAddressTx, b: GroupedAddressTx) => Math.abs(a.amount) - Math.abs(b.amount));
        break;
      case 'recent':
      default:
        consolidatedTxs.sort((a: GroupedAddressTx, b: GroupedAddressTx) => b.blockindex - a.blockindex);
    }
    
    // Get total count for pagination
    const totalTxs = consolidatedTxs.length;
    const totalPages = Math.ceil(totalTxs / limit);
    
    // Apply pagination
    const paginatedTxs = consolidatedTxs.slice((page - 1) * limit, page * limit);
    
    // Get full transaction details for each transaction
    const txDetails = await Promise.all(
      paginatedTxs.map(async (tx: GroupedAddressTx) => {
        const fullTx = await db.collection('txs').findOne({ txid: tx.txid });
        return {
          ...tx,
          time: fullTx?.timestamp || 0,
        };
      })
    );
    
    return {
      address,
      balance: Number(addressInfo.balance || 0),
      received: Number(addressInfo.received || 0),
      sent: Number(addressInfo.sent || 0),
      txCount: totalTxs,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: totalTxs,
      },
      transactions: txDetails,
    };
  } catch (error) {
    console.error('Error fetching address:', error);
    return null;
  }
}

export async function getBlockchainStats(): Promise<BlockchainStats> {
  try {
    // Using type assertions to handle methods not in the type definitions
    const info = await client.getBlockchainInfo();
    
    // Use command() method for RPC calls not defined in the type definitions
    const networkHashPs = await client.command('getnetworkhashps') as number;
    
    // Try different methods to get coin supply
    let moneysupply = 0;
    try {
      // Method 1: From getinfo (if available)
      const coinInfo = await client.command('getinfo') as CoinInfo;
      moneysupply = coinInfo.moneysupply || 0;
      
      // If moneysupply is still 0, try alternatives
      if (moneysupply === 0) {
        // Method 2: Try a direct getsupply command (some chains support this)
        try {
          moneysupply = await client.command('getsupply') as number;
        } catch{
          // Method 3: Try getTxOutSetInfo for UTXO-based chains
          try {
            const utxoInfo = await client.command('gettxoutsetinfo') as UTXOSetInfo;
            moneysupply = utxoInfo.total_amount || 0;
          } catch {
            console.log("Could not get coin supply using alternative methods");
          }
        }
      }
    } catch (e) {
      console.error("Error getting coin supply:", e);
    }
    
    return {
      blocks: info.blocks,
      difficulty: info.difficulty,
      networkhashps: networkHashPs,
      moneysupply: moneysupply,
      chain: info.chain
    };
  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    // Return defaults if there's an error
    return {
      blocks: 0,
      difficulty: 0,
      networkhashps: 0,
      moneysupply: 0,
      chain: 'unknown'
    };
  }
}

// Add this function to export network information
export async function getNetworkInfo(): Promise<NetworkInfo> {
  try {
    // Use command() for RPC calls not defined in the type definitions
    const networkInfo = await client.command('getnetworkinfo') as NetworkInfo;
    return networkInfo;
  } catch (error) {
    console.error('Error fetching network info:', error);
    // Return defaults if there's an error
    return {
      version: 0,
      subversion: '',
      protocolversion: 0,
      connections: 0,
      networks: [],
      relayfee: 0,
      localaddresses: [],
      warnings: ''
    };
  }
}

// Add this function to your existing blockchain-api.ts file

export async function getBlockhashByHeight(height: number): Promise<string> {
  try {
    // First check if we have it in MongoDB
    const mongo = await clientPromise;
    const db = mongo.db();
    
    // Try to get from database first for faster response
    const block = await db.collection('blocks').findOne({ height });
    if (block && block.hash) {
      return block.hash;
    }
    
    // Fallback to RPC call if not found in database
    const blockHash = await client.getBlockHash(height);
    return blockHash;
  } catch (error) {
    console.error(`Error fetching block hash for height ${height}:`, error);
    throw new Error(`Failed to get block hash for height ${height}`);
  }
}

// Add this function to your existing blockchain-api.ts file

export async function getBlockByHash(hash: string) {
  try {
    const mongo = await clientPromise;
    const db = mongo.db();
    
    // Try to get block from database first
    const block = await db.collection('blocks').findOne({ hash });
    
    if (block) {
      // Get transactions for the block
      const transactions = await db.collection('txs')
        .find({ blockhash: block.hash })
        .sort({ _id: 1 })
        .limit(100) // Limit for performance, can paginate if needed
        .toArray();
      
      return {
        ...block,
        transactions
      };
    }
    
    // If not found in DB, try to get from node directly
    const blockData = await client.getBlock(hash, 2) as Block; // Verbose with tx data
    
    // Process and return block data - same formatting as in getBlock function
    return {
      hash: blockData.hash,
      height: blockData.height,
      confirmations: blockData.confirmations,
      size: blockData.size,
      timestamp: blockData.time,
      bits: blockData.bits,
      nonce: blockData.nonce,
      difficulty: blockData.difficulty,
      merkle: blockData.merkleroot,
      prev_hash: blockData.previousblockhash,
      next_hash: blockData.nextblockhash,
      txs: blockData.tx.map((tx) => typeof tx === 'string' ? tx : tx.txid),
      transactions: blockData.tx.map((tx): FormattedTransaction => {
        if (typeof tx === 'string') {
          return { txid: tx, vin: [], vout: [], total: 0 };
        }
        
        const rpcTx = tx as unknown as RPCTransaction;
        
        const inputs: TransactionInput[] = rpcTx.vin.map((input: RPCTransactionInput) => {
          if (input.coinbase) {
            return { addresses: 'coinbase', amount: 0 };
          }
          return { addresses: 'unknown', amount: 0 };
        });
        
        const outputs: TransactionOutput[] = rpcTx.vout.map((output: RPCTransactionOutput) => ({
          addresses: output.scriptPubKey.addresses?.[0] || 'unknown',
          amount: output.value
        }));
        
        const total = outputs.reduce((sum: number, output: TransactionOutput) => sum + output.amount, 0);
        
        return {
          txid: rpcTx.txid,
          vin: inputs,
          vout: outputs,
          total
        };
      })
    };
  } catch (error) {
    console.error(`Error fetching block by hash ${hash}:`, error);
    throw new Error(`Failed to get block for hash ${hash}`);
  }
}

// Add this function to your existing blockchain-api.ts file

export async function getRawTransaction(txid: string, decrypt: boolean = false) {
  try {
    const mongo = await clientPromise;
    const db = mongo.db();
    
    // Create a proper union type instead of any
    let txData: string | RPCTransaction;
    
    if (decrypt) {
      // Get decoded transaction (verbose=true)
      const rawResponse = await client.getRawTransaction(txid, true) as RPCTransaction;
      
      // Now TypeScript knows this is an object
      txData = rawResponse;
      
      // If found in database and it's a decrypt request, enhance with data from MongoDB
      const dbTx = await db.collection('txs').findOne({ txid });
      
      if (dbTx) {
        // Type assertion to allow modification
        const enhancedTxData = txData as RPCTransaction & { 
          confirmations?: number; 
          blockindex?: number;
        };
        
        // Safely add properties
        enhancedTxData.confirmations = dbTx.confirmations ?? enhancedTxData.confirmations ?? 0;
        enhancedTxData.blockindex = dbTx.blockindex ?? 0;
        
        return enhancedTxData;
      }
    } else {
      // Get raw hex data (verbose=false)
      txData = await client.getRawTransaction(txid, false) as string;
    }
    
    return txData;
  } catch (error) {
    console.error(`Error fetching raw transaction ${txid}:`, error);
    throw new Error(`Failed to get raw transaction for ${txid}`);
  }
}