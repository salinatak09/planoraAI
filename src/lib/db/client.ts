/**
 * Compatibility re-export.
 * The primary MongoDB client is established in @/lib/mongodb.ts
 */
export {
  getMongoConfig,
  getMongoClientPromise,
  getDatabase,
  checkDatabaseHealth,
} from "@/lib/mongodb";
