import { ObjectId } from "mongodb";
import {
  getEventsCollection,
  getBudgetItemsCollection,
  getTasksCollection,
  getVendorsCollection,
  getEventVendorsCollection,
  getIdeasCollection,
  getConversationMessagesCollection,
  getChangeLogsCollection,
} from "./collections";
import { isValidObjectId, toObjectId } from "@/lib/utils/objectid";
import { PaginationParams, PaginatedResult, buildPaginatedResult } from "@/lib/utils/pagination";
import type {
  EventModel,
  BudgetItemModel,
  TaskModel,
  VendorModel,
  EventVendorModel,
  IdeaModel,
  ConversationMessageModel,
  ActionProposal,
  EventChangeLogModel,
  BookingStatus,
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

export class ConcurrencyError extends Error {
  constructor(message = "Concurrency conflict: This event was modified by another operation. Please regenerate change impact.") {
    super(message);
    this.name = "ConcurrencyError";
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
    version: 1,
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
 * Updates a budget item record after strictly verifying ownership and event association.
 */
export async function updateBudgetItemRecord(
  itemIdRaw: string | ObjectId,
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  updates: Partial<Omit<BudgetItemModel, "_id" | "eventId" | "ownerId" | "createdAt">>
): Promise<BudgetItemModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  if (!isValidObjectId(itemIdRaw)) {
    throw new TypeError(`Invalid budget item ID format: ${String(itemIdRaw)}`);
  }

  const itemId = toObjectId(itemIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const updateFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (updates.category !== undefined) updateFields.category = updates.category;
  if (updates.description !== undefined) updateFields.description = updates.description;
  if (updates.estimatedAmount !== undefined) updateFields.estimatedAmount = Number(updates.estimatedAmount);
  if (updates.actualAmount !== undefined) updateFields.actualAmount = Number(updates.actualAmount);
  if (updates.paymentStatus !== undefined) updateFields.paymentStatus = updates.paymentStatus;
  if (updates.notes !== undefined) updateFields.notes = updates.notes;
  if (updates.isContingency !== undefined) updateFields.isContingency = Boolean(updates.isContingency);

  const budget = await getBudgetItemsCollection();
  const result = await budget.updateOne(
    { _id: itemId, eventId, ownerId },
    { $set: updateFields }
  );

  if (result.matchedCount === 0) {
    throw new ResourceNotFoundError("Budget item not found or you do not have permission to edit it");
  }

  const updated = await budget.findOne({ _id: itemId, eventId, ownerId });
  if (!updated) {
    throw new ResourceNotFoundError("Budget item not found after update");
  }
  return updated;
}

/**
 * Deletes a single budget item record after strictly verifying ownership.
 */
export async function deleteBudgetItemRecord(
  itemIdRaw: string | ObjectId,
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<boolean> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  if (!isValidObjectId(itemIdRaw)) {
    throw new TypeError(`Invalid budget item ID format: ${String(itemIdRaw)}`);
  }

  const itemId = toObjectId(itemIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const budget = await getBudgetItemsCollection();
  const result = await budget.deleteOne({ _id: itemId, eventId, ownerId });

  if (result.deletedCount === 0) {
    throw new ResourceNotFoundError("Budget item not found or you do not have permission to delete it");
  }

  return true;
}

/**
 * Inserts multiple budget items in batch for an event (e.g. from AI template generation).
 */
export async function bulkCreateBudgetItems(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  items: Array<Omit<BudgetItemModel, "_id" | "eventId" | "ownerId" | "createdAt" | "updatedAt">>
): Promise<BudgetItemModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  if (!items.length) return [];

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const preparedItems: BudgetItemModel[] = items.map((it) => ({
    ...it,
    eventId,
    ownerId,
    createdAt: now,
    updatedAt: now,
  }));

  const budget = await getBudgetItemsCollection();
  const result = await budget.insertMany(preparedItems);

  return preparedItems.map((item, idx) => ({
    ...item,
    _id: result.insertedIds[idx],
  }));
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
 * Retrieves all tasks for an event without pagination slicing, sorted by due date.
 */
export async function getEventTasksList(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  filterStatus?: string,
  filterPriority?: string
): Promise<TaskModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const tasks = await getTasksCollection();
  const query: Record<string, unknown> = { eventId, ownerId };
  if (filterStatus && filterStatus !== "all") {
    query.status = filterStatus;
  }
  if (filterPriority && filterPriority !== "all") {
    query.priority = filterPriority;
  }

  return tasks.find(query).sort({ dueDate: 1 }).toArray();
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
 * Updates a task record after verifying ownership.
 */
export async function updateTaskRecord(
  taskIdRaw: string | ObjectId,
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  updates: Partial<Omit<TaskModel, "_id" | "eventId" | "ownerId" | "createdAt">>
): Promise<TaskModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  if (!isValidObjectId(taskIdRaw)) {
    throw new TypeError(`Invalid task ID format: ${String(taskIdRaw)}`);
  }

  const taskId = toObjectId(taskIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const updateFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (updates.title !== undefined) updateFields.title = updates.title;
  if (updates.description !== undefined) updateFields.description = updates.description;
  if (updates.dueDate !== undefined) updateFields.dueDate = updates.dueDate;
  if (updates.priority !== undefined) updateFields.priority = updates.priority;
  if (updates.status !== undefined) updateFields.status = updates.status;
  if (updates.assignedTo !== undefined) updateFields.assignedTo = updates.assignedTo;
  if (updates.category !== undefined) updateFields.category = updates.category;

  const tasks = await getTasksCollection();
  const result = await tasks.updateOne({ _id: taskId, eventId, ownerId }, { $set: updateFields });

  if (result.matchedCount === 0) {
    throw new ResourceNotFoundError("Task not found or you do not have permission to edit it");
  }

  const updated = await tasks.findOne({ _id: taskId, eventId, ownerId });
  if (!updated) {
    throw new ResourceNotFoundError("Task not found after update");
  }
  return updated;
}

/**
 * Deletes a task record after verifying ownership.
 */
export async function deleteTaskRecord(
  taskIdRaw: string | ObjectId,
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<boolean> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  if (!isValidObjectId(taskIdRaw)) {
    throw new TypeError(`Invalid task ID format: ${String(taskIdRaw)}`);
  }

  const taskId = toObjectId(taskIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const tasks = await getTasksCollection();
  const result = await tasks.deleteOne({ _id: taskId, eventId, ownerId });

  if (result.deletedCount === 0) {
    throw new ResourceNotFoundError("Task not found or you do not have permission to delete it");
  }

  return true;
}

/**
 * Bulk creates tasks for an event (e.g. from generated checklist).
 */
export async function bulkCreateTasks(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  items: Array<Omit<TaskModel, "_id" | "eventId" | "ownerId" | "createdAt" | "updatedAt">>
): Promise<TaskModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  if (!items.length) return [];

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const prepared: TaskModel[] = items.map((it) => ({
    ...it,
    eventId,
    ownerId,
    createdAt: now,
    updatedAt: now,
  }));

  const tasks = await getTasksCollection();
  const result = await tasks.insertMany(prepared);

  return prepared.map((item, idx) => ({
    ...item,
    _id: result.insertedIds[idx],
  }));
}

/**
 * Seeds initial high-quality sample vendor directory listings if no shared vendors exist.
 * Clearly tagged with isSampleData: true so manual vendors are never confused with listings.
 */
export async function seedInitialVendorDirectoryIfEmpty(): Promise<void> {
  const vendors = await getVendorsCollection();
  const count = await vendors.countDocuments({ isShared: true });
  if (count > 0) return;

  const sampleVendors: Omit<VendorModel, "_id">[] = [
    {
      ownerId: null,
      isShared: true,
      name: "Wildflower Botanical Studio",
      category: "florals",
      location: "Jaipur, Rajasthan",
      contact: {
        name: "Ananya Deshmukh",
        email: "sample.ananya@wildflowerstudio.demo",
        phone: "+91 98201 00001",
        website: "https://example.com/wildflower",
      },
      priceRange: "$$$",
      verificationStatus: "preferred",
      serviceDescription: "Royal jasmine arches, fresh marigold chandeliers, and brass floral staging.",
      isSampleData: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      ownerId: null,
      isShared: true,
      name: "Royal Saffron Heritage Banquets",
      category: "catering",
      location: "Jaipur, Rajasthan",
      contact: {
        name: "Chef Ranveer Rathore",
        email: "sample.chef@royalsaffron.demo",
        phone: "+91 98450 00002",
        website: "https://example.com/royalsaffron",
      },
      priceRange: "$$$$",
      verificationStatus: "verified",
      serviceDescription: "Authentic multi-course Rajasthani feasts, live artisanal chaat counters, and bespoke mocktails.",
      isSampleData: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      ownerId: null,
      isShared: true,
      name: "Stories by Joseph Radhik",
      category: "photography",
      location: "Mumbai & Pan-India",
      contact: {
        name: "Studio Desk",
        email: "sample.desk@stories.demo",
        phone: "+91 99203 00003",
        website: "https://example.com/stories",
      },
      priceRange: "$$$$",
      verificationStatus: "preferred",
      serviceDescription: "Master couple portraiture, 4K aerial cinematography, and handcrafted heirloom albums.",
      isSampleData: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      ownerId: null,
      isShared: true,
      name: "Sangeet Brass & Sufi Ensemble",
      category: "music",
      location: "Jaipur & Delhi NCR",
      contact: {
        name: "Vikram Sen",
        email: "sample.vikram@sangeetbrass.demo",
        phone: "+91 98112 00004",
      },
      priceRange: "$$",
      verificationStatus: "verified",
      serviceDescription: "Traditional Manganiyar folk artists, 12-piece brass processional band, and sunset acoustic setup.",
      isSampleData: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      ownerId: null,
      isShared: true,
      name: "Maharaja Heritage Palace Staging",
      category: "venue",
      location: "Jaipur, Rajasthan",
      contact: {
        name: "Heritage Staging Office",
        email: "sample.palace@jaipurheritage.demo",
        phone: "+91 98290 00005",
      },
      priceRange: "$$$$",
      verificationStatus: "preferred",
      serviceDescription: "Palace courtyard, architectural illumination, backup generators, and royal lawn staging.",
      isSampleData: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      ownerId: null,
      isShared: true,
      name: "Luxe Amber Decor & Lightcraft",
      category: "decor",
      location: "Jaipur, Rajasthan",
      contact: {
        name: "Pooja Malhotra",
        email: "sample.pooja@luxeamber.demo",
        phone: "+91 98710 00006",
      },
      priceRange: "$$$",
      verificationStatus: "verified",
      serviceDescription: "Warm candlelit tablescapes, architectural facade lighting, and custom royal drapes.",
      isSampleData: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await vendors.insertMany(sampleVendors);
}

/**
 * Retrieves the vendor directory (shared directory plus user's custom created vendors).
 */
export async function getVendorDirectory(
  ownerIdRaw?: string | ObjectId,
  filterCategory?: string,
  filterLocation?: string,
  filterPriceRange?: string
): Promise<VendorModel[]> {
  await seedInitialVendorDirectoryIfEmpty();
  const vendors = await getVendorsCollection();

  const query: Record<string, unknown> = {};

  if (ownerIdRaw && isValidObjectId(ownerIdRaw)) {
    const ownerId = toObjectId(ownerIdRaw);
    query.$or = [{ isShared: true }, { ownerId }];
  } else {
    query.isShared = true;
  }

  if (filterCategory && filterCategory !== "all") {
    query.category = filterCategory;
  }
  if (filterLocation && filterLocation.trim()) {
    query.location = { $regex: filterLocation.trim(), $options: "i" };
  }
  if (filterPriceRange && filterPriceRange !== "all") {
    query.priceRange = filterPriceRange;
  }

  return vendors.find(query).sort({ verificationStatus: 1, name: 1 }).toArray();
}

/**
 * Creates a custom vendor record in the directory.
 * Explicitly distinguishes manually entered vendors with verificationStatus="unverified".
 */
export async function createVendorRecord(
  ownerIdRaw: string | ObjectId,
  data: Omit<VendorModel, "_id" | "ownerId" | "createdAt" | "updatedAt">
): Promise<VendorModel> {
  if (!isValidObjectId(ownerIdRaw)) {
    throw new TypeError(`Invalid owner ID: ${String(ownerIdRaw)}`);
  }
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const vendor: VendorModel = {
    ...data,
    ownerId,
    isShared: false,
    isSampleData: false,
    verificationStatus: "unverified",
    createdAt: now,
    updatedAt: now,
  };

  const collection = await getVendorsCollection();
  const result = await collection.insertOne(vendor);
  return { ...vendor, _id: result.insertedId };
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

export interface EventVendorWithDetails extends EventVendorModel {
  vendor?: VendorModel;
}

/**
 * Retrieves event vendors with full vendor profile details joined.
 */
export async function getEventVendorsWithDetails(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<EventVendorWithDetails[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const eventVendorsCol = await getEventVendorsCollection();
  const vendorsCol = await getVendorsCollection();

  const eventVendors = await eventVendorsCol.find({ eventId, ownerId }).toArray();
  if (!eventVendors.length) return [];

  const vendorIds = eventVendors.map((ev) => ev.vendorId);
  const vendorsList = await vendorsCol.find({ _id: { $in: vendorIds } }).toArray();

  const vendorMap = new Map<string, VendorModel>();
  vendorsList.forEach((v) => {
    if (v._id) vendorMap.set(v._id.toString(), v);
  });

  return eventVendors.map((ev) => ({
    ...ev,
    vendor: vendorMap.get(ev.vendorId.toString()),
  }));
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
 * Updates an event vendor contract record (quoted, estimated, actual, status, notes).
 */
export async function updateEventVendorRecord(
  eventVendorIdRaw: string | ObjectId,
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  updates: Partial<Omit<EventVendorModel, "_id" | "eventId" | "ownerId" | "createdAt">>
): Promise<EventVendorModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  if (!isValidObjectId(eventVendorIdRaw)) {
    throw new TypeError(`Invalid event vendor contract ID: ${String(eventVendorIdRaw)}`);
  }

  const eventVendorId = toObjectId(eventVendorIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const updateFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (updates.quotedAmount !== undefined) updateFields.quotedAmount = Number(updates.quotedAmount);
  if (updates.estimatedAmount !== undefined) updateFields.estimatedAmount = Number(updates.estimatedAmount);
  if (updates.actualPaid !== undefined) updateFields.actualPaid = Number(updates.actualPaid);
  if (updates.bookingStatus !== undefined) updateFields.bookingStatus = updates.bookingStatus;
  if (updates.notes !== undefined) updateFields.notes = updates.notes;

  const collection = await getEventVendorsCollection();
  const result = await collection.updateOne({ _id: eventVendorId, eventId, ownerId }, { $set: updateFields });

  if (result.matchedCount === 0) {
    throw new ResourceNotFoundError("Event vendor contract not found or you do not have permission to edit it");
  }

  const updated = await collection.findOne({ _id: eventVendorId, eventId, ownerId });
  if (!updated) {
    throw new ResourceNotFoundError("Event vendor record not found after update");
  }
  return updated;
}

/**
 * Deletes an event vendor contract association after verifying ownership.
 */
export async function deleteEventVendorRecord(
  eventVendorIdRaw: string | ObjectId,
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<boolean> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  if (!isValidObjectId(eventVendorIdRaw)) {
    throw new TypeError(`Invalid event vendor contract ID: ${String(eventVendorIdRaw)}`);
  }

  const eventVendorId = toObjectId(eventVendorIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const collection = await getEventVendorsCollection();
  const result = await collection.deleteOne({ _id: eventVendorId, eventId, ownerId });

  if (result.deletedCount === 0) {
    throw new ResourceNotFoundError("Event vendor contract not found or you do not have permission to delete it");
  }

  return true;
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
 * Bulk creates AI ideas for an event.
 */
export async function bulkCreateIdeas(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  items: Array<Omit<IdeaModel, "_id" | "eventId" | "ownerId" | "createdAt">>
): Promise<IdeaModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  if (!items.length) return [];

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);
  const now = new Date();

  const prepared: IdeaModel[] = items.map((it) => ({
    ...it,
    eventId,
    ownerId,
    createdAt: now,
  }));

  const collection = await getIdeasCollection();
  const result = await collection.insertMany(prepared);

  return prepared.map((item, idx) => ({
    ...item,
    _id: result.insertedIds[idx],
  }));
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
  content: string,
  extra?: {
    actionProposal?: ActionProposal;
    suggestedPrompts?: string[];
  }
): Promise<ConversationMessageModel> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const message: ConversationMessageModel = {
    eventId,
    ownerId,
    role,
    content,
    actionProposal: extra?.actionProposal,
    suggestedPrompts: extra?.suggestedPrompts,
    createdAt: new Date(),
  };

  const collection = await getConversationMessagesCollection();
  const result = await collection.insertOne(message);
  return { ...message, _id: result.insertedId };
}

/**
 * Updates an action proposal status on a conversation message.
 */
export async function updateMessageActionStatus(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  messageIdRaw: string | ObjectId,
  status: "pending" | "confirmed" | "rejected" | "applied"
): Promise<boolean> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  const collection = await getConversationMessagesCollection();
  const messageId = toObjectId(messageIdRaw);
  const result = await collection.updateOne(
    { _id: messageId, eventId: toObjectId(eventIdRaw), ownerId: toObjectId(ownerIdRaw) },
    { $set: { "actionProposal.status": status } }
  );
  return result.modifiedCount > 0;
}

/**
 * Retrieves a single event by ID after strictly verifying ownership.
 */
export async function getEventById(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<EventModel> {
  return verifyEventOwnership(eventIdRaw, ownerIdRaw);
}

/**
 * Updates an event record after verifying ownership.
 */
export async function updateEventRecord(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  updates: Record<string, unknown>
): Promise<EventModel> {
  const existing = await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const events = await getEventsCollection();
  const now = new Date();

  // Normalize budgetTotal / totalBudget if present
  const budget =
    updates.budgetTotal !== undefined
      ? Number(updates.budgetTotal)
      : updates.totalBudget !== undefined
      ? Number(updates.totalBudget)
      : existing.totalBudget;

  const mergedPreferences = {
    ...existing.preferences,
    ...(updates.preferences && typeof updates.preferences === "object" ? updates.preferences : {}),
    ...(updates.city !== undefined ? { city: String(updates.city) } : {}),
    ...(updates.venuePreference !== undefined ? { venuePreference: String(updates.venuePreference) } : {}),
    ...(updates.indoorOutdoor !== undefined ? { indoorOutdoor: String(updates.indoorOutdoor) } : {}),
    ...(updates.colorPreferences !== undefined ? { colorPreferences: updates.colorPreferences as string[] } : {}),
    ...(updates.foodPreferences !== undefined ? { foodPreferences: updates.foodPreferences as string[] } : {}),
    ...(updates.eventPriorities !== undefined ? { eventPriorities: updates.eventPriorities as string[] } : {}),
    ...(updates.accessibilityNeeds !== undefined ? { accessibilityNeeds: updates.accessibilityNeeds as string[] } : {}),
    ...(updates.notes !== undefined ? { notes: String(updates.notes) } : {}),
  };

  const updateDoc: Partial<EventModel> = {
    ...(updates.title !== undefined ? { title: String(updates.title) } : {}),
    ...(updates.type !== undefined ? { type: updates.type as EventModel["type"] } : {}),
    ...(updates.date !== undefined ? { date: String(updates.date) } : {}),
    ...(updates.timezone !== undefined ? { timezone: String(updates.timezone) } : {}),
    ...(updates.location !== undefined ? { location: String(updates.location) } : {}),
    ...(updates.guestCount !== undefined ? { guestCount: Number(updates.guestCount) } : {}),
    ...(updates.currency !== undefined ? { currency: String(updates.currency) } : {}),
    totalBudget: budget,
    ...(updates.theme !== undefined ? { theme: String(updates.theme) } : {}),
    preferences: mergedPreferences,
    ...(updates.status !== undefined ? { status: updates.status as EventModel["status"] } : {}),
    ...(updates.version !== undefined ? { version: Number(updates.version) } : { version: (existing.version ?? 1) + 1 }),
    updatedAt: now,
  };

  await events.updateOne({ _id: eventId, ownerId }, { $set: updateDoc });

  const updated = await events.findOne({ _id: eventId, ownerId });
  if (!updated) {
    throw new ResourceNotFoundError("Event not found after update");
  }
  return updated;
}

/**
 * Updates an event record with strict optimistic concurrency control against expectedVersion.
 * Rejects stale proposals from overwriting newer edits.
 */
export async function updateEventWithConcurrencyCheck(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  updates: Record<string, unknown>,
  expectedVersion: number
): Promise<EventModel> {
  const existing = await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  const currentVersion = existing.version ?? 1;

  if (currentVersion !== expectedVersion) {
    throw new ConcurrencyError(
      `Event version conflict: Expected version ${expectedVersion}, but found version ${currentVersion}. The event was modified by another operation. Please regenerate change impact.`
    );
  }

  const nextVersion = currentVersion + 1;
  return updateEventRecord(eventIdRaw, ownerIdRaw, {
    ...updates,
    version: nextVersion,
  });
}

/**
 * Records an immutable audit log entry in change_logs.
 */
export async function recordChangeLog(
  entry: Omit<EventChangeLogModel, "_id">
): Promise<EventChangeLogModel> {
  const collection = await getChangeLogsCollection();
  const result = await collection.insertOne(entry);
  return { ...entry, _id: result.insertedId };
}

/**
 * Retrieves change history / audit trail for an event.
 */
export async function getEventChangeLogs(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<EventChangeLogModel[]> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const collection = await getChangeLogsCollection();
  return collection.find({ eventId, ownerId }).sort({ version: -1, timestamp: -1 }).toArray();
}

/**
 * Batch updates due dates for specified tasks during replanning.
 */
export async function batchUpdateTaskDueDates(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  updates: Array<{ taskId: string; newDueDate: string }>
): Promise<number> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const tasks = await getTasksCollection();
  let updatedCount = 0;

  for (const item of updates) {
    if (!isValidObjectId(item.taskId)) continue;
    const res = await tasks.updateOne(
      { _id: toObjectId(item.taskId), eventId, ownerId },
      { $set: { dueDate: item.newDueDate, updatedAt: new Date() } }
    );
    if (res.modifiedCount > 0) {
      updatedCount += res.modifiedCount;
    }
  }

  return updatedCount;
}

/**
 * Batch updates budget estimated amounts for affected categories during replanning.
 */
export async function batchUpdateBudgetEstimated(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  adjustments: Array<{ category: string; newEstimated: number }>
): Promise<number> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const budget = await getBudgetItemsCollection();
  let updatedCount = 0;

  for (const adj of adjustments) {
    const res = await budget.updateOne(
      { eventId, ownerId, category: { $regex: new RegExp(`^${adj.category}$`, "i") } },
      { $set: { estimatedAmount: adj.newEstimated, updatedAt: new Date() } }
    );
    if (res.modifiedCount > 0) {
      updatedCount += res.modifiedCount;
    }
  }

  return updatedCount;
}

/**
 * Records audit notes or status modifications on event vendors without automated cancellations.
 */
export async function updateEventVendorsAuditNotes(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId,
  vendorUpdates: Array<{ eventVendorId: string; note: string; newStatus?: BookingStatus }>
): Promise<number> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);
  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const eventVendors = await getEventVendorsCollection();
  let modifiedCount = 0;

  for (const item of vendorUpdates) {
    if (!isValidObjectId(item.eventVendorId)) continue;
    const evId = toObjectId(item.eventVendorId);
    const existing = await eventVendors.findOne({ _id: evId, eventId, ownerId });
    if (!existing) continue;

    const mergedNotes = existing.notes ? `${existing.notes}\n[Audit]: ${item.note}` : `[Audit]: ${item.note}`;
    const updateFields: Record<string, unknown> = {
      notes: mergedNotes,
      updatedAt: new Date(),
    };
    if (item.newStatus) {
      updateFields.bookingStatus = item.newStatus;
    }

    const res = await eventVendors.updateOne({ _id: evId, eventId, ownerId }, { $set: updateFields });
    if (res.modifiedCount > 0) modifiedCount += res.modifiedCount;
  }

  return modifiedCount;
}

/**
 * Permanently deletes an event and cascades deletion across all associated child records.
 * Documented Child Record Deletion Policy:
 * To ensure zero orphaned documents and maintain complete database hygiene, deleting an
 * event irrevocably purges:
 * 1. The event itself from `events`
 * 2. All budget line items from `budget_items`
 * 3. All timeline tasks and subtasks from `tasks`
 * 4. All vendor allocations and quotes from `event_vendors`
 * 5. All generated AI ideas from `ideas`
 * 6. All assistant conversation logs from `conversation_messages`
 */
export async function deleteEventRecord(
  eventIdRaw: string | ObjectId,
  ownerIdRaw: string | ObjectId
): Promise<{
  success: boolean;
  eventId: string;
  deletedCounts: {
    event: number;
    budgetItems: number;
    tasks: number;
    eventVendors: number;
    ideas: number;
    conversationMessages: number;
  };
}> {
  await verifyEventOwnership(eventIdRaw, ownerIdRaw);

  const eventId = toObjectId(eventIdRaw);
  const ownerId = toObjectId(ownerIdRaw);

  const [
    events,
    budgetItems,
    tasks,
    eventVendors,
    ideas,
    conversationMessages,
  ] = await Promise.all([
    getEventsCollection(),
    getBudgetItemsCollection(),
    getTasksCollection(),
    getEventVendorsCollection(),
    getIdeasCollection(),
    getConversationMessagesCollection(),
  ]);

  const [
    eventRes,
    budgetRes,
    tasksRes,
    vendorsRes,
    ideasRes,
    messagesRes,
  ] = await Promise.all([
    events.deleteOne({ _id: eventId, ownerId }),
    budgetItems.deleteMany({ eventId, ownerId }),
    tasks.deleteMany({ eventId, ownerId }),
    eventVendors.deleteMany({ eventId, ownerId }),
    ideas.deleteMany({ eventId, ownerId }),
    conversationMessages.deleteMany({ eventId, ownerId }),
  ]);

  return {
    success: true,
    eventId: eventId.toString(),
    deletedCounts: {
      event: eventRes.deletedCount,
      budgetItems: budgetRes.deletedCount,
      tasks: tasksRes.deletedCount,
      eventVendors: vendorsRes.deletedCount,
      ideas: ideasRes.deletedCount,
      conversationMessages: messagesRes.deletedCount,
    },
  };
}

/**
 * Aggregates dashboard data strictly for the authenticated owner across all their events.
 */
export async function getDashboardSummaryForOwner(ownerIdRaw: string | ObjectId) {
  const ownerId = toObjectId(ownerIdRaw);
  const eventsCollection = await getEventsCollection();
  const tasksCollection = await getTasksCollection();
  const budgetCollection = await getBudgetItemsCollection();

  const userEvents = await eventsCollection.find({ ownerId }).sort({ createdAt: -1 }).toArray();

  const eventIds = userEvents.map((e) => e._id);
  const eventIdMap = new Map<string, string>();
  userEvents.forEach((e) => {
    if (e._id) eventIdMap.set(e._id.toString(), e.title);
  });

  const [allTasks, allBudgetItems] = await Promise.all([
    tasksCollection.find({ ownerId, eventId: { $in: eventIds } }).toArray(),
    budgetCollection.find({ ownerId, eventId: { $in: eventIds } }).toArray(),
  ]);

  const now = new Date();

  // Calculate days remaining helper
  const calculateDays = (dateStr: string) => {
    try {
      const target = new Date(dateStr);
      const diffMs = target.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  // Upcoming events
  const upcomingEvents = userEvents
    .filter((e) => e.status !== "completed" && e.status !== "cancelled")
    .map((e) => ({
      ...e,
      daysRemaining: calculateDays(e.date),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Recent events (last updated)
  const recentEvents = [...userEvents]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    )
    .slice(0, 5);

  // Financial aggregates
  const totalBudget = userEvents.reduce((acc, e) => acc + (e.totalBudget || 0), 0);
  const totalEstimatedAmount = allBudgetItems.reduce((acc, b) => acc + (b.estimatedAmount || 0), 0);
  const totalActualSpent = allBudgetItems.reduce((acc, b) => acc + (b.actualAmount || 0), 0);
  const totalGuests = userEvents.reduce((acc, e) => acc + (e.guestCount || 0), 0);

  // Task progress
  const tasksCompleted = allTasks.filter((t) => t.status === "completed").length;
  const tasksTotal = allTasks.length;
  const taskCompletionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  // Upcoming deadlines (pending tasks sorted by due date)
  const upcomingDeadlines = allTasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
    .slice(0, 6)
    .map((t) => ({
      ...t,
      eventTitle: eventIdMap.get(t.eventId.toString()) || "Event",
    }));

  return {
    totalEvents: userEvents.length,
    upcomingEvents,
    recentEvents,
    totalBudget,
    totalEstimatedAmount,
    totalActualSpent,
    totalGuests,
    tasksCompleted,
    tasksTotal,
    taskCompletionRate,
    upcomingDeadlines,
  };
}
