import 'dotenv/config';

import clientPromise from '../lib/mongodb';
import { Db } from 'mongodb';

async function initDb() {
  console.log('Initializing database collections and indexes...');
  
  try {
    // Debug the connection string
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get list of existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Initialize each required collection
    await initBlocksCollection(db, collectionNames);
    await initTransactionsCollection(db, collectionNames);
    await initAddressesCollection(db, collectionNames);
    await initAddressTxCollection(db, collectionNames);
    await initStatsCollection(db, collectionNames);
    await initRichlistCollection(db, collectionNames);
    await initPeersCollection(db, collectionNames);
    await initMarketsCollection(db, collectionNames);
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

async function initBlocksCollection(db: Db, existingCollections: string[]) {
  if (!existingCollections.includes('blocks')) {
    console.log('Creating blocks collection...');
    await db.createCollection('blocks');
  }
  
  console.log('Creating indexes for blocks collection...');
  await db.collection('blocks').createIndex({ height: -1 });
  await db.collection('blocks').createIndex({ hash: 1 }, { unique: true });
  await db.collection('blocks').createIndex({ timestamp: -1 });
}

async function initTransactionsCollection(db: Db, existingCollections: string[]) {
  if (!existingCollections.includes('txs')) {
    console.log('Creating transactions collection...');
    await db.createCollection('txs');
  }
  
  console.log('Creating indexes for transactions collection...');
  await db.collection('txs').createIndex({ txid: 1 }, { unique: true });
  await db.collection('txs').createIndex({ blockindex: 1 });
  await db.collection('txs').createIndex({ timestamp: -1 });
  // Index for searching transactions by address (used in address detail pages)
  await db.collection('txs').createIndex({ "vout.addresses": 1 });
  await db.collection('txs').createIndex({ "vin.addresses": 1 });
}

async function initAddressesCollection(db: Db, existingCollections: string[]) {
  if (!existingCollections.includes('addresses')) {
    console.log('Creating addresses collection...');
    await db.createCollection('addresses');
  }
  
  console.log('Creating indexes for addresses collection...');
  await db.collection('addresses').createIndex({ a_id: 1 }, { unique: true });
  await db.collection('addresses').createIndex({ balance: -1 });
  await db.collection('addresses').createIndex({ received: -1 });
}

async function initAddressTxCollection(db: Db, existingCollections: string[]) {
  if (!existingCollections.includes('addresstxs')) {
    console.log('Creating addresstxs collection...');
    await db.createCollection('addresstxs');
  }
  
  console.log('Creating indexes for addresstxs collection...');
  await db.collection('addresstxs').createIndex({ a_id: 1, blockindex: -1 });
  await db.collection('addresstxs').createIndex({ txid: 1 });
}

async function initStatsCollection(db: Db, existingCollections: string[]) {
  if (!existingCollections.includes('stats')) {
    console.log('Creating stats collection...');
    await db.createCollection('stats');
    
    // Insert initial stats document
    await db.collection('stats').insertOne({
      coin: process.env.NEXT_PUBLIC_COIN_SYMBOL,
      count: 0,
      last: 0,
      supply: 0,
      connections: 0,
      last_price: 0,
      difficulty: 0,
      hashrate: 0
    });
  }
}

async function initRichlistCollection(db: Db, existingCollections: string[]) {
  if (!existingCollections.includes('richlist')) {
    console.log('Creating richlist collection...');
    await db.createCollection('richlist');
    
    // Insert initial richlist document
    await db.collection('richlist').insertOne({
      coin: process.env.NEXT_PUBLIC_COIN_SYMBOL,
      received: [],
      balance: []
    });
  }
}

async function initPeersCollection(db: Db, existingCollections: string[]) {
  if (!existingCollections.includes('peers')) {
    console.log('Creating peers collection...');
    await db.createCollection('peers');
  }
  
  console.log('Creating indexes for peers collection...');
  await db.collection('peers').createIndex({ address: 1 }, { unique: true });
  await db.collection('peers').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Auto-expire after 24h
}

async function initMarketsCollection(db: Db, existingCollections: string[]) {
  if (!existingCollections.includes('markets')) {
    console.log('Creating markets collection...');
    await db.createCollection('markets');
  }
  
  console.log('Creating indexes for markets collection...');
  await db.collection('markets').createIndex({ market: 1 }, { unique: true });
  await db.collection('markets').createIndex({ "summary.last_price": 1 });
}

// Run the initialization
initDb()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });