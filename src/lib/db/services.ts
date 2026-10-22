import { ObjectId } from "mongodb";
import {
  getEventsCollection,
  getBudgetItemsCollection,
  getTasksCollection,
  getEventVendorsCollection,
  getIdeasCollection,
  getConversationMessagesCollection,
} from "./collections";
import { isValidObjectId, toObjectId } from "@/lib/utils/objectid";
import { PaginationParams, PaginatedResult, buildPaginatedResult } from "@/lib/utils/pagination";
import type {
  EventModel,
  BudgetItemModel,
  TaskModel,
  EventVendorModel,
  IdeaModel,
  ConversationMessageModel,
} from "@/lib/types";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized: You do not own or have permission to access this event resource") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class ResourceNotFoundError extends Error {
  constructor(message = "The requested event or resource was not found") {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

/**
 * Strictly verifies that the event exists and is owned by the authenticated ownerId.
 * Never trusts client assertions. Throws or returns authorization status.
 */
export async function verifyEventOwnership(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<EventModel> {
  if (!isValidObjectId(eventIdRaw)) {
    throw new TypeError(`Invalid event ID format: ${String(eventIdRaw)}`);
  }
  if (!isValidObjectId(ownerIdRaw)) {
    throw new TypeError(`Invalid owner ID format: ${String(ownerIdRaw)}`);
  }

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const events = await getEventsCollection();
  const event = await events.findOne({ _id: eventId });

  if (!event) {
    throw new ResourceNotFoundError(`Event ${eventId.toString()} not found`);
  }

  // Strict ownership matching: event.ownerId must equal authenticated ownerId
  const eventOwnerStr = event.ownerId.toString();
  const userOwnerStr = ownerId.toString();

  if (eventOwnerStr !== userOwnerStr) {
    throw new AuthorizationError(
      `Access denied: Event ${eventId.toString()} does not belong to user ${userOwnerStr}`
    );
  }

  return event;
}

/**
 * Checks event ownership non-throwingly, returning boolean.
 */
export async function isEventOwner(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<boolean> {
  try {
    await verifyEventOwnership(eventIdRaw, ownerIdRaw);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves paginated events belonging strictly to the authorized owner.
 */
export async function getEventsForOwner(
  ownerIdRaw: string | ObjectId,
  pagination: PaginationParams,
  filterStatus?: string
): Promise<PaginatedResult<EventModel>> {
  const ownerId = toObjectId(ownerIdRaw);
  const events = await getEventsCollection();

  const query: Record<string, unknown> = { ownerId };
  if (filterStatus && filterStatus !== "all") {
    query.status = filterStatus;
  }

  const [items, total] = await Promise.all([
    events.find(query).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).toArray(),
    events.countDocuments(query),
  ]);

  return buildPaginatedResult(items, total, pagination);
}

/**
 * Creates a new event with ownership derived exclusively from the authenticated session.
 */
export async function createEventRecord(
  ownerIdRaw: string | ObjectId,
  data: Omit<EventModel, "_id" | "ownerId" | "createdAt" | "updatedAt">
): Promise<EventModel> {
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const newEvent: EventModel = {
    ...data,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };

  const events = await getEventsCollection();
  const result = await events.insertOne(newEvent);
  return { ...newEvent, _id: result.insertedId };
}

/**
 * Retrieves budget items for an event after verifying ownership.
 */
export async function getEventBudgetItems(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<BudgetItemModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const budget = await getBudgetItemsCollection();
  return budget.find({ eventId, ownerId }).toArray();
}

/**
 * Adds a budget item to an event after verifying ownership.
 */
export async function createBudgetItemRecord(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  data: Omit<BudgetItemModel, "_id" | "eventId" | "ownerId" | "createdAt" | "updatedAt">
): Promise<BudgetItemModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const item: BudgetItemModel = {
    ...data,
    eventId,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };

  const budget = await getBudgetItemsCollection();
  const result = await budget.insertOne(item);
  return { ...item, _id: result.insertedId };
}

/**
 * Retrieves tasks for an event with pagination after verifying ownership.
 */
export async function getEventTasks(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  pagination: PaginationParams,
  filterPriority?: string
): Promise<PaginatedResult<TaskModel>> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const tasks = await getTasksCollection();
  const query: Record<string, unknown> = { eventId, ownerId };
  if (filterPriority && filterPriority !== "all") {
    query.priority = filterPriority;
  }

  const [items, total] = await Promise.all([
    tasks.find(query).sort({ dueDate: 1 }).skip(pagination.skip).limit(pagination.limit).toArray(),
    tasks.countDocuments(query),
  ]);

  return buildPaginatedResult(items, total, pagination);
}

/**
 * Adds a task to an event after verifying ownership.
 */
export async function createTaskRecord(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  data: Omit<TaskModel, "_id" | "eventId" | "ownerId" | "createdAt" | "updatedAt">
): Promise<TaskModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const task: TaskModel = {
    ...data,
    eventId,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };

  const tasks = await getTasksCollection();
  const result = await tasks.insertOne(task);
  return { ...task, _id: result.insertedId };
}

/**
 * Retrieves event vendors for an event after verifying ownership.
 */
export async function getEventVendors(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<EventVendorModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const collection = await getEventVendorsCollection();
  return collection.find({ eventId, ownerId }).toArray();
}

/**
 * Associates a vendor to an event after verifying ownership.
 */
export async function createEventVendorRecord(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  data: Omit<EventVendorModel, "_id" | "eventId" | "ownerId" | "createdAt" | "updatedAt">
): Promise<EventVendorModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const eventVendor: EventVendorModel = {
    ...data,
    eventId,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };

  const collection = await getEventVendorsCollection();
  const result = await collection.insertOne(eventVendor);
  return { ...eventVendor, _id: result.insertedId };
}

/**
 * Retrieves AI ideas for an event after verifying ownership.
 */
export async function getEventIdeas(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<IdeaModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const collection = await getIdeasCollection();
  return collection.find({ eventId, ownerId }).sort({ createdAt: -1 }).toArray();
}

/**
 * Stores an AI idea for an event after verifying ownership.
 */
export async function createIdeaRecord(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  data: Omit<IdeaModel, "_id" | "eventId" | "ownerId" | "createdAt">
): Promise<IdeaModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const idea: IdeaModel = {
    ...data,
    eventId,
    ownerId,
    createdAt: new Date(),
  };

  const collection = await getIdeasCollection();
  const result = await collection.insertOne(idea);
  return { ...idea, _id: result.insertedId };
}

/**
 * Retrieves conversation messages for an event after verifying ownership.
 */
export async function getConversationMessages(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<ConversationMessageModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const collection = await getConversationMessagesCollection();
  return collection.find({ eventId, ownerId }).sort({ createdAt: 1 }).toArray();
}

/**
 * Appends a conversation message to an event after verifying ownership.
 */
export async function appendConversationMessage(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  role: "user" | "assistant" | "system",
  content: string
): Promise<ConversationMessageModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const message: ConversationMessageModel = {
    eventId,
    ownerId,
    role,
    content,
    createdAt: new Date(),
  };

  const collection = await getConversationMessagesCollection();
  const result = await collection.insertOne(message);
  return { ...message, _id: result.insertedId };
}
