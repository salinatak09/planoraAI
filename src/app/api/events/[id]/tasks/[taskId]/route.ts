import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { updateTaskSchema } from "@/lib/validation/schemas";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/utils/response";
import {
  updateTaskRecord,
  deleteTaskRecord,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string; taskId: string }>;
}

/**
 * PATCH /api/events/[id]/tasks/[taskId]
 * Updates a task (title, description, dueDate, priority, status, assignedTo, category).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to update tasks");
      }
      throw err;
    }

    const { id, taskId } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_EVENT_ID", 400);
    }
    if (!isValidObjectId(taskId)) {
      return apiError("Invalid task ID format", "INVALID_TASK_ID", 400);
    }

    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const updated = await updateTaskRecord(taskId, id, user.userId, parsed.data);
    return apiSuccess({
      task: serializeDocument(updated),
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return apiNotFound("Task or event not found");
    }
    if (error instanceof AuthorizationError) {
      return apiError("Access denied: You do not own this event", "FORBIDDEN", 403);
    }
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("PATCH /api/events/[id]/tasks/[taskId] error:", error);
    return apiError("Failed to update task", "SERVER_ERROR", 500);
  }
}

/**
 * DELETE /api/events/[id]/tasks/[taskId]
 * Deletes a task after verifying event ownership.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to delete tasks");
      }
      throw err;
    }

    const { id, taskId } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_EVENT_ID", 400);
    }
    if (!isValidObjectId(taskId)) {
      return apiError("Invalid task ID format", "INVALID_TASK_ID", 400);
    }

    await deleteTaskRecord(taskId, id, user.userId);
    return apiSuccess({
      deleted: true,
      taskId,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return apiNotFound("Task or event not found");
    }
    if (error instanceof AuthorizationError) {
      return apiError("Access denied: You do not own this event", "FORBIDDEN", 403);
    }
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("DELETE /api/events/[id]/tasks/[taskId] error:", error);
    return apiError("Failed to delete task", "SERVER_ERROR", 500);
  }
}
