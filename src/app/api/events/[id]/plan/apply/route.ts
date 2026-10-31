import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { applyPlanRequestSchema } from "@/lib/ai/schemas";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/utils/response";
import {
  getEventById,
  updateEventRecord,
  bulkCreateBudgetItems,
  bulkCreateTasks,
  bulkCreateIdeas,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/events/[id]/plan/apply
 * Applies a user-reviewed and approved AI-generated event plan into MongoDB.
 * Never automatically overwrites existing plans without explicit user approval.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to apply an event plan");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const event = await getEventById(id, user.userId);

    const body = await req.json();
    const parsed = applyPlanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { plan, applyOptions } = parsed.data;
    const appliedCounts = {
      budgetItems: 0,
      tasks: 0,
      ideas: 0,
    };

    // 1. Apply Summary & Theme if requested
    if (applyOptions.applySummary) {
      await updateEventRecord(id, user.userId, {
        title: plan.eventSummary.title || event.title,
        theme: plan.eventSummary.theme || event.theme,
        preferences: {
          ...event.preferences,
          concept: plan.eventSummary.concept,
          colorPalette: plan.eventSummary.colorPalette,
          planningAssumptions: plan.eventSummary.planningAssumptions,
        },
      });
    }

    // 2. Apply Budget Envelopes if requested
    if (applyOptions.applyBudget && plan.budget.length > 0) {
      const budgetItemsToCreate = plan.budget.map((b) => ({
        category: b.category,
        description: b.rationale,
        estimatedAmount: b.estimatedAmount,
        actualAmount: 0,
        paymentStatus: "unpaid" as const,
        notes: `AI Planning Estimate (${b.costConfidence} confidence) - ${b.costAssumptions}`,
        isContingency: b.category.toLowerCase().includes("contingency") || b.category.toLowerCase().includes("reserve"),
      }));

      const createdBudget = await bulkCreateBudgetItems(id, user.userId, budgetItemsToCreate);
      appliedCounts.budgetItems = createdBudget.length;
    }

    // 3. Apply Timeline Tasks if requested
    if (applyOptions.applyTimeline && plan.timeline.length > 0) {
      const tasksToCreate = plan.timeline.map((t) => ({
        title: t.taskTitle,
        description: t.description,
        dueDate: t.suggestedDueDate,
        priority: t.priority,
        status: "pending" as const, // Strict pending status
        category: "General Milestone",
        assignedTo: undefined,
      }));

      const createdTasks = await bulkCreateTasks(id, user.userId, tasksToCreate);
      appliedCounts.tasks = createdTasks.length;
    }

    // 4. Apply Personalized Ideas if requested
    if (applyOptions.applyIdeas && plan.personalizedIdeas.length > 0) {
      const ideasToCreate = plan.personalizedIdeas.map((idea) => ({
        category: "activity" as const,
        title: idea.title,
        description: `${idea.description} (Preparation: ${idea.materialsOrPreparationRequired.join(", ")})`,
        estimatedCost: `${plan.metadata.currency}${idea.estimatedCost.toLocaleString()} (Planning Estimate)`,
      }));

      const createdIdeas = await bulkCreateIdeas(id, user.userId, ideasToCreate);
      appliedCounts.ideas = createdIdeas.length;
    }

    return apiSuccess({
      success: true,
      message: "AI event plan successfully applied to event workspace",
      appliedCounts,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return apiNotFound("Event not found");
    }
    if (error instanceof AuthorizationError) {
      return apiError("Access denied: You do not own this event", "FORBIDDEN", 403);
    }
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }

    console.error("POST /api/events/[id]/plan/apply error:", error);
    return apiError("Failed to apply plan", "SERVER_ERROR", 500);
  }
}
