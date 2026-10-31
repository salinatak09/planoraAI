import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { createBudgetItemSchema } from "@/lib/validation/schemas";
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
  createBudgetItemRecord,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { calculateBudgetSummary } from "@/lib/domain/budget";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]/budget
 * Retrieves all budget items for an event along with calculated financial metrics.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to access event budget");
      }
      throw err;
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const event = await getEventById(id, user.userId);
    const items = await getEventBudgetItems(id, user.userId);

    const serializedItems = items.map((item) => serializeDocument(item));

    // Calculate domain financial summary
    const summary = calculateBudgetSummary(
      event.totalBudget,
      serializedItems.map((item) => ({
        id: String(item._id || ""),
        category: String(item.category || ""),
        description: String(item.description || ""),
        estimatedAmount: Number(item.estimatedAmount || 0),
        actualAmount: Number(item.actualAmount || 0),
        paymentStatus: (item.paymentStatus as "unpaid" | "deposit_paid" | "paid") || "unpaid",
        notes: item.notes ? String(item.notes) : undefined,
        isContingency: Boolean(item.isContingency),
      }))
    );

    return apiSuccess({
      event: {
        id: event._id?.toString(),
        title: event.title,
        type: event.type,
        totalBudget: event.totalBudget,
        currency: event.currency || "₹",
      },
      items: serializedItems,
      summary,
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
    console.error("GET /api/events/[id]/budget error:", error);
    return apiError("Failed to fetch budget data", "SERVER_ERROR", 500);
  }
}

/**
 * POST /api/events/[id]/budget
 * Adds a new budget item to the event after verifying ownership and validating data.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to add budget items");
      }
      throw err;
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const body = await req.json();
    const parsed = createBudgetItemSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const createdItem = await createBudgetItemRecord(id, user.userId, parsed.data);

    // Fetch updated list to compute refreshed summary
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

    return apiSuccess(
      {
        item: serializeDocument(createdItem),
        items: serializedItems,
        summary,
      },
      201
    );
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
    console.error("POST /api/events/[id]/budget error:", error);
    return apiError("Failed to create budget item", "SERVER_ERROR", 500);
  }
}
