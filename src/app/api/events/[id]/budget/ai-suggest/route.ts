import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/utils/response";
import {
  getEventById,
  getEventBudgetItems,
  bulkCreateBudgetItems,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { suggestCategoryAllocations, calculateBudgetSummary } from "@/lib/domain/budget";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/events/[id]/budget/ai-suggest
 * Generates AI category allocations for the event archetype,
 * with application code authoritatively calculating rounded totals and enforcing limits.
 * If body contains `{ apply: true }`, these envelopes are persisted as budget line items.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to generate budget suggestions");
      }
      throw err;
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const event = await getEventById(id, user.userId);

    // AI benchmark suggestions computed authoritatively with zero penny drift
    const suggestions = suggestCategoryAllocations(event.totalBudget, event.type);

    let body: { apply?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    if (body.apply) {
      // Convert suggestions to budget items and persist
      const newItems = suggestions.map((s) => ({
        category: s.category,
        description: s.description,
        estimatedAmount: s.recommendedAmount,
        actualAmount: 0,
        paymentStatus: "unpaid" as const,
        isContingency: s.isContingency ?? false,
        notes: `AI Suggested Envelope (${s.percentage}% allocation)`,
      }));

      await bulkCreateBudgetItems(id, user.userId, newItems);

      const allItems = await getEventBudgetItems(id, user.userId);
      const serializedItems = allItems.map((it) => serializeDocument(it));
      const summary = calculateBudgetSummary(
        event.totalBudget,
        serializedItems.map((it) => ({
          id: String(it._id || ""),
          category: String(it.category || ""),
          description: String(it.description || ""),
          estimatedAmount: Number(it.estimatedAmount || 0),
          actualAmount: Number(it.actualAmount || 0),
          paymentStatus: (it.paymentStatus as "unpaid" | "deposit_paid" | "paid") || "unpaid",
          notes: it.notes ? String(it.notes) : undefined,
          isContingency: Boolean(it.isContingency),
        }))
      );

      return apiSuccess({
        applied: true,
        message: "Applied AI budget envelopes successfully",
        suggestions,
        items: serializedItems,
        summary,
      });
    }

    return apiSuccess({
      applied: false,
      totalBudget: event.totalBudget,
      currency: event.currency || "₹",
      eventType: event.type,
      suggestions,
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
    console.error("POST /api/events/[id]/budget/ai-suggest error:", error);
    return apiError("Failed to generate AI budget suggestions", "SERVER_ERROR", 500);
  }
}
