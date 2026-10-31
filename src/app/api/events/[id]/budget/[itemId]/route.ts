import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { updateBudgetItemSchema } from "@/lib/validation/schemas";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/utils/response";
import {
  getEventById,
  getEventBudgetItems,
  updateBudgetItemRecord,
  deleteBudgetItemRecord,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { calculateBudgetSummary } from "@/lib/domain/budget";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

/**
 * PATCH /api/events/[id]/budget/[itemId]
 * Updates a budget item after validating fields and strictly verifying ownership.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to update budget items");
      }
      throw err;
    }

    const { id, itemId } = await params;

    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_EVENT_ID", 400);
    }
    if (!isValidObjectId(itemId)) {
      return apiError("Invalid budget item ID format", "INVALID_ITEM_ID", 400);
    }

    const body = await req.json();
    const parsed = updateBudgetItemSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const updatedItem = await updateBudgetItemRecord(itemId, id, user.userId, parsed.data);

    // Refresh summary
    const event = await getEventById(id, user.userId);
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
      item: serializeDocument(updatedItem),
      items: serializedItems,
      summary,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return apiNotFound("Budget item or event not found");
    }
    if (error instanceof AuthorizationError) {
      return apiError("Access denied: You do not own this event", "FORBIDDEN", 403);
    }
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("PATCH /api/events/[id]/budget/[itemId] error:", error);
    return apiError("Failed to update budget item", "SERVER_ERROR", 500);
  }
}

/**
 * DELETE /api/events/[id]/budget/[itemId]
 * Removes a budget item after strictly verifying event ownership.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to delete budget items");
      }
      throw err;
    }

    const { id, itemId } = await params;

    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_EVENT_ID", 400);
    }
    if (!isValidObjectId(itemId)) {
      return apiError("Invalid budget item ID format", "INVALID_ITEM_ID", 400);
    }

    await deleteBudgetItemRecord(itemId, id, user.userId);

    // Refresh summary after deletion
    const event = await getEventById(id, user.userId);
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
      deleted: true,
      itemId,
      items: serializedItems,
      summary,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return apiNotFound("Budget item or event not found");
    }
    if (error instanceof AuthorizationError) {
      return apiError("Access denied: You do not own this event", "FORBIDDEN", 403);
    }
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("DELETE /api/events/[id]/budget/[itemId] error:", error);
    return apiError("Failed to delete budget item", "SERVER_ERROR", 500);
  }
}
