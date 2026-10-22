import { MongoClient, ServerApiVersion } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "planora_ai";

let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Please set it in your .env.local or environment secrets."
    );
  }

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  // In production mode, avoid global variable pollution while still caching the module-level promise
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDatabase(customDbName?: string) {
  const client = await getMongoClientPromise();
  return client.db(customDbName || dbName);
}
