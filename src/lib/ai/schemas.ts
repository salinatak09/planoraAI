import { z } from "zod";
import { eventTypeSchema, taskPrioritySchema } from "@/lib/validation/schemas";

/**
 * 1. Plan Generation Input Schema
 */
export const planGenerationInputSchema = z.object({
  eventType: eventTypeSchema,
  eventDate: z.string().min(4, "Event date is required"),
  timezone: z.string().default("UTC"),
  city: z.string().trim().min(2, "City is required").max(100),
  location: z.string().trim().max(150).optional(),
  guestCount: z.number().int().min(1, "Guest count must be at least 1").max(50000),
  totalBudget: z.number().finite("Total budget must be a finite number").min(0, "Total budget cannot be negative"),
  currency: z.string().default("₹"),
  theme: z.string().trim().min(2, "Theme is required").max(120),
  stylePreferences: z.string().max(300).optional(),
  foodPreferences: z.array(z.string()).default([]),
  dietaryRequirements: z.array(z.string()).default([]),
  indoorOutdoor: z.enum(["indoor", "outdoor", "mixed", "other"]).default("mixed"),
  accessibilityNeeds: z.array(z.string()).default([]),
  userPriorities: z.array(z.string()).default([]),
  constraints: z.string().max(500).optional(),
});

export type PlanGenerationInput = z.infer<typeof planGenerationInputSchema>;

/**
 * 2. Event Summary Output Schema
 */
export const eventSummarySchema = z.object({
  title: z.string().min(2, "Title is required"),
  concept: z.string().min(10, "Concept description is required"),
  theme: z.string().min(2, "Theme is required"),
  colorPalette: z.array(z.string()).min(2, "Provide at least 2 palette colors"),
  planningAssumptions: z.array(z.string()).min(1, "Provide at least 1 planning assumption"),
});

export type EventSummary = z.infer<typeof eventSummarySchema>;

/**
 * 3. Budget Allocation Output Schema
 */
export const budgetAllocationItemSchema = z.object({
  category: z.string().min(2, "Category is required"),
  estimatedAmount: z.number().finite().min(0, "Estimated amount must be non-negative"),
  rationale: z.string().min(5, "Rationale is required"),
  costConfidence: z.enum(["low", "medium", "high"]),
  costAssumptions: z.string().min(3, "Cost assumptions are required"),
});

export type BudgetAllocationItem = z.infer<typeof budgetAllocationItemSchema>;

/**
 * 4. Timeline Milestone Output Schema
 */
export const timelineMilestoneItemSchema = z.object({
  taskTitle: z.string().min(2, "Task title is required"),
  description: z.string().min(5, "Task description is required"),
  suggestedDueDate: z.string().min(4, "Suggested due date is required"),
  priority: taskPrioritySchema,
  dependencies: z.array(z.string()).default([]),
});

export type TimelineMilestoneItem = z.infer<typeof timelineMilestoneItemSchema>;

/**
 * 5. Vendor Checklist Output Schema
 */
export const vendorChecklistItemSchema = z.object({
  vendorCategory: z.string().min(2, "Vendor category is required"),
  requirements: z.string().min(5, "Requirements description is required"),
  questionsToAsk: z.array(z.string()).min(1, "Provide at least 1 vetting question"),
  bookingPriority: z.enum(["urgent", "high", "medium", "low"]),
});

export type VendorChecklistItem = z.infer<typeof vendorChecklistItemSchema>;

/**
 * 6. Personalized Ideas Output Schema
 */
export const personalizedIdeaItemSchema = z.object({
  title: z.string().min(2, "Idea title is required"),
  description: z.string().min(5, "Idea description is required"),
  estimatedCost: z.number().finite().min(0, "Estimated cost must be non-negative"),
  materialsOrPreparationRequired: z.array(z.string()).min(1, "Provide required materials or preparation steps"),
});

export type PersonalizedIdeaItem = z.infer<typeof personalizedIdeaItemSchema>;

/**
 * 7. Risks and Backups Output Schema
 */
export const riskAndBackupItemSchema = z.object({
  risk: z.string().min(3, "Risk description is required"),
  mitigation: z.string().min(3, "Mitigation plan is required"),
  backupOption: z.string().min(3, "Backup option is required"),
});

export type RiskAndBackupItem = z.infer<typeof riskAndBackupItemSchema>;

/**
 * 8. Complete Generated Event Plan Schema
 */
export const completeEventPlanSchema = z.object({
  eventSummary: eventSummarySchema,
  budget: z.array(budgetAllocationItemSchema).min(1, "At least one budget category required"),
  timeline: z.array(timelineMilestoneItemSchema).min(1, "At least one timeline task required"),
  vendorChecklist: z.array(vendorChecklistItemSchema).min(1, "At least one vendor requirement required"),
  personalizedIdeas: z.array(personalizedIdeaItemSchema).min(1, "At least one personalized idea required"),
  risksAndBackups: z.array(riskAndBackupItemSchema).min(1, "At least one risk scenario required"),
  metadata: z.object({
    currency: z.string(),
    totalBudget: z.number().finite().min(0),
    totalEstimatedCost: z.number().finite().min(0),
    contingencyReserved: z.number().finite().min(0),
    budgetHealth: z.enum(["balanced", "over_budget", "under_budget", "infeasible"]),
    infeasibilityTradeoffs: z.string().optional(),
    isPlanningEstimate: z.literal(true),
    generatedAt: z.string(),
  }),
});

export type CompleteEventPlan = z.infer<typeof completeEventPlanSchema>;

/**
 * Schema for applying an approved plan to an event
 */
export const applyPlanRequestSchema = z.object({
  plan: completeEventPlanSchema,
  applyOptions: z
    .object({
      applySummary: z.boolean().default(true),
      applyBudget: z.boolean().default(true),
      applyTimeline: z.boolean().default(true),
      applyVendors: z.boolean().default(true),
      applyIdeas: z.boolean().default(true),
    })
    .default({
      applySummary: true,
      applyBudget: true,
      applyTimeline: true,
      applyVendors: true,
      applyIdeas: true,
    }),
});

export type ApplyPlanRequest = z.infer<typeof applyPlanRequestSchema>;
