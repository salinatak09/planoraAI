import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { updateEventSchema } from "@/lib/validation/schemas";
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
  deleteEventRecord,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]
 * Retrieves a single event by ID strictly verified against the authenticated user.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to view this event");
      }
      throw err;
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const event = await getEventById(id, user.userId);
    return apiSuccess(serializeDocument(event));
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
    console.error("GET /api/events/[id] error:", error);
    return apiError("Failed to fetch event", "SERVER_ERROR", 500);
  }
}

/**
 * PATCH /api/events/[id]
 * Updates event details in MongoDB after verifying ownership.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to update this event");
      }
      throw err;
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const updated = await updateEventRecord(id, user.userId, parsed.data);
    return apiSuccess(serializeDocument(updated));
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
    console.error("PATCH /api/events/[id] error:", error);
    return apiError("Failed to update event", "SERVER_ERROR", 500);
  }
}

/**
 * DELETE /api/events/[id]
 * Deletes an event and executes cascading deletion policy on all child records
 * (budget items, tasks, vendors, ideas, messages).
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to delete this event");
      }
      throw err;
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    // Require confirmation check to prevent accidental deletions
    const confirmParam = req.nextUrl.searchParams.get("confirm");
    let confirmBody = false;
    try {
      const body = await req.json();
      confirmBody = body?.confirm === true;
    } catch {
      // Body is optional if query param is set
    }

    if (confirmParam !== "true" && !confirmBody) {
      return apiError(
        "Deletion confirmation required. Pass ?confirm=true or { confirm: true } in request body.",
        "CONFIRMATION_REQUIRED",
        400
      );
    }

    const result = await deleteEventRecord(id, user.userId);
    return apiSuccess({
      message: "Event and all child resources permanently deleted",
      ...result,
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
    console.error("DELETE /api/events/[id] error:", error);
    return apiError("Failed to delete event", "SERVER_ERROR", 500);
  }
}
