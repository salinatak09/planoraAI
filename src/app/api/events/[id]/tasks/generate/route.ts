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
  bulkCreateTasks,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { generateChecklistFromRequirements } from "@/lib/domain/tasks";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/events/[id]/tasks/generate
 * Generates an event checklist tailored to the event requirements.
 * CRITICAL: All generated checklist tasks are strictly "pending" - no task is automatically claimed to be completed.
 * If body contains `{ apply: true }`, tasks are persisted into MongoDB for this event.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to generate event checklists");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    const event = await getEventById(id, user.userId);

    const generatedTasks = generateChecklistFromRequirements(
      event.type,
      event.date,
      event.preferences
    );

    let body: { apply?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    if (body.apply) {
      const created = await bulkCreateTasks(
        id,
        user.userId,
        generatedTasks.map((t) => ({
          title: t.title,
          description: t.description,
          dueDate: t.dueDate,
          priority: t.priority,
          status: "pending" as const, // Strict pending status
          assignedTo: t.assignedTo,
          category: t.category,
        }))
      );

      return apiSuccess({
        applied: true,
        count: created.length,
        tasks: created.map((t) => serializeDocument(t)),
      });
    }

    return apiSuccess({
      applied: false,
      count: generatedTasks.length,
      tasks: generatedTasks,
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
    console.error("POST /api/events/[id]/tasks/generate error:", error);
    return apiError("Failed to generate checklist", "SERVER_ERROR", 500);
  }
}
