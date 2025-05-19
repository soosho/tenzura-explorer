import BitcoinCore from 'bitcoin-core';

const client = new BitcoinCore({
  network: 'mainnet',
  host: process.env.WALLET_HOST || '127.0.0.1',
  port: Number(process.env.WALLET_PORT) || 19766,
  username: process.env.WALLET_USERNAME || 'imskaa',
  password: process.env.WALLET_PASSWORD || 'anakkeren123',
});

export async function getInfo() {
  try {
    return await client.getBlockchainInfo();
  } catch (error) {
    console.error('Error fetching blockchain info:', error);
    throw error;
  }
}

export async function getBlock(hashOrHeight: string | number) {
  try {
    // If height is provided, get block hash first
    const hash = typeof hashOrHeight === 'string' ? hashOrHeight : 
      await client.getBlockHash(hashOrHeight);
    
    // Now get the block with verbosity=2 (includes full tx data)
    return await client.getBlock(hash, 2);
  } catch (error) {
    console.error(`Error fetching block ${hashOrHeight}:`, error);
    throw error;
  }
}

export async function getTransaction(txid: string) {
  try {
    return await client.getRawTransaction(txid, true);
  } catch (error) {
    console.error(`Error fetching transaction ${txid}:`, error);
    throw error;
  }
}

export async function getNetworkInfo() {
  try {
    return await client.getNetworkInfo();
  } catch (error) {
    console.error('Error fetching network info:', error);
    throw error;
  }
}

export async function getPeerInfo() {
  try {
    return await client.getPeerInfo();
  } catch (error) {
    console.error('Error fetching peer info:', error);
    throw error;
  }
}

export default client;