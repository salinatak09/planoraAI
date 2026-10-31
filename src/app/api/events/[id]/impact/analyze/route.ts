import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/utils/response";
import {
  getEventById,
  getEventBudgetItems,
  getEventTasksList,
  getEventVendorsWithDetails,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import { proposedChangesInputSchema } from "@/lib/validation/schemas";
import {
  calculateFinancialImpact,
  calculateTimelineImpact,
} from "@/lib/domain/change-impact";
import { generateAIChangeAnalysis } from "@/lib/ai/change-impact";
import { isValidObjectId } from "@/lib/utils/objectid";
import type { ChangeProposal } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/events/[id]/impact/analyze
 * Analyzes the holistic impact of proposed changes against an existing event plan.
 * Calculates exact known financial and timeline facts in application code and consults
 * Gemini 3.8 for strategic trade-offs, alternatives, and risk mitigation.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to analyze change impact");
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
      return apiError("Invalid JSON body", "BAD_REQUEST", 400);
    }

    const parsed = proposedChangesInputSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const proposed = parsed.data;

    // 1. Retrieve current event and relevant records
    const event = await getEventById(id, user.userId);
    const [budgetItems, tasks, eventVendors] = await Promise.all([
      getEventBudgetItems(id, user.userId),
      getEventTasksList(id, user.userId),
      getEventVendorsWithDetails(id, user.userId),
    ]);

    // 2. Compute known financial impacts using application code
    const financialImpact = calculateFinancialImpact({
      currentEvent: event,
      proposedBudget: proposed.totalBudget,
      proposedGuestCount: proposed.guestCount,
      currentBudgetItems: budgetItems,
      vendorStatusChanges: proposed.vendorStatusChanges,
      eventVendors,
    });

    // 3. Compute timeline impacts using application code
    const timelineImpact = calculateTimelineImpact({
      currentDate: event.date,
      proposedDate: proposed.date,
      tasks,
      eventVendors,
    });

    // 4. Assemble before/after comparison facts
    const changes: ChangeProposal["changes"] = {};

    if (proposed.guestCount !== undefined && proposed.guestCount !== event.guestCount) {
      changes.guestCount = { before: event.guestCount, after: proposed.guestCount };
    }

    if (proposed.totalBudget !== undefined && proposed.totalBudget !== event.totalBudget) {
      changes.totalBudget = { before: event.totalBudget, after: proposed.totalBudget };
    }

    if (proposed.date && proposed.date !== event.date) {
      changes.date = {
        before: event.date,
        after: proposed.date,
        daysShifted: timelineImpact.daysShifted,
      };
    }

    if (proposed.location && proposed.location !== event.location) {
      changes.location = { before: event.location, after: proposed.location };
    }

    if (proposed.theme && proposed.theme !== event.theme) {
      changes.theme = { before: event.theme, after: proposed.theme };
    }

    if (proposed.vendorStatusChanges && proposed.vendorStatusChanges.length > 0) {
      changes.vendorChanges = proposed.vendorStatusChanges.map((vc) => {
        const match = eventVendors.find((ev) => (ev._id?.toString() || "") === vc.eventVendorId);
        return {
          eventVendorId: vc.eventVendorId,
          vendorName: match?.vendor?.name || "Contracted Vendor",
          category: match?.vendor?.category || "Service",
          beforeStatus: match?.bookingStatus || "booked",
          afterStatus: vc.newStatus,
        };
      });
    }

    // 5. Ask Gemini to explain trade-offs and suggest alternatives
    const aiAnalysis = await generateAIChangeAnalysis({
      currentEvent: event,
      changes,
      financialImpact,
      timelineImpact,
    });

    const proposal: ChangeProposal = {
      proposalId: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      eventId: id,
      baseVersion: event.version ?? 1,
      generatedAt: new Date().toISOString(),
      changes,
      financialImpact,
      timelineImpact,
      vendorImpact: {
        vendorsRequiringConfirmation: timelineImpact.vendorsRequiringConfirmation,
      },
      aiAnalysis,
      isStale: false,
    };

    return apiSuccess({ proposal });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError || (err as { name?: string })?.name === "AuthorizationError") {
      return apiError("You do not have permission to analyze this event", "FORBIDDEN", 403);
    }
    if (err instanceof ResourceNotFoundError || (err as { name?: string })?.name === "ResourceNotFoundError") {
      return apiError("Event not found", "NOT_FOUND", 404);
    }
    return apiError(
      err instanceof Error ? err.message : "Failed to analyze change impact",
      "SERVER_ERROR",
      500
    );
  }
}
