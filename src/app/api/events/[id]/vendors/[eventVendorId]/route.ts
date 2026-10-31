import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { updateEventVendorSchema } from "@/lib/validation/schemas";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/utils/response";
import {
  updateEventVendorRecord,
  deleteEventVendorRecord,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string; eventVendorId: string }>;
}

/**
 * PATCH /api/events/[id]/vendors/[eventVendorId]
 * Updates an event vendor contract (quotedAmount, estimatedAmount, actualPaid, bookingStatus, notes).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to update event vendors");
      }
      throw err;
    }

    const { id, eventVendorId } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_EVENT_ID", 400);
    }
    if (!isValidObjectId(eventVendorId)) {
      return apiError("Invalid event vendor ID format", "INVALID_VENDOR_ID", 400);
    }

    const body = await req.json();
    const parsed = updateEventVendorSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const updated = await updateEventVendorRecord(eventVendorId, id, user.userId, parsed.data);
    return apiSuccess({
      eventVendor: serializeDocument(updated),
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return apiNotFound("Event vendor contract or event not found");
    }
    if (error instanceof AuthorizationError) {
      return apiError("Access denied: You do not own this event", "FORBIDDEN", 403);
    }
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("PATCH /api/events/[id]/vendors/[eventVendorId] error:", error);
    return apiError("Failed to update event vendor contract", "SERVER_ERROR", 500);
  }
}

/**
 * DELETE /api/events/[id]/vendors/[eventVendorId]
 * Removes a vendor from an event after verifying event ownership.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to remove event vendors");
      }
      throw err;
    }

    const { id, eventVendorId } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_EVENT_ID", 400);
    }
    if (!isValidObjectId(eventVendorId)) {
      return apiError("Invalid event vendor ID format", "INVALID_VENDOR_ID", 400);
    }

    await deleteEventVendorRecord(eventVendorId, id, user.userId);
    return apiSuccess({
      deleted: true,
      eventVendorId,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return apiNotFound("Event vendor contract or event not found");
    }
    if (error instanceof AuthorizationError) {
      return apiError("Access denied: You do not own this event", "FORBIDDEN", 403);
    }
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("DELETE /api/events/[id]/vendors/[eventVendorId] error:", error);
    return apiError("Failed to delete event vendor contract", "SERVER_ERROR", 500);
  }
}
