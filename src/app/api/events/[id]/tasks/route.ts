import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { createTaskSchema } from "@/lib/validation/schemas";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/utils/response";
import {
  getEventById,
  getEventTasksList,
  createTaskRecord,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]/tasks
 * Retrieves all tasks for an event with optional status and priority filtering.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to view event tasks");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const event = await getEventById(id, user.userId);

    const url = new URL(req.url);
    const filterStatus = url.searchParams.get("status") || undefined;
    const filterPriority = url.searchParams.get("priority") || undefined;

    const tasks = await getEventTasksList(id, user.userId, filterStatus, filterPriority);

    return apiSuccess({
      event: {
        id: event._id?.toString(),
        title: event.title,
        date: event.date,
        timezone: event.timezone || "UTC",
      },
      tasks: tasks.map((t) => serializeDocument(t)),
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
    console.error("GET /api/events/[id]/tasks error:", error);
    return apiError("Failed to fetch tasks", "SERVER_ERROR", 500);
  }
}

/**
 * POST /api/events/[id]/tasks
 * Creates a new task for an event after verifying ownership.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to add tasks");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const created = await createTaskRecord(id, user.userId, parsed.data);

    return apiSuccess(
      {
        task: serializeDocument(created),
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
    console.error("POST /api/events/[id]/tasks error:", error);
    return apiError("Failed to create task", "SERVER_ERROR", 500);
  }
}
