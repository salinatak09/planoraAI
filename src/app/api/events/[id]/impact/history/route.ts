import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
} from "@/lib/utils/response";
import {
  getEventChangeLogs,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { isValidObjectId, serializeDocument } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]/impact/history
 * Retrieves immutable audit logs and version history entries for an event.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to view change history");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const logs = await getEventChangeLogs(id, user.userId);

    return apiSuccess({
      changeLogs: serializeDocument(logs),
      totalEntries: logs.length,
    });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError || (err as { name?: string })?.name === "AuthorizationError") {
      return apiError("You do not have permission to view change history for this event", "FORBIDDEN", 403);
    }
    if (err instanceof ResourceNotFoundError || (err as { name?: string })?.name === "ResourceNotFoundError") {
      return apiError("Event not found", "NOT_FOUND", 404);
    }
    return apiError(
      err instanceof Error ? err.message : "Failed to retrieve change history",
      "SERVER_ERROR",
      500
    );
  }
}
