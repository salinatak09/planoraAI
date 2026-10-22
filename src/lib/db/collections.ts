import type { Collection, Db } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type {
  UserModel,
  EventModel,
  BudgetItemModel,
  TaskModel,
  VendorModel,
  EventVendorModel,
  IdeaModel,
  ConversationMessageModel,
} from "@/lib/types";

export const COLLECTIONS = {
  USERS: "users",
  EVENTS: "events",
  BUDGET_ITEMS: "budget_items",
  TASKS: "tasks",
  VENDORS: "vendors",
  EVENT_VENDORS: "event_vendors",
  IDEAS: "ideas",
  CONVERSATION_MESSAGES: "conversation_messages",
} as const;

export async function getUsersCollection(dbInstance?: Db): Promise<Collection<UserModel>> {
  const db = dbInstance || (await getDatabase());
  return db.collection<UserModel>(COLLECTIONS.USERS);
}

export async function getEventsCollection(dbInstance?: Db): Promise<Collection<EventModel>> {
  const db = dbInstance || (await getDatabase());
  return db.collection<EventModel>(COLLECTIONS.EVENTS);
}

export async function getBudgetItemsCollection(dbInstance?: Db): Promise<Collection<BudgetItemModel>> {
  const db = dbInstance || (await getDatabase());
  return db.collection<BudgetItemModel>(COLLECTIONS.BUDGET_ITEMS);
}

export async function getTasksCollection(dbInstance?: Db): Promise<Collection<TaskModel>> {
  const db = dbInstance || (await getDatabase());
  return db.collection<TaskModel>(COLLECTIONS.TASKS);
}

export async function getVendorsCollection(dbInstance?: Db): Promise<Collection<VendorModel>> {
  const db = dbInstance || (await getDatabase());
  return db.collection<VendorModel>(COLLECTIONS.VENDORS);
}

export async function getEventVendorsCollection(dbInstance?: Db): Promise<Collection<EventVendorModel>> {
  const db = dbInstance || (await getDatabase());
  return db.collection<EventVendorModel>(COLLECTIONS.EVENT_VENDORS);
}

export async function getIdeasCollection(dbInstance?: Db): Promise<Collection<IdeaModel>> {
  const db = dbInstance || (await getDatabase());
  return db.collection<IdeaModel>(COLLECTIONS.IDEAS);
}

export async function getConversationMessagesCollection(
  dbInstance?: Db
): Promise<Collection<ConversationMessageModel>> {
  const db = dbInstance || (await getDatabase());
  return db.collection<ConversationMessageModel>(COLLECTIONS.CONVERSATION_MESSAGES);
}

/**
 * Creates and verifies all mandatory indexes for query performance and data integrity.
 * This operation is idempotent and safe to run on startup or migration checks.
 */
export async function ensureDatabaseIndexes(): Promise<{ success: boolean; created: string[] }> {
  const db = await getDatabase();
  const created: string[] = [];

  // 1. Users collection
  const users = await getUsersCollection(db);
  await users.createIndex({ email: 1 }, { unique: true });
  created.push("users.email (unique)");

  // 2. Events collection (ownership and dates)
  const events = await getEventsCollection(db);
  await events.createIndex({ ownerId: 1, createdAt: -1 });
  await events.createIndex({ status: 1 });
  await events.createIndex({ date: 1 });
  created.push("events.ownerId+createdAt", "events.status", "events.date");

  // 3. Budget Items (event scoping & categories)
  const budget = await getBudgetItemsCollection(db);
  await budget.createIndex({ eventId: 1, ownerId: 1 });
  await budget.createIndex({ category: 1 });
  created.push("budget_items.eventId+ownerId", "budget_items.category");

  // 4. Tasks (event scoping, deadlines, priorities)
  const tasks = await getTasksCollection(db);
  await tasks.createIndex({ eventId: 1, ownerId: 1 });
  await tasks.createIndex({ eventId: 1, dueDate: 1 });
  await tasks.createIndex({ priority: 1, status: 1 });
  created.push("tasks.eventId+ownerId", "tasks.eventId+dueDate", "tasks.priority+status");

  // 5. Vendors (global directory or user scope)
  const vendors = await getVendorsCollection(db);
  await vendors.createIndex({ isShared: 1, category: 1 });
  await vendors.createIndex({ ownerId: 1 });
  created.push("vendors.isShared+category", "vendors.ownerId");

  // 6. Event Vendors (event-vendor associations)
  const eventVendors = await getEventVendorsCollection(db);
  await eventVendors.createIndex({ eventId: 1, vendorId: 1 }, { unique: true });
  await eventVendors.createIndex({ eventId: 1, ownerId: 1 });
  created.push("event_vendors.eventId+vendorId (unique)", "event_vendors.eventId+ownerId");

  // 7. Ideas (event scoping)
  const ideas = await getIdeasCollection(db);
  await ideas.createIndex({ eventId: 1, ownerId: 1 });
  await ideas.createIndex({ category: 1 });
  created.push("ideas.eventId+ownerId", "ideas.category");

  // 8. Conversation Messages (chat history by event)
  const messages = await getConversationMessagesCollection(db);
  await messages.createIndex({ eventId: 1, ownerId: 1, createdAt: 1 });
  created.push("conversation_messages.eventId+ownerId+createdAt");

  return { success: true, created };
}
