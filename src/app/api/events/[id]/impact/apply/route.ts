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
  updateEventWithConcurrencyCheck,
  recordChangeLog,
  batchUpdateTaskDueDates,
  batchUpdateBudgetEstimated,
  updateEventVendorsAuditNotes,
  AuthorizationError,
  ResourceNotFoundError,
  ConcurrencyError,
} from "@/lib/db/services";
import { applyChangeProposalSchema } from "@/lib/validation/schemas";
import {
  calculateFinancialImpact,
  calculateTimelineImpact,
} from "@/lib/domain/change-impact";
import { isValidObjectId, toObjectId } from "@/lib/utils/objectid";
import type { BookingStatus } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/events/[id]/impact/apply
 * Applies a user-reviewed and confirmed change proposal to the event.
 * Enforces strict optimistic concurrency control against baseVersion.
 * Never automatically cancels external bookings; records an immutable audit log.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to apply replanning changes");
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

    const parsed = applyChangeProposalSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { baseVersion, changes, acceptedAdjustments } = parsed.data;

    // 1. Retrieve current event and check version concurrency
    const currentEvent = await getEventById(id, user.userId);
    const currentVer = currentEvent.version ?? 1;

    if (currentVer !== baseVersion) {
      return apiError(
        `Stale Proposal Conflict: The event has been modified by another edit (current version ${currentVer}, proposal version ${baseVersion}). Please re-evaluate change impact.`,
        "STALE_PROPOSAL",
        409,
        { currentVersion: currentVer, baseVersion }
      );
    }

    // 2. Retrieve child records to re-calculate authoritative impact
    const [budgetItems, tasks, eventVendors] = await Promise.all([
      getEventBudgetItems(id, user.userId),
      getEventTasksList(id, user.userId),
      getEventVendorsWithDetails(id, user.userId),
    ]);

    const financialImpact = calculateFinancialImpact({
      currentEvent,
      proposedBudget: changes.totalBudget,
      proposedGuestCount: changes.guestCount,
      currentBudgetItems: budgetItems,
      vendorStatusChanges: changes.vendorStatusChanges,
      eventVendors,
    });

    const timelineImpact = calculateTimelineImpact({
      currentDate: currentEvent.date,
      proposedDate: changes.date,
      tasks,
      eventVendors,
    });

    // 3. Prepare Event Updates
    const eventUpdates: Record<string, unknown> = {};
    if (changes.guestCount !== undefined) eventUpdates.guestCount = changes.guestCount;
    if (changes.totalBudget !== undefined) eventUpdates.totalBudget = changes.totalBudget;
    if (changes.date) eventUpdates.date = changes.date;
    if (changes.location) eventUpdates.location = changes.location;
    if (changes.theme) eventUpdates.theme = changes.theme;

    // Apply with optimistic concurrency verification
    const updatedEvent = await updateEventWithConcurrencyCheck(
      id,
      user.userId,
      eventUpdates,
      baseVersion
    );

    let budgetAdjusted = false;
    const appliedBudgetDetails: Array<{ category: string; previousEstimated: number; newEstimated: number }> = [];

    // 4. Apply Budget Adjustments if accepted
    if (acceptedAdjustments?.applyBudgetAdjustments && financialImpact.affectedBudgetCategories.length > 0) {
      const budgetAdjustments = financialImpact.affectedBudgetCategories.map((cat) => ({
        category: cat.category,
        newEstimated: cat.suggestedNewEstimated,
      }));

      await batchUpdateBudgetEstimated(id, user.userId, budgetAdjustments);
      budgetAdjusted = true;

      for (const cat of financialImpact.affectedBudgetCategories) {
        appliedBudgetDetails.push({
          category: cat.category,
          previousEstimated: cat.currentEstimated,
          newEstimated: cat.suggestedNewEstimated,
        });
      }
    }

    // 5. Apply Task Reschedules if accepted
    let tasksRescheduledCount = 0;
    const appliedTasksRescheduled: Array<{
      taskId: string;
      title: string;
      previousDueDate: string;
      newDueDate: string;
    }> = [];

    if (acceptedAdjustments?.applyTaskReschedules && timelineImpact.affectedTasks.length > 0) {
      const selectedIds = acceptedAdjustments.selectedTaskIds;
      const tasksToMove = selectedIds && selectedIds.length > 0
        ? timelineImpact.affectedTasks.filter((t) => selectedIds.includes(t.taskId))
        : timelineImpact.affectedTasks;

      if (tasksToMove.length > 0) {
        await batchUpdateTaskDueDates(
          id,
          user.userId,
          tasksToMove.map((t) => ({ taskId: t.taskId, newDueDate: t.suggestedNewDueDate }))
        );
        tasksRescheduledCount = tasksToMove.length;

        for (const t of tasksToMove) {
          appliedTasksRescheduled.push({
            taskId: t.taskId,
            title: t.taskTitle,
            previousDueDate: t.currentDueDate,
            newDueDate: t.suggestedNewDueDate,
          });
        }
      }
    }

    // 6. Update Vendor Audit Notes & Status (Never automatically cancel without explicit user instruction)
    const vendorAuditUpdates: Array<{
      eventVendorId: string;
      note: string;
      newStatus?: BookingStatus;
    }> = [];

    // If explicit vendor status changes were provided in changes
    if (changes.vendorStatusChanges && changes.vendorStatusChanges.length > 0) {
      for (const vc of changes.vendorStatusChanges) {
        vendorAuditUpdates.push({
          eventVendorId: vc.eventVendorId,
          note: `Booking status updated to ${vc.newStatus} via approved replanning proposal.`,
          newStatus: vc.newStatus,
        });
      }
    }

    // Add manual confirmation notes for date shifts
    if (timelineImpact.daysShifted !== 0 && timelineImpact.vendorsRequiringConfirmation.length > 0) {
      for (const v of timelineImpact.vendorsRequiringConfirmation) {
        vendorAuditUpdates.push({
          eventVendorId: v.eventVendorId,
          note: `Event date changed to ${changes.date}. Manual calendar confirmation required with ${v.vendorName}.`,
        });
      }
    }

    if (vendorAuditUpdates.length > 0) {
      await updateEventVendorsAuditNotes(id, user.userId, vendorAuditUpdates);
    }

    // 7. Record Immutable Change Log (Audit Trail)
    const changeSummaryParts: string[] = [];
    if (changes.guestCount) changeSummaryParts.push(`Guests: ${currentEvent.guestCount} -> ${changes.guestCount}`);
    if (changes.totalBudget) changeSummaryParts.push(`Budget: ${currentEvent.currency}${currentEvent.totalBudget.toLocaleString()} -> ${currentEvent.currency}${changes.totalBudget.toLocaleString()}`);
    if (changes.date) changeSummaryParts.push(`Date: ${currentEvent.date} -> ${changes.date}`);
    if (changes.location) changeSummaryParts.push(`Location: "${changes.location}"`);
    if (changes.theme) changeSummaryParts.push(`Theme: "${changes.theme}"`);
    if (changes.vendorStatusChanges?.length) changeSummaryParts.push(`Vendors Updated: ${changes.vendorStatusChanges.length}`);

    const summaryText = changeSummaryParts.join(" | ") || "Event replanning applied";

    const changeLog = await recordChangeLog({
      eventId: toObjectId(id),
      ownerId: toObjectId(user.userId),
      version: updatedEvent.version ?? baseVersion + 1,
      timestamp: new Date(),
      summary: summaryText,
      changes: {
        guestCount: changes.guestCount
          ? { before: currentEvent.guestCount, after: changes.guestCount }
          : undefined,
        totalBudget: changes.totalBudget
          ? { before: currentEvent.totalBudget, after: changes.totalBudget }
          : undefined,
        date: changes.date
          ? { before: currentEvent.date, after: changes.date, daysShifted: timelineImpact.daysShifted }
          : undefined,
        location: changes.location
          ? { before: currentEvent.location, after: changes.location }
          : undefined,
        theme: changes.theme
          ? { before: currentEvent.theme, after: changes.theme }
          : undefined,
      },
      appliedModifications: {
        budgetAdjusted,
        budgetDetails: appliedBudgetDetails,
        tasksRescheduledCount,
        tasksRescheduled: appliedTasksRescheduled,
        vendorsRequiringConfirmationCount: timelineImpact.vendorsRequiringConfirmation.length,
        vendorsRequiringConfirmation: timelineImpact.vendorsRequiringConfirmation.map((v) => ({
          eventVendorId: v.eventVendorId,
          vendorName: v.vendorName,
          category: v.category,
          notes: v.notes,
        })),
      },
      aiRationale: `Replanning executed at version ${updatedEvent.version}. Feasibility: ${
        financialImpact.isBudgetFeasible ? "Balanced" : "Adjusted with trade-offs"
      }.`,
    });

    return apiSuccess({
      updatedEvent,
      newVersion: updatedEvent.version,
      changeLogId: changeLog._id?.toString(),
      appliedSummary: {
        budgetAdjusted,
        tasksRescheduledCount,
        vendorsRequiringConfirmationCount: timelineImpact.vendorsRequiringConfirmation.length,
        summaryText,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ConcurrencyError || (err as { name?: string })?.name === "ConcurrencyError") {
      return apiError(
        err instanceof Error ? err.message : "Concurrent edit detected",
        "STALE_PROPOSAL",
        409
      );
    }
    if (err instanceof AuthorizationError || (err as { name?: string })?.name === "AuthorizationError") {
      return apiError("You do not have permission to apply changes to this event", "FORBIDDEN", 403);
    }
    if (err instanceof ResourceNotFoundError || (err as { name?: string })?.name === "ResourceNotFoundError") {
      return apiError("Event not found", "NOT_FOUND", 404);
    }
    return apiError(
      err instanceof Error ? err.message : "Failed to apply replanning changes",
      "SERVER_ERROR",
      500
    );
  }
}
