import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/utils/response";
import { AuthorizationError, ResourceNotFoundError } from "@/lib/db/services";
import { executeAssistantAction, buildEventAssistantContext } from "@/lib/ai/assistant";
import { executeActionSchema } from "@/lib/validation/schemas";
import { isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/events/[id]/chat/action
 * Controlled Action Execution Endpoint
 * Validates and executes an AI-proposed mutation ONLY after explicit user confirmation.
 * Never claims an action succeeded until database write succeeds.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to execute event actions");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON payload", "BAD_REQUEST", 400);
    }

    const parsed = executeActionSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { actionProposal } = parsed.data;
    const messageId = typeof body.messageId === "string" ? body.messageId : undefined;

    // Execute the validated mutation against MongoDB
    const result = await executeAssistantAction({
      eventId: id,
      ownerId: user.userId,
      action: actionProposal,
      messageId,
    });

    // Re-fetch updated event context for immediate UI synchronization
    const updatedContext = await buildEventAssistantContext(id, user.userId);

    return apiSuccess({
      result,
      eventContext: updatedContext,
    });
  } catch (err: unknown) {
    const isAuthError = err instanceof AuthorizationError || (err as { name?: string })?.name === "AuthorizationError";
    if (isAuthError) {
      return apiError("You do not have permission to execute actions on this event", "FORBIDDEN", 403);
    }
    const isNotFound = err instanceof ResourceNotFoundError || (err as { name?: string })?.name === "ResourceNotFoundError";
    if (isNotFound) {
      return apiError("Event not found", "NOT_FOUND", 404);
    }
    return apiError(
      err instanceof Error ? err.message : "Failed to execute proposed action",
      "ACTION_EXECUTION_ERROR",
      400
    );
  }
}
