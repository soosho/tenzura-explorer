import { MongoClient } from 'mongodb';
// Import punycode directly to provide the functionality that Node.js will no longer include internally
import 'punycode';

// Don't use a fallback that points to localhost
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

console.log('Connecting to MongoDB...');

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve connection during hot reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new connection
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export default clientPromise;