import { z } from "zod";

export const eventTypeSchema = z.enum(["wedding", "birthday", "anniversary", "community"], {
  message: "Event type must be wedding, birthday, anniversary, or community",
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
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  type: eventTypeSchema,
  date: z.string().min(4, "Event date is required"),
  location: z.string().trim().min(2, "Location is required").max(150),
  guestCount: z.number().int().min(1, "Guest count must be at least 1").max(50000),
  budgetTotal: z.number().min(0, "Budget must be positive or zero"),
  theme: z.string().trim().min(2, "Theme is required").max(100),
  notes: z.string().max(2000).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: eventStatusSchema.optional(),
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
