import { ObjectId } from "mongodb";

/**
 * Checks whether a given value is a valid 24-character hexadecimal MongoDB ObjectId string or ObjectId instance.
 */
export function isValidObjectId(value: unknown): boolean {
  if (!value) return false;
  if (value instanceof ObjectId) return true;
  if (typeof value === "string") {
    return ObjectId.isValid(value) && new ObjectId(value).toString() === value;
  }
  return false;
}

/**
 * Safely converts a string or ObjectId to an ObjectId.
 * Throws a TypeError if the value is invalid.
 */
export function toObjectId(value: string | ObjectId): ObjectId {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  throw new TypeError(`Invalid MongoDB ObjectId provided: ${String(value)}`);
}

/**
 * Safely converts an optional string or ObjectId to an ObjectId or returns undefined.
 */
export function toOptionalObjectId(value?: string | ObjectId | null): ObjectId | undefined {
  if (!value) return undefined;
  try {
    return toObjectId(value);
  } catch {
    return undefined;
  }
}

/**
 * Serializes a MongoDB document or object for API responses.
 * Converts ObjectIds and Dates to strings, and maps _id to id as well.
 */
export function serializeDocument<T>(doc: T): Record<string, unknown> | T {
  if (doc === null || doc === undefined) {
    return doc;
  }

  if (doc instanceof ObjectId) {
    return doc.toString() as unknown as T;
  }

  if (doc instanceof Date) {
    return doc.toISOString() as unknown as T;
  }

  if (Array.isArray(doc)) {
    return doc.map((item) => serializeDocument(item)) as unknown as T;
  }

  if (typeof doc === "object") {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(doc)) {
      if (key === "_id" && (value instanceof ObjectId || typeof value === "string")) {
        serialized.id = value.toString();
        serialized._id = value.toString();
      } else {
        serialized[key] = serializeDocument(value);
      }
    }
    return serialized;
  }

  return doc;
}

/**
 * Serializes an array of MongoDB documents for API boundaries.
 */
export function serializeDocuments<T>(docs: T[]): Array<Record<string, unknown> | T> {
  return docs.map((d) => serializeDocument(d));
}
