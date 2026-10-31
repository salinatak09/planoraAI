import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { createEventVendorSchema } from "@/lib/validation/schemas";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/utils/response";
import {
  getEventById,
  getEventVendorsWithDetails,
  createEventVendorRecord,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { serializeDocument, isValidObjectId, toObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]/vendors
 * Retrieves all vendors contracted or shortlisted for this event with complete vendor details.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to view event vendors");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const event = await getEventById(id, user.userId);
    const eventVendors = await getEventVendorsWithDetails(id, user.userId);

    return apiSuccess({
      event: {
        id: event._id?.toString(),
        title: event.title,
        currency: event.currency || "₹",
        totalBudget: event.totalBudget,
      },
      vendors: eventVendors.map((ev) => serializeDocument(ev)),
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
    console.error("GET /api/events/[id]/vendors error:", error);
    return apiError("Failed to fetch event vendors", "SERVER_ERROR", 500);
  }
}

/**
 * POST /api/events/[id]/vendors
 * Adds a vendor to an event with separate quotedAmount, estimatedAmount, actualPaid, and notes.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to add event vendors");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const body = await req.json();
    const parsed = createEventVendorSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const created = await createEventVendorRecord(id, user.userId, {
      vendorId: toObjectId(parsed.data.vendorId),
      estimatedAmount: parsed.data.estimatedAmount,
      quotedAmount: parsed.data.quotedAmount,
      actualPaid: parsed.data.actualPaid,
      bookingStatus: parsed.data.bookingStatus,
      notes: parsed.data.notes,
    });

    return apiSuccess(
      {
        eventVendor: serializeDocument(created),
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
    console.error("POST /api/events/[id]/vendors error:", error);
    return apiError("Failed to add vendor to event", "SERVER_ERROR", 500);
  }
}
