import { z } from "zod";
import { ObjectId } from "mongodb";

/**
 * Validates that a string is a 24-character hexadecimal MongoDB ObjectId string.
 */
export const objectIdSchema = z
  .string()
  .refine((val) => ObjectId.isValid(val) && new ObjectId(val).toString() === val, {
    message: "Invalid MongoDB ObjectId format (must be 24-char hex string)",
  });

export const eventTypeSchema = z.enum(["wedding", "birthday", "anniversary", "community", "other"], {
  message: "Event type must be wedding, birthday, anniversary, community, or other",
});

export const eventStatusSchema = z.enum(
  ["planning", "confirmed", "in_progress", "completed", "cancelled"],
  {
    message: "Invalid event status",
  }
);

export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusSchema = z.enum(["pending", "in_progress", "completed"]);

export const vendorCategorySchema = z.enum([
  "venue",
  "catering",
  "photography",
  "music",
  "decor",
  "florals",
  "attire",
  "other",
]);

export const vendorStatusSchema = z.enum(["contacted", "shortlisted", "booked", "declined"]);
export const paymentStatusSchema = z.enum(["unpaid", "deposit_paid", "paid"]);
export const priceRangeSchema = z.enum(["$", "$$", "$$$", "$$$$"]);
export const verificationStatusSchema = z.enum(["verified", "unverified", "preferred"]);
export const bookingStatusSchema = z.enum([
  "shortlisted",
  "contacted",
  "booked",
  "cancelled",
  "completed",
  "inquiry",
  "quoted",
  "declined",
]);
export const messageRoleSchema = z.enum(["user", "assistant", "system"]);
export const ideaCategorySchema = z.enum(["theme", "decor", "activity", "menu", "logistics"]);

/**
 * 1. User Validation Schema
 */
export const userSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address"),
  authProvider: z.enum(["credentials", "google", "github"]).default("credentials"),
  preferences: z
    .object({
      defaultCurrency: z.string().default("₹"),
      timezone: z.string().default("Asia/Kolkata"),
      notifications: z.boolean().default(true),
    })
    .passthrough()
    .default({
      defaultCurrency: "₹",
      timezone: "Asia/Kolkata",
      notifications: true,
    }),
  createdAt: z.date().optional(),
});

/**
 * 2. Event Model Schema
 */
export const eventModelSchema = z.object({
  ownerId: objectIdSchema,
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  type: eventTypeSchema,
  date: z.string().min(4, "Event date is required"),
  timezone: z.string().default("UTC"),
  location: z.string().trim().min(2, "Location is required").max(150),
  guestCount: z.number().int().min(1, "Guest count must be at least 1").max(50000),
  currency: z.string().default("₹"),
  totalBudget: z.number().min(0, "Budget must be positive or zero"),
  theme: z.string().trim().min(2, "Theme is required").max(100),
  preferences: z
    .object({
      splurgePriority: z.string().optional(),
      specialRequirements: z.array(z.string()).optional(),
    })
    .passthrough()
    .default({}),
  status: eventStatusSchema.default("planning"),
});

/**
 * 3. BudgetItem Validation Schema
 */
export const budgetItemSchema = z.object({
  eventId: objectIdSchema,
  ownerId: objectIdSchema,
  category: z.string().trim().min(2, "Category is required").max(80),
  description: z.string().trim().min(2, "Description must be at least 2 characters").max(200),
  estimatedAmount: z.number().finite("Estimated amount must be a finite number").min(0, "Estimated amount cannot be negative"),
  actualAmount: z.number().finite("Actual amount must be a finite number").min(0, "Actual amount cannot be negative").default(0),
  paymentStatus: paymentStatusSchema.default("unpaid"),
  notes: z.string().max(500).optional(),
  isContingency: z.boolean().optional().default(false),
});

export const createBudgetItemSchema = z.object({
  category: z.string().trim().min(2, "Category is required").max(80),
  description: z.string().trim().min(2, "Description must be at least 2 characters").max(200),
  estimatedAmount: z.number().finite("Estimated amount must be a finite number").min(0, "Estimated amount cannot be negative"),
  actualAmount: z.number().finite("Actual amount must be a finite number").min(0, "Actual amount cannot be negative").default(0),
  paymentStatus: paymentStatusSchema.default("unpaid"),
  notes: z.string().max(500).optional(),
  isContingency: z.boolean().optional().default(false),
});

export const updateBudgetItemSchema = z.object({
  category: z.string().trim().min(2, "Category is required").max(80).optional(),
  description: z.string().trim().min(2, "Description must be at least 2 characters").max(200).optional(),
  estimatedAmount: z.number().finite("Estimated amount must be a finite number").min(0, "Estimated amount cannot be negative").optional(),
  actualAmount: z.number().finite("Actual amount must be a finite number").min(0, "Actual amount cannot be negative").optional(),
  paymentStatus: paymentStatusSchema.optional(),
  notes: z.string().max(500).optional(),
  isContingency: z.boolean().optional(),
});

/**
 * 4. Task Validation Schema
 */
export const taskModelSchema = z.object({
  eventId: objectIdSchema,
  ownerId: objectIdSchema,
  title: z.string().trim().min(2, "Task title must be at least 2 characters").max(120),
  description: z.string().max(1000).optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: taskPrioritySchema.default("medium"),
  status: taskStatusSchema.default("pending"),
  assignedTo: z.string().max(100).optional(),
  category: z.string().max(80).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters").max(120),
  description: z.string().max(1000).optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: taskPrioritySchema.default("medium"),
  status: taskStatusSchema.default("pending"),
  assignedTo: z.string().max(100).optional(),
  category: z.string().max(80).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters").max(120).optional(),
  description: z.string().max(1000).optional(),
  dueDate: z.string().min(1, "Due date is required").optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  assignedTo: z.string().max(100).optional(),
  category: z.string().max(80).optional(),
});

/**
 * 5. Vendor Validation Schema
 */
export const vendorModelSchema = z.object({
  ownerId: objectIdSchema.nullable().optional(),
  isShared: z.boolean().default(false),
  name: z.string().trim().min(2, "Vendor name must be at least 2 characters").max(100),
  category: vendorCategorySchema,
  location: z.string().trim().min(2, "Location is required").max(150),
  contact: z
    .object({
      name: z.string().max(100).optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().max(30).optional(),
      website: z.string().url().optional().or(z.literal("")),
    })
    .default({}),
  priceRange: priceRangeSchema.default("$$"),
  verificationStatus: verificationStatusSchema.default("unverified"),
  serviceDescription: z.string().max(1000).optional(),
  isSampleData: z.boolean().default(false),
});

export const createVendorSchema = z.object({
  name: z.string().trim().min(2, "Vendor name must be at least 2 characters").max(100),
  category: vendorCategorySchema,
  location: z.string().trim().min(2, "Location is required").max(150),
  contact: z
    .object({
      name: z.string().max(100).optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().max(30).optional(),
      website: z.string().url().optional().or(z.literal("")),
    })
    .default({}),
  priceRange: priceRangeSchema.default("$$"),
  verificationStatus: verificationStatusSchema.default("unverified"),
  serviceDescription: z.string().max(1000).optional(),
  isShared: z.boolean().default(false),
  isSampleData: z.boolean().default(false),
});

/**
 * 6. EventVendor Contract Validation Schema
 */
export const eventVendorModelSchema = z.object({
  eventId: objectIdSchema,
  vendorId: objectIdSchema,
  ownerId: objectIdSchema,
  estimatedAmount: z.number().min(0, "Estimated amount cannot be negative").default(0),
  quotedAmount: z.number().min(0, "Quoted amount cannot be negative"),
  actualPaid: z.number().min(0, "Actual paid cannot be negative").default(0),
  bookingStatus: bookingStatusSchema.default("shortlisted"),
  notes: z.string().max(2000).optional(),
});

export const createEventVendorSchema = z.object({
  vendorId: objectIdSchema,
  estimatedAmount: z.number().finite().min(0, "Estimated amount cannot be negative").default(0),
  quotedAmount: z.number().finite().min(0, "Quoted amount cannot be negative").default(0),
  actualPaid: z.number().finite().min(0, "Actual paid cannot be negative").default(0),
  bookingStatus: bookingStatusSchema.default("shortlisted"),
  notes: z.string().max(2000).optional(),
});

export const updateEventVendorSchema = z.object({
  estimatedAmount: z.number().finite().min(0, "Estimated amount cannot be negative").optional(),
  quotedAmount: z.number().finite().min(0, "Quoted amount cannot be negative").optional(),
  actualPaid: z.number().finite().min(0, "Actual paid cannot be negative").optional(),
  bookingStatus: bookingStatusSchema.optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * 7. Idea Validation Schema
 */
export const ideaModelSchema = z.object({
  eventId: objectIdSchema,
  ownerId: objectIdSchema,
  category: ideaCategorySchema,
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  estimatedCost: z.string().max(80).optional(),
});

/**
 * 8. ConversationMessage Validation Schema & Chat Assistant Schemas
 */
export const actionTypeSchema = z.enum([
  "REDUCE_BUDGET",
  "INCREASE_BUDGET",
  "CREATE_TASK",
  "CREATE_CHECKLIST",
  "ADD_BUDGET_ITEM",
]);

export const actionProposalSchema = z.object({
  id: z.string().optional(),
  type: actionTypeSchema,
  description: z.string(),
  preview: z.object({
    title: z.string(),
    before: z.union([z.string(), z.number()]).optional(),
    after: z.union([z.string(), z.number()]).optional(),
    details: z.union([z.record(z.string(), z.unknown()), z.array(z.record(z.string(), z.unknown()))]).optional(),
  }),
  payload: z.record(z.string(), z.unknown()),
  status: z.enum(["pending", "confirmed", "rejected", "applied"]).default("pending"),
});

export const conversationMessageSchema = z.object({
  eventId: objectIdSchema,
  ownerId: objectIdSchema,
  role: messageRoleSchema,
  content: z.string().trim().min(1, "Message content cannot be empty").max(4000),
  actionProposal: actionProposalSchema.optional(),
  suggestedPrompts: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
});

export const chatInputSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message cannot exceed 1000 characters"),
});

export const executeActionSchema = z.object({
  actionProposal: actionProposalSchema,
});

/**
 * 9. Change Impact Analysis & Replanning Schemas
 */
export const proposedChangesInputSchema = z.object({
  guestCount: z.number().int().min(1, "Guest count must be at least 1").optional(),
  totalBudget: z.number().min(0, "Total budget cannot be negative").optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format").optional(),
  location: z.string().trim().min(2, "Location must be at least 2 characters").max(150).optional(),
  theme: z.string().trim().min(2, "Theme must be at least 2 characters").max(120).optional(),
  vendorStatusChanges: z.array(z.object({
    eventVendorId: z.string().min(1, "Event vendor ID is required"),
    newStatus: bookingStatusSchema,
  })).optional(),
});

export const applyChangeProposalSchema = z.object({
  proposalId: z.string().min(1, "Proposal ID is required"),
  baseVersion: z.number().int().min(1, "Base version must be at least 1"),
  changes: proposedChangesInputSchema,
  acceptedAdjustments: z.object({
    applyBudgetAdjustments: z.boolean().default(false),
    applyTaskReschedules: z.boolean().default(false),
    selectedTaskIds: z.array(z.string()).optional(),
    selectedAlternativeIndex: z.number().int().min(0).optional(),
  }).optional(),
});

/**
 * Pagination Query Validation Schema
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Original API input schemas
export const eventTaskSchema = z.object({
  id: z.string().min(1, "Task ID is required"),
  title: z.string().min(2, "Task title must be at least 2 characters").max(120),
  description: z.string().max(500).optional(),
  dueDate: z.string().optional(),
  priority: taskPrioritySchema.default("medium"),
  status: taskStatusSchema.default("pending"),
  assignedTo: z.string().max(100).optional(),
  estimatedCost: z.number().min(0, "Estimated cost cannot be negative").optional(),
});

export const timelineItemSchema = z.object({
  id: z.string().min(1, "Timeline item ID is required"),
  time: z.string().min(1, "Time is required"),
  title: z.string().min(2, "Timeline title must be at least 2 characters").max(120),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  location: z.string().max(150).optional(),
  completed: z.boolean().default(false),
});

export const vendorSchema = z.object({
  id: z.string().min(1, "Vendor ID is required"),
  name: z.string().min(2, "Vendor name must be at least 2 characters").max(100),
  category: vendorCategorySchema,
  contactName: z.string().max(100).optional(),
  email: z.string().email("Invalid vendor email address").optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  estimatedCost: z.number().min(0, "Estimated cost cannot be negative"),
  actualCost: z.number().min(0, "Actual cost cannot be negative").optional(),
  status: vendorStatusSchema.default("contacted"),
  notes: z.string().max(500).optional(),
});

export const aiIdeaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2).max(150),
  description: z.string().min(10).max(1000),
  category: z.enum(["theme", "decor", "activity", "menu", "logistics"]),
  estimatedCostRange: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  type: eventTypeSchema,
  date: z.string().min(4, "Event date is required"),
  timezone: z.string().default("Asia/Kolkata"),
  location: z.string().trim().min(2, "Location is required").max(150),
  city: z.string().trim().max(100).optional(),
  venuePreference: z.string().trim().max(100).optional(),
  guestCount: z.number().int().min(1, "Guest count must be at least 1").max(50000),
  budgetTotal: z.number().min(0, "Budget must be positive or zero"),
  currency: z.string().default("₹"),
  theme: z.string().trim().min(2, "Theme is required").max(120),
  colorPreferences: z.array(z.string()).optional(),
  foodPreferences: z.array(z.string()).optional(),
  eventPriorities: z.array(z.string()).optional(),
  indoorOutdoor: z.enum(["indoor", "outdoor", "mixed"]).optional(),
  accessibilityNeeds: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: eventStatusSchema.optional(),
  totalBudget: z.number().min(0).optional(),
});

export const aiGenerateIdeasSchema = z.object({
  eventType: eventTypeSchema,
  theme: z.string().min(2).max(100),
  guestCount: z.number().int().min(1),
  budget: z.number().min(0),
  focusArea: z.enum(["all", "theme", "decor", "activity", "menu", "logistics"]).default("all"),
  customPrompt: z.string().max(500).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type AIGenerateIdeasInput = z.infer<typeof aiGenerateIdeasSchema>;
