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
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import {
  generateCompleteEventPlan,
  checkPlanGenerationRateLimit,
} from "@/lib/ai/gemini";
import type { PlanGenerationInput } from "@/lib/ai/schemas";
import { serializeDocument, isValidObjectId } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/events/[id]/plan/generate
 * Generates an end-to-end event plan using Gemini AI and authoritative domain validation.
 * Verifies event ownership. Never automatically overwrites the user's plan.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to generate an AI event plan");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    // Strictly verify event ownership
    const event = await getEventById(id, user.userId);

    // Rate limiting per authenticated user
    const rateCheck = checkPlanGenerationRateLimit(user.userId);
    if (!rateCheck.allowed) {
      return apiError(
        `AI plan generation rate limit exceeded. Please retry after ${rateCheck.retryAfterSeconds} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        429
      );
    }

    // Parse any optional request body overrides
    let bodyOverrides: Record<string, unknown> = {};
    try {
      bodyOverrides = await req.json();
    } catch {
      // Body is optional
    }

    const prefs = event.preferences || {};

    const planInput: PlanGenerationInput = {
      eventType: (bodyOverrides.eventType as PlanGenerationInput["eventType"]) || event.type,
      eventDate: String(bodyOverrides.eventDate || event.date),
      timezone: String(bodyOverrides.timezone || event.timezone || "UTC"),
      city: String(bodyOverrides.city || prefs.city || event.location || "Jaipur"),
      location: String(bodyOverrides.location || event.location || ""),
      guestCount: Number(bodyOverrides.guestCount || event.guestCount || 100),
      totalBudget: Number(bodyOverrides.totalBudget !== undefined ? bodyOverrides.totalBudget : event.totalBudget),
      currency: String(bodyOverrides.currency || event.currency || "₹"),
      theme: String(bodyOverrides.theme || event.theme || "Bespoke Celebration"),
      stylePreferences: String(bodyOverrides.stylePreferences || prefs.notes || ""),
      foodPreferences: Array.isArray(bodyOverrides.foodPreferences)
        ? (bodyOverrides.foodPreferences as string[])
        : Array.isArray(prefs.foodPreferences)
        ? (prefs.foodPreferences as string[])
        : [],
      dietaryRequirements: Array.isArray(bodyOverrides.dietaryRequirements)
        ? (bodyOverrides.dietaryRequirements as string[])
        : Array.isArray(prefs.specialRequirements)
        ? (prefs.specialRequirements as string[])
        : [],
      indoorOutdoor: (["indoor", "outdoor", "mixed", "other"].includes(String(bodyOverrides.indoorOutdoor))
        ? bodyOverrides.indoorOutdoor
        : ["indoor", "outdoor", "mixed"].includes(String(prefs.indoorOutdoor))
        ? prefs.indoorOutdoor
        : "mixed") as PlanGenerationInput["indoorOutdoor"],
      accessibilityNeeds: Array.isArray(bodyOverrides.accessibilityNeeds)
        ? (bodyOverrides.accessibilityNeeds as string[])
        : Array.isArray(prefs.accessibilityNeeds)
        ? (prefs.accessibilityNeeds as string[])
        : [],
      userPriorities: Array.isArray(bodyOverrides.userPriorities)
        ? (bodyOverrides.userPriorities as string[])
        : Array.isArray(prefs.eventPriorities)
        ? (prefs.eventPriorities as string[])
        : [],
      constraints: bodyOverrides.constraints ? String(bodyOverrides.constraints) : undefined,
    };

    const plan = await generateCompleteEventPlan(planInput);

    return apiSuccess({
      event: serializeDocument(event),
      plan,
      isReviewed: false,
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

    const message = error instanceof Error ? error.message : "AI plan generation failed";
    console.error("POST /api/events/[id]/plan/generate error:", message);
    return apiError(message, "AI_GENERATION_ERROR", 500);
  }
}
