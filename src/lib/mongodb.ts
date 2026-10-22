import { MongoClient, ServerApiVersion, Db } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Returns the sanitized database configuration from environment variables.
 * Fails with a descriptive server-side error if required variables are missing.
 * Never logs or exposes credentials.
 */
export function getMongoConfig(): { uri: string; dbName: string } {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "") {
    throw new Error(
      "[MongoDB Configuration Error]: MONGODB_URI is not defined. " +
      "Please set MONGODB_URI in your server environment or .env.local file. " +
      "Never commit actual connection strings into version control."
    );
  }

  // Support both MONGODB_DB (as requested in spec) and MONGODB_DB_NAME
  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "planora_ai";

  return { uri, dbName };
}

let clientPromise: Promise<MongoClient> | null = null;

/**
 * Connects to MongoDB Atlas using the official Node.js driver.
 * Reuses the connection across hot module reloads in development
 * and across serverless function invocations in production.
 */
export function getMongoClientPromise(): Promise<MongoClient> {
  const { uri } = getMongoConfig();

  if (process.env.NODE_ENV === "development") {
    // Preserve client connection across HMR cycles
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
      });
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  // In production / serverless environments, reuse the module-scoped promise
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 20,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });
    clientPromise = client.connect();
  }

  return clientPromise;
}

/**
 * Retrieves the MongoDB Database instance.
 */
export async function getDatabase(customDbName?: string): Promise<Db> {
  const client = await getMongoClientPromise();
  const { dbName } = getMongoConfig();
  return client.db(customDbName || dbName);
}

/**
 * Safe database health check that executes a ping command.
 * Never exposes credentials, usernames, or connection URIs in the result.
 */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  latencyMs: number;
  database: string;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const { dbName } = getMongoConfig();
    const db = await getDatabase();
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    return {
      ok: true,
      latencyMs,
      database: dbName,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Database ping failed";
    // Sanitize any accidental string containing mongodb credentials
    const sanitized = message.replace(/\/\/.*@/, "//***:***@");
    return {
      ok: false,
      latencyMs,
      database: process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "planora_ai",
      error: sanitized,
    };
  }
}
