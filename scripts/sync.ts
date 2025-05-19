import 'dotenv/config';
import clientPromise from '../lib/mongodb';
import client from '../lib/blockchain';
import fs from 'fs';
import path from 'path';
import { Db } from 'mongodb';
import { Block as DBBlock, Transaction as DBTransaction, TransactionInput, TransactionOutput, RichlistEntry } from '../lib/models';
import { Block as RPCBlock, Transaction as RPCTransaction, TransactionOutput as RPCTransactionOutput } from 'bitcoin-core';

// Set default mode and database
let mode = 'update';
let database = 'index';

// Display usage and exit
function usage() {
  console.log('Usage: tsx scripts/sync.ts [database] [mode]');
  console.log('');
  console.log('database: (required)');
  console.log('index [mode] Main index: coin info/stats, transactions & addresses');
  console.log('market       Market data: summaries, orderbooks, trade history & chartdata');
  console.log('');
  console.log('mode: (required for index database only)');
  console.log('update       Updates index from last sync to current block');
  console.log('check        Checks index for (and adds) any missing transactions/addresses');
  console.log('reindex      Clears index then resyncs from genesis to current block');
  console.log('reindex-rich Clears richlist then recreates it (does not alter blocks/txs)');
  console.log('');
  console.log('notes:');
  console.log('* \'current block\' is the latest created block when script is executed.');
  console.log('* If check mode finds missing data(ignoring new data since last sync),');
  console.log('  update_timeout in .env is set too low.');
  process.exit(0);
}

// Process command line arguments
if (process.argv[2] === 'index') {
  if (process.argv.length < 4) {
    usage();
  } else {
    switch(process.argv[3]) {
      case 'update':
        mode = 'update';
        break;
      case 'check':
        mode = 'check';
        break;
      case 'reindex':
        mode = 'reindex';
        break;
      case 'reindex-rich':
        mode = 'reindex-rich';
        break;
      default:
        usage();
    }
  }
} else if (process.argv[2] === 'market') {
  database = 'market';
} else {
  usage();
}

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

// Lock file management
function createLock(cb: () => void) {
  if (database === 'index') {
    const fname = path.join(tmpDir, `${database}.pid`);
    fs.writeFile(fname, process.pid.toString(), (err) => {
      if (err) {
        console.log("Error: unable to create %s", fname);
        process.exit(1);
      } else {
        return cb();
      }
    });
  } else {
    return cb();
  }
}

function removeLock(cb: () => void) {
  if (database === 'index') {
    const fname = path.join(tmpDir, `${database}.pid`);
    fs.unlink(fname, (err) => {
      if (err) {
        console.log("unable to remove lock: %s", fname);
        process.exit(1);
      } else {
        return cb();
      }
    });
  } else {
    return cb();
  }
}

function isLocked(cb: (locked: boolean) => void) {
  if (database === 'index') {
    const fname = path.join(tmpDir, `${database}.pid`);
    fs.access(fname, fs.constants.F_OK, (err) => {
      return cb(!err);
    });
  } else {
    return cb(false);
  }
}

function exit() {
  removeLock(() => {
    process.exit(0);
  });
}

// Main sync functions
async function updateBlockchain(db: Db, startBlock: number, endBlock: number, timeout?: number): Promise<void> {
  console.log(`Updating blockchain data from block ${startBlock} to ${endBlock}`);
  
  // Process blocks in batches to avoid memory issues
  const BATCH_SIZE = 10;
  
  for (let height = startBlock; height <= endBlock; height += BATCH_SIZE) {
    const endHeight = Math.min(height + BATCH_SIZE - 1, endBlock);
    await syncBlockRange(db, height, endHeight);
    
    // Log progress for large syncs
    if (endBlock - startBlock > 100 && (height - startBlock) % 100 === 0) {
      const progress = ((height - startBlock) / (endBlock - startBlock) * 100).toFixed(2);
      console.log(`Sync progress: ${progress}% complete (block ${height}/${endBlock})`);
    }
    
    // Use the timeout parameter if provided (for slower sync modes)
    if (timeout && timeout > 0) {
      await new Promise(resolve => setTimeout(resolve, timeout));
    }
  }
  
  // Update stats after sync is complete
  await updateStats(db);
}

async function syncBlockRange(db: Db, startHeight: number, endHeight: number) {
  for (let height = startHeight; height <= endHeight; height++) {
    try {
      // Get block hash at current height
      const blockHash = await client.getBlockHash(height);
      
      // Check if the block already exists in the database
      const existingBlock = await db.collection('blocks').findOne({ hash: blockHash });
      if (existingBlock) {
        if (mode === 'check') {
          console.log(`Block ${height} already exists, checking transactions...`);
          // For check mode, we would validate all transactions here
          await verifyBlockTransactions(db, height, blockHash);
        } else {
          console.log(`Block ${height} already exists, skipping...`);
          continue;
        }
      } else {
        console.log(`Processing block ${height} (${blockHash})...`);
        
        // Get full block data with transactions
        const block = await client.getBlock(blockHash, 2); // 2 for verbose tx data
        
        await processBlock(db, block);
      }
    } catch (error) {
      console.error(`Error processing block at height ${height}:`, error);
      throw error;
    }
  }
}

// Type for input addresses with amounts
interface InputAddressAmount {
  addresses: string;
  amount: number;
  error?: string;
}

// Type for output addresses with amounts
interface OutputAddressAmount {
  addresses: string;
  amount: number;
}

// Implementation of the block processing logic
async function processBlock(db: Db, block: RPCBlock): Promise<void> {
  // Calculate total value in the block
  let blockTotal = 0;
  const txids: string[] = [];
  
  // Process transactions
  for (const tx of block.tx) {
    if (typeof tx === 'string') {
      txids.push(tx);
      // Fetch the transaction if we only have the ID
      const fullTx = await client.getRawTransaction(tx, true);
      if (typeof fullTx !== 'string') {
        await processTransaction(db, fullTx as RPCTransaction, block);
        // Add to block total
        const txTotal = fullTx.vout.reduce((sum: number, vout: RPCTransactionOutput) => 
          sum + Number(vout.value), 0);
        blockTotal += txTotal;
      }
    } else {
      txids.push(tx.txid);
      // Calculate transaction total
      const txTotal = tx.vout.reduce((sum: number, vout: RPCTransactionOutput) => 
        sum + Number(vout.value), 0);
      blockTotal += txTotal;
      
      await processTransaction(db, tx, block);
    }
  }
  
  // Insert block to the database
  await db.collection<DBBlock>('blocks').insertOne({
    hash: block.hash,
    height: block.height,
    confirmations: block.confirmations,
    size: block.size,
    bits: block.bits,
    nonce: block.nonce,
    timestamp: block.time,
    difficulty: block.difficulty,
    merkle: block.merkleroot,
    prev_hash: block.previousblockhash,
    next_hash: block.nextblockhash,
    txs: txids,
    total: blockTotal
  } as DBBlock);
}

// Updated processTransaction function
async function processTransaction(db: Db, tx: RPCTransaction, block: RPCBlock): Promise<void> {
  // Skip if transaction already exists
  const existingTx = await db.collection<DBTransaction>('txs').findOne({ txid: tx.txid });
  if (existingTx) {
    console.log(`Transaction ${tx.txid} already exists, skipping...`);
    return;
  }
  
  // Process inputs and outputs for addresses
  // Process inputs sequentially to prevent silent failures
  const inputs: InputAddressAmount[] = [];
  // Remove unused inputTotal variable

  for (const vin of tx.vin) {
    if (vin.coinbase) {
      inputs.push({ addresses: 'coinbase', amount: 0 });
      continue;
    }

    try {
      if (vin.txid && vin.vout !== undefined) {
        const vinTx = await client.getRawTransaction(vin.txid, true);

        if (typeof vinTx !== 'string' && 'vout' in vinTx) {
          const vinOut = vinTx.vout[vin.vout];
          const address = vinOut.scriptPubKey.addresses?.[0] || 'unknown';
          const amount = Number(vinOut.value) || 0;

          inputs.push({
            addresses: address,
            amount: amount
          });

          // remove unused inputTotal assignment
        }
      }
    } catch (e) {
          console.error(`Error processing input for tx ${tx.txid}, input ${vin.txid}:${vin.vout}:`, e);
          // Still add the input, but mark it as having an error
          inputs.push({ 
            addresses: 'error', 
            amount: 0,
            error: `Failed to retrieve input: ${(e as Error).message}`
          });
        }
  }
  
  const outputs: OutputAddressAmount[] = tx.vout
    .filter(vout => {
      // Filter out OP_RETURN/nulldata outputs with zero value
      if (vout.value === 0 && vout.scriptPubKey && 
          (vout.scriptPubKey.type === 'nulldata' || 
           vout.scriptPubKey.asm?.startsWith('OP_RETURN'))) {
        return false;
      }
      return true;
    })
    .map((vout: RPCTransactionOutput) => ({
      addresses: vout.scriptPubKey.addresses?.[0] || 'unknown',
      amount: Number(vout.value)  // Ensure numeric
    }));

  // Calculate transaction total properly from vout directly
  // We need to use vout directly from the RPC response as those values are correct
  const total = tx.vout.reduce((sum: number, vout: RPCTransactionOutput) => {
    // Only count value from non-nulldata outputs
    if (vout.value > 0 && 
        (!vout.scriptPubKey.type || vout.scriptPubKey.type !== 'nulldata')) {
      return sum + Number(vout.value);
    }
    return sum;
  }, 0);
  
  // Insert transaction with the correct total
  await db.collection<DBTransaction>('txs').insertOne({
    txid: tx.txid,
    blockindex: block.height,
    blockhash: block.hash,
    timestamp: block.time,
    total,  // This is now calculated correctly
    vin: inputs as TransactionInput[],
    vout: outputs as TransactionOutput[]
  } as DBTransaction);
  
  // Update address balances and transactions
  await updateAddressesFromTx(db, tx.txid, inputs, outputs, block.height);
}

// Update address balances from transaction
async function updateAddressesFromTx(
  db: Db, 
  txid: string, 
  inputs: InputAddressAmount[], 
  outputs: OutputAddressAmount[], 
  blockHeight: number
): Promise<void> {
  // Track addresses affected by this transaction
  const addressImpacts: Record<string, { sent: number, received: number }> = {};
  
  // Track outputs (money received)
  for (const output of outputs) {
    if (output.addresses === 'unknown') continue;
    
    const amount = Number(output.amount);
    if (isNaN(amount) || amount <= 0) continue;
    
    // Initialize if needed
    if (!addressImpacts[output.addresses]) {
      addressImpacts[output.addresses] = { sent: 0, received: 0 };
    }
    
    // Add to received amount
    addressImpacts[output.addresses].received += amount;
    
    // Add a transaction record for this output (received)
    await db.collection('addresstxs').insertOne({
      a_id: output.addresses,
      txid: txid,
      blockindex: blockHeight,
      amount: amount, // Positive amount for received
      type: 'vout'
    });
  }
  
  // Track inputs (money spent)
  for (const input of inputs) {
    if (input.addresses === 'coinbase' || input.addresses === 'unknown') continue;
    
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) continue;
    
    // Initialize if needed
    if (!addressImpacts[input.addresses]) {
      addressImpacts[input.addresses] = { sent: 0, received: 0 };
    }
    
    // Add to sent amount
    addressImpacts[input.addresses].sent += amount;
    
    // Add a transaction record for this input (sent)
    await db.collection('addresstxs').insertOne({
      a_id: input.addresses,
      txid: txid,
      blockindex: blockHeight,
      amount: -amount, // Negative amount for sent
      type: 'vin'
    });
  }
  
  // Now update address balances
  for (const [address, impact] of Object.entries(addressImpacts)) {
    const netAmount = impact.received - impact.sent;
    
    // Update address document
    await db.collection('addresses').updateOne(
      { a_id: address },
      {
        $inc: { 
          balance: netAmount,
          received: impact.received,
          sent: impact.sent
        },
        $push: { txs: txid },
        $setOnInsert: { a_id: address }
      },
      { upsert: true }
    );
  }
}

// Verify transactions in a block (for check mode)
async function verifyBlockTransactions(db: Db, height: number, blockHash: string): Promise<void> {
  const block = await client.getBlock(blockHash, 2) as RPCBlock;
  const txids = block.tx.map((tx) => typeof tx === 'string' ? tx : tx.txid);
  
  // Find missing transactions
  const existingTxs = await db.collection<DBTransaction>('txs')
    .find({ blockhash: blockHash })
    .project<{ txid: string }>({ txid: 1 })
    .toArray();
    
  const existingTxIds = existingTxs.map(tx => tx.txid);
  const missingTxIds = txids.filter(id => !existingTxIds.includes(id));
  
  if (missingTxIds.length > 0) {
    console.log(`Found ${missingTxIds.length} missing transactions in block ${height}`);
    
    for (const txid of missingTxIds) {
      console.log(`Adding missing transaction ${txid}`);
      const tx = await client.getRawTransaction(txid, true);
      if (typeof tx !== 'string') {
        await processTransaction(db, tx as RPCTransaction, block);
      }
    }
  }
}

// Update the richlist
async function updateRichlist(db: Db): Promise<void> {
  console.log('Updating richlist...');
  
  type AddressWithBalance = {
    a_id: string;
    balance: number;
    received: number;
  };
  
  // Get top 100 addresses by balance
  const topBalance = await db.collection<AddressWithBalance>('addresses')
    .find({})
    .sort({ balance: -1 })
    .limit(100)
    .toArray();
  
  // Get top 100 addresses by received amount
  const topReceived = await db.collection<AddressWithBalance>('addresses')
    .find({})
    .sort({ received: -1 })
    .limit(100)
    .toArray();
  
  // Format the richlist entries
  const balanceList: RichlistEntry[] = topBalance.map(addr => ({
    address: addr.a_id,
    balance: addr.balance,
    received: addr.received
  }));
  
  const receivedList: RichlistEntry[] = topReceived.map(addr => ({
    address: addr.a_id,
    balance: addr.balance,
    received: addr.received
  }));
  
  // Update richlist in database
  await db.collection('richlist').updateOne(
    { coin: process.env.NEXT_PUBLIC_COIN_SYMBOL },
    {
      $set: {
        balance: balanceList,
        received: receivedList
      },
      $setOnInsert: { coin: process.env.NEXT_PUBLIC_COIN_SYMBOL }
    },
    { upsert: true }
  );
  
  console.log('Richlist updated successfully');
}

// Update stats collection
async function updateStats(db: Db) {
  console.log('Updating blockchain statistics...');
  
  // Get blockchain info
  const blockchainInfo = await client.getBlockchainInfo();
  
  // Get network info for connections
  const networkInfo = await client.getNetworkInfo();
  
  // Calculate total supply
  let supply = 0;
  try {
    // Try to get supply from wallet if method exists
    const supplyInfo = await client.command('getsupply');
    if (typeof supplyInfo === 'number') {
      supply = supplyInfo;
    } else {
      // Fallback calculation
      supply = await calculateSupplyFromBlocks(db);
    }
  } catch {
    // Method doesn't exist, use our calculation
    supply = await calculateSupplyFromBlocks(db);
  }
  
  // Update stats in database
  await db.collection('stats').updateOne(
    { coin: process.env.NEXT_PUBLIC_COIN_SYMBOL },
    {
      $set: {
        coin: process.env.NEXT_PUBLIC_COIN_SYMBOL,
        count: blockchainInfo.blocks,
        last: blockchainInfo.blocks,
        supply,
        connections: networkInfo.connections,
        difficulty: blockchainInfo.difficulty,
        hashrate: calculateHashrate(blockchainInfo.difficulty)
      }
    },
    { upsert: true }
  );
  
  console.log('Stats updated successfully');
}

// Calculate supply from coinbase transactions
async function calculateSupplyFromBlocks(db: Db): Promise<number> {
  try {
    // Sum all coinbase outputs (block rewards)
    const result = await db.collection('txs').aggregate([
      {
        $match: {
          'vin.addresses': 'coinbase'
        }
      },
      {
        $group: {
          _id: null,
          totalSupply: { $sum: '$total' }
        }
      }
    ]).toArray();
    
    return result.length > 0 ? result[0].totalSupply : 0;
  } catch (error) {
    console.error('Error calculating supply:', error);
    return 0;
  }
}

// Calculate hashrate from difficulty
function calculateHashrate(difficulty: number): number {
  // Adjust for your coin's target block time
  const blockTime = 60; // Default 60 seconds
  return difficulty * Math.pow(2, 32) / blockTime;
}

// Check if another instance is already running
isLocked(async (locked) => {
  if (locked) {
    console.log("Script already running..");
    process.exit(0);
  } else {
    createLock(async () => {
      console.log("Script launched with pid:", process.pid);
      
      try {
        const mongoClient = await clientPromise;
        const db = mongoClient.db();
        
        // Check if stats collection exists
        const statsCheck = await db.collection('stats').findOne({ coin: process.env.NEXT_PUBLIC_COIN_SYMBOL });
        
        if (!statsCheck && database === 'index') {
          console.log('Stats collection not found. Run init-db script first.');
          exit();
        } else if (database === 'index') {
          // Get current stats
          const stats = await db.collection('stats').findOne({ coin: process.env.NEXT_PUBLIC_COIN_SYMBOL });
          
          // Get latest block height from blockchain
          const blockchainInfo = await client.getBlockchainInfo();
          const latestHeight = blockchainInfo.blocks;
          
          if (mode === 'reindex') {
            console.log('Performing full reindex...');
            
            // Clear existing data
            await db.collection('txs').deleteMany({});
            console.log('Transactions cleared');
            
            await db.collection('addresses').deleteMany({});
            console.log('Addresses cleared');
            
            await db.collection('addresstxs').deleteMany({});
            console.log('Address transactions cleared');
            
            await db.collection('blocks').deleteMany({});
            console.log('Blocks cleared');
            
            await db.collection('richlist').updateOne(
              { coin: process.env.NEXT_PUBLIC_COIN_SYMBOL },
              { $set: { received: [], balance: [] } },
              { upsert: true }
            );
            
            await db.collection('stats').updateOne(
              { coin: process.env.NEXT_PUBLIC_COIN_SYMBOL },
              { $set: { last: 0, count: 0, supply: 0 } }
            );
            
            console.log('Index cleared (reindex)');
            
            // Sync from genesis to current block
            await updateBlockchain(db, 1, latestHeight);
            await updateRichlist(db);
            
            const newStats = await db.collection('stats').findOne({ coin: process.env.NEXT_PUBLIC_COIN_SYMBOL });
            console.log(`Reindex complete (block: ${newStats?.last})`);
          } else if (mode === 'check') {
            // Check all blocks
            await updateBlockchain(db, 1, latestHeight, 1000); // Longer timeout for checks
            
            const newStats = await db.collection('stats').findOne({ coin: process.env.NEXT_PUBLIC_COIN_SYMBOL });
            console.log(`Check complete (block: ${newStats?.last})`);
          } else if (mode === 'update') {
            // Update from last synced to current block
            const lastBlock = stats?.last || 0;
            await updateBlockchain(db, lastBlock + 1, latestHeight);
            await updateRichlist(db);
            
            const newStats = await db.collection('stats').findOne({ coin: process.env.NEXT_PUBLIC_COIN_SYMBOL });
            console.log(`Update complete (block: ${newStats?.last})`);
          } else if (mode === 'reindex-rich') {
            console.log('Reindexing richlist...');
            
            // Clear existing richlist
            await db.collection('richlist').updateOne(
              { coin: process.env.NEXT_PUBLIC_COIN_SYMBOL },
              { $set: { received: [], balance: [] } },
              { upsert: true }
            );
            
            // Update richlist
            await updateRichlist(db);
            console.log('Richlist reindexed successfully');
          }
        } else if (database === 'market') {
          console.log('Updating market data...');
          // Market update logic would go here
          
          console.log('Market update complete');
        }
        
        exit();
      } catch (error) {
        console.error('Error during sync:', error);
        exit();
      }
    });
  }
});