import type { Collection } from "mongodb";
import { getDatabase } from "./client";
import type { EventDocument } from "@/lib/types";

export const COLLECTIONS = {
  EVENTS: "events",
  USERS: "users",
} as const;

export async function getEventsCollection(): Promise<Collection<EventDocument>> {
  const db = await getDatabase();
  return db.collection<EventDocument>(COLLECTIONS.EVENTS);
}
