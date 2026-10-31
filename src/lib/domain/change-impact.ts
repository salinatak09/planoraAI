import { roundCurrency } from "@/lib/domain/budget";
import type {
  EventModel,
  BudgetItemModel,
  TaskModel,
  EventVendorModel,
  BookingStatus,
} from "@/lib/types";

export interface CalculateFinancialImpactParams {
  currentEvent: EventModel;
  proposedBudget?: number;
  proposedGuestCount?: number;
  currentBudgetItems: BudgetItemModel[];
  vendorStatusChanges?: Array<{
    eventVendorId: string;
    newStatus: BookingStatus;
  }>;
  eventVendors?: Array<
    EventVendorModel & {
      vendor?: { name: string; category: string };
    }
  >;
}

export interface AffectedBudgetCategory {
  category: string;
  currentEstimated: number;
  suggestedNewEstimated: number;
  difference: number;
  rationale: string;
  isVerified: boolean; // Distinguish verified facts from AI estimates
}

export interface FinancialImpactResult {
  currentTotalBudget: number;
  proposedTotalBudget: number;
  budgetDelta: number;
  currentCommitted: number;
  currentActualSpend: number;
  projectedTotalCost: number;
  projectedVariance: number;
  isBudgetFeasible: boolean;
  deficitAmount?: number;
  affectedBudgetCategories: AffectedBudgetCategory[];
}

/**
 * Calculates known financial impacts using authoritative application code.
 * Clearly distinguishes verified ledger facts from projected estimates.
 */
export function calculateFinancialImpact(
  params: CalculateFinancialImpactParams
): FinancialImpactResult {
  const {
    currentEvent,
    proposedBudget,
    proposedGuestCount,
    currentBudgetItems,
    vendorStatusChanges = [],
    eventVendors = [],
  } = params;

  const currentTotalBudget = roundCurrency(currentEvent.totalBudget);
  const proposedTotalBudget =
    proposedBudget !== undefined ? roundCurrency(proposedBudget) : currentTotalBudget;
  const budgetDelta = roundCurrency(proposedTotalBudget - currentTotalBudget);

  const currentCommitted = roundCurrency(
    currentBudgetItems.reduce((acc, item) => acc + item.estimatedAmount, 0)
  );
  const currentActualSpend = roundCurrency(
    currentBudgetItems.reduce((acc, item) => acc + item.actualAmount, 0)
  );

  const affectedBudgetCategories: AffectedBudgetCategory[] = [];
  let projectedNetCostAdjustment = 0;

  // 1. Calculate Guest Count Scaling Impact
  if (proposedGuestCount !== undefined && proposedGuestCount !== currentEvent.guestCount) {
    const guestDelta = proposedGuestCount - currentEvent.guestCount;
    const isIncrease = guestDelta > 0;

    // Identify existing catering or per-guest allocation
    const cateringCategories = ["catering", "food", "banquet", "beverage", "dining"];
    const cateringItems = currentBudgetItems.filter((b) =>
      cateringCategories.some((cat) => b.category.toLowerCase().includes(cat))
    );

    const existingCateringEstimated = cateringItems.reduce((sum, b) => sum + b.estimatedAmount, 0);

    let perHeadRate: number;
    if (existingCateringEstimated > 0 && currentEvent.guestCount > 0) {
      perHeadRate = existingCateringEstimated / currentEvent.guestCount;
    } else {
      // Conservative regional benchmark: ₹2,500/head in INR or $75/head in other currencies
      perHeadRate = currentEvent.currency === "₹" ? 2500 : 75;
    }

    const cateringCostDelta = roundCurrency(perHeadRate * guestDelta);
    projectedNetCostAdjustment += cateringCostDelta;

    const currentCatEst = existingCateringEstimated > 0 ? existingCateringEstimated : roundCurrency(perHeadRate * currentEvent.guestCount);
    const newCatEst = Math.max(0, roundCurrency(currentCatEst + cateringCostDelta));

    affectedBudgetCategories.push({
      category: cateringItems[0]?.category || "Catering & Banquet",
      currentEstimated: currentCatEst,
      suggestedNewEstimated: newCatEst,
      difference: cateringCostDelta,
      rationale: `Projected ${isIncrease ? "increase" : "savings"} for ${Math.abs(guestDelta)} ${
        isIncrease ? "additional" : "fewer"
      } guests at ${currentEvent.currency}${Math.round(perHeadRate).toLocaleString()} per guest estimate.`,
      isVerified: false, // Estimate based on rate benchmarks
    });
  }

  // 2. Calculate Vendor Status Change Impact
  if (vendorStatusChanges.length > 0) {
    for (const change of vendorStatusChanges) {
      const match = eventVendors.find(
        (ev) => (ev._id?.toString() || "") === change.eventVendorId
      );
      if (!match) continue;

      const vendorName = match.vendor?.name || "Vendor";
      const category = match.vendor?.category || "Contracted Services";
      const quoted = roundCurrency(match.quotedAmount);

      // If a previously booked vendor was cancelled
      if (
        (match.bookingStatus === "booked" || match.bookingStatus === "shortlisted") &&
        change.newStatus === "declined"
      ) {
        projectedNetCostAdjustment -= quoted;
        affectedBudgetCategories.push({
          category,
          currentEstimated: quoted,
          suggestedNewEstimated: 0,
          difference: -quoted,
          rationale: `Freed up ${currentEvent.currency}${quoted.toLocaleString()} previously allocated to ${vendorName} (status changed to cancelled).`,
          isVerified: true, // Verified ledger figure from quotation
        });
      }
    }
  }

  const projectedTotalCost = roundCurrency(Math.max(0, currentCommitted + projectedNetCostAdjustment));
  const projectedVariance = roundCurrency(proposedTotalBudget - projectedTotalCost);

  // Feasibility evaluation:
  // Cannot reduce budget ceiling below money already disbursed
  const violatesDisbursed = proposedTotalBudget < currentActualSpend;
  const violatesProjectedCost = projectedTotalCost > proposedTotalBudget;

  const isBudgetFeasible = !violatesDisbursed && !violatesProjectedCost;
  const deficitAmount = isBudgetFeasible
    ? undefined
    : roundCurrency(
        Math.max(
          violatesDisbursed ? currentActualSpend - proposedTotalBudget : 0,
          violatesProjectedCost ? projectedTotalCost - proposedTotalBudget : 0
        )
      );

  return {
    currentTotalBudget,
    proposedTotalBudget,
    budgetDelta,
    currentCommitted,
    currentActualSpend,
    projectedTotalCost,
    projectedVariance,
    isBudgetFeasible,
    deficitAmount,
    affectedBudgetCategories,
  };
}

export interface AffectedTaskItem {
  taskId: string;
  taskTitle: string;
  currentDueDate: string;
  suggestedNewDueDate: string;
  reason: string;
  urgency: "low" | "medium" | "high" | "urgent";
}

export interface VendorConfirmationItem {
  eventVendorId: string;
  vendorName: string;
  category: string;
  currentStatus: string;
  actionRequired: string;
  notes: string;
}

export interface TimelineImpactResult {
  daysShifted: number;
  affectedTasks: AffectedTaskItem[];
  vendorsRequiringConfirmation: VendorConfirmationItem[];
}

/**
 * Calculates timeline and date-shift impacts on tasks and vendor bookings.
 * Never automatically cancels external bookings.
 */
export function calculateTimelineImpact(params: {
  currentDate: string;
  proposedDate?: string;
  tasks: TaskModel[];
  eventVendors: Array<
    EventVendorModel & {
      vendor?: { name: string; category: string };
    }
  >;
}): TimelineImpactResult {
  const { currentDate, proposedDate, tasks, eventVendors } = params;

  if (!proposedDate || proposedDate === currentDate) {
    return {
      daysShifted: 0,
      affectedTasks: [],
      vendorsRequiringConfirmation: [],
    };
  }

  const curDateObj = new Date(currentDate);
  const propDateObj = new Date(proposedDate);

  const diffMs = propDateObj.getTime() - curDateObj.getTime();
  const daysShifted = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const todayStr = new Date().toISOString().split("T")[0];
  const isCompressed = daysShifted < 0;

  // 1. Reschedule Pending Tasks
  const affectedTasks: AffectedTaskItem[] = [];
  const pendingTasks = tasks.filter((t) => t.status !== "completed");

  for (const task of pendingTasks) {
    const taskDateObj = new Date(task.dueDate);
    if (Number.isNaN(taskDateObj.getTime())) continue;

    taskDateObj.setDate(taskDateObj.getDate() + daysShifted);
    let newDueDateStr = taskDateObj.toISOString().split("T")[0];

    // Clamp: Task cannot be scheduled in the past
    if (newDueDateStr < todayStr) {
      newDueDateStr = todayStr;
    }

    // Clamp: Task cannot be scheduled after the event date
    if (newDueDateStr > proposedDate) {
      newDueDateStr = proposedDate;
    }

    let urgency = task.priority;
    if (isCompressed && Math.abs(daysShifted) >= 14 && urgency === "medium") {
      urgency = "high";
    }

    affectedTasks.push({
      taskId: task._id?.toString() || "",
      taskTitle: task.title,
      currentDueDate: task.dueDate,
      suggestedNewDueDate: newDueDateStr,
      reason: `Event date moved by ${Math.abs(daysShifted)} days (${
        daysShifted > 0 ? "postponed" : "advanced"
      }).`,
      urgency,
    });
  }

  // 2. Identify Booked Vendors Requiring Manual Reconfirmation
  const vendorsRequiringConfirmation: VendorConfirmationItem[] = [];

  for (const ev of eventVendors) {
    if (ev.bookingStatus === "booked" || ev.bookingStatus === "shortlisted") {
      const vendorName = ev.vendor?.name || "Contracted Vendor";
      const category = ev.vendor?.category || "Service";

      vendorsRequiringConfirmation.push({
        eventVendorId: ev._id?.toString() || "",
        vendorName,
        category,
        currentStatus: ev.bookingStatus,
        actionRequired: "Manual Date Reconfirmation Required",
        notes: `Event date shifted from ${currentDate} to ${proposedDate} (${Math.abs(
          daysShifted
        )} days ${daysShifted > 0 ? "later" : "earlier"}). Reach out to verify availability and lock the new date.`,
      });
    }
  }

  return {
    daysShifted,
    affectedTasks,
    vendorsRequiringConfirmation,
  };
}
