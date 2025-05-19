import { ObjectId } from 'mongodb';

export interface Block {
  _id: ObjectId;
  hash: string;
  height: number;
  confirmations: number;
  size: number;
  bits: string;
  nonce: number;
  timestamp: number;
  txs: string[];
  difficulty: number;
  merkle: string;
  prev_hash: string;
  next_hash?: string;
  total: number;
}

export interface Transaction {
  _id: ObjectId;
  txid: string;
  blockindex: number;
  blockhash: string;
  timestamp: number;
  total: number;
  vout: TransactionOutput[];
  vin: TransactionInput[];
}

export interface TransactionOutput {
  addresses: string;
  amount: number;
}

export interface TransactionInput {
  addresses: string;
  amount: number;
}

export interface Address {
  _id: ObjectId;
  a_id: string;
  name?: string;
  balance: number;
  received: number;
  sent: number;
  txs?: string[];
}

export interface AddressTx {
  _id: ObjectId;
  a_id: string;
  blockindex: number;
  txid: string;
  amount: number;
}

export interface RichlistEntry {
  address: string;
  balance: number;
  received: number;
}

export interface Richlist {
  _id: ObjectId;
  coin: string;
  received: RichlistEntry[];
  balance: RichlistEntry[];
}

export interface Stats {
  _id: ObjectId;
  coin: string;
  count: number;
  last: number;
  supply: number;
  connections: number;
  last_price: number;
}

export interface Peers {
  _id: ObjectId;
  createdAt: Date;
  address: string;
  port: string;
  protocol: string;
  version: string;
  country: string;
  country_code: string;
}

export interface MarketSummary {
  last: number;
  high: number;
  low: number;
  volume: number;
  bid: number;
  ask: number;
  change: number;
  baseVolume?: number;
  quoteVolume?: number;
}

export interface ChartData {
  date: number;
  price: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total?: number;
}

export interface TradeHistoryEntry {
  timestamp: number;
  price: number;
  quantity: number;
  total: number;
  type: 'buy' | 'sell';
}

export interface Markets {
  _id: ObjectId;
  market: string;
  summary: MarketSummary;
  chartdata: ChartData[];
  buys: OrderBookEntry[];
  sells: OrderBookEntry[];
  history: TradeHistoryEntry[];
}

export interface HeavyVote {
  count: number;
  reward: number;
  vote: number;
}

export interface Heavy {
  _id: ObjectId;
  coin: string;
  lvote: number;
  reward: number;
  supply: number;
  cap: number;
  estnext: number;
  phase: string;
  maxvote: number;
  nextin: string;
  votes: HeavyVote[];
}