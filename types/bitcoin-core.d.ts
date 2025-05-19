declare module 'bitcoin-core' {
  interface ClientConstructorOptions {
    network?: 'mainnet' | 'testnet' | 'regtest';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    ssl?: boolean;
    sslStrict?: boolean;
    timeout?: number;
    agentOptions?: {
      keepAlive?: boolean;
      keepAliveMsecs?: number;
      maxSockets?: number;
      timeout?: number;
    };
  }

  interface SoftFork {
    type: string;
    active: boolean;
    height?: number;
    bip9?: {
      status: string;
      bit: number;
      startTime: number;
      timeout: number;
    };
  }

  interface BlockchainInfo {
    chain: string;
    blocks: number;
    headers: number;
    bestblockhash: string;
    difficulty: number;
    mediantime: number;
    verificationprogress: number;
    chainwork: string;
    pruned: boolean;
    softforks: Record<string, SoftFork>;
    bip9_softforks: Record<string, {
      status: string;
      bit: number;
      startTime: number;
      timeout: number;
    }>;
  }

  interface Network {
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
    localservices: string;
    connections: number;
    networks: Network[];
    relayfee: number;
    incrementalfee: number;
    localaddresses: LocalAddress[];
    warnings: string;
  }

  interface Block {
    hash: string;
    confirmations: number;
    size: number;
    weight: number;
    height: number;
    version: number;
    versionHex: string;
    merkleroot: string;
    tx: string[] | Transaction[];
    time: number;
    mediantime: number;
    nonce: number;
    bits: string;
    difficulty: number;
    chainwork: string;
    previousblockhash: string;
    nextblockhash?: string;
  }

  interface Transaction {
    txid: string;
    hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    vin: TransactionInput[];
    vout: TransactionOutput[];
    hex: string;
    blockhash?: string;
    confirmations?: number;
    time?: number;
    blocktime?: number;
  }

  interface TransactionInput {
    txid?: string;
    vout?: number;
    scriptSig?: {
      asm: string;
      hex: string;
    };
    sequence: number;
    coinbase?: string;
    txinwitness?: string[];
  }

  interface TransactionOutput {
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

  interface PeerInfo {
    id: number;
    addr: string;
    addrbind: string;
    addrlocal: string;
    services: string;
    relaytxes: boolean;
    lastsend: number;
    lastrecv: number;
    bytessent: number;
    bytesrecv: number;
    conntime: number;
    timeoffset: number;
    pingtime: number;
    minping: number;
    version: number;
    subver: string;
    inbound: boolean;
    addnode: boolean;
    startingheight: number;
    banscore: number;
    synced_headers: number;
    synced_blocks: number;
    inflight: number[];
    whitelisted: boolean;
  }

  export default class Client {
    constructor(options?: ClientConstructorOptions);
    
    getBlockchainInfo(): Promise<BlockchainInfo>;
    getBlock(hash: string, verbosity?: number): Promise<Block>;
    getBlockHash(height: number): Promise<string>;
    getRawTransaction(txid: string, verbose?: boolean): Promise<Transaction | string>;
    getNetworkInfo(): Promise<NetworkInfo>;
    getPeerInfo(): Promise<PeerInfo[]>;
    
    command<T = unknown>(
      method: string,
      ...params: (string | number | boolean | null | Record<string, unknown>)[]
    ): Promise<T>;
    // Add other methods you need
  }
}