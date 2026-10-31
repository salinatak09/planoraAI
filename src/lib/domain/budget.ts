/**
 * Planora AI - Smart Budget Calculation & Management Engine
 * Pure, authoritative financial business logic adhering to strict calculation rules:
 * 1. Amounts must be finite and nonnegative (reject NaN, Infinity, negative values).
 * 2. Never double-count an expense.
 * 3. Clearly differentiate between Planned Estimates, Actual Spending, and Committed Costs.
 * 4. Treat Contingency Funds as a planned allocation, not as money already spent.
 * 5. Handle rounding cleanly without floating-point artifacts.
 * 6. Explicitly support multi-currency formatting (INR, USD, EUR, GBP, AED).
 */

export type PaymentStatus = "unpaid" | "deposit_paid" | "paid";

export interface BudgetItemInput {
  id?: string;
  _id?: string;
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  isContingency?: boolean;
}

export interface CategoryBudgetSummary {
  category: string;
  estimated: number;
  actual: number;
  committed: number;
  variance: number; // estimated - actual
  isOverspent: boolean; // actual > estimated
  itemCount: number;
}

export interface BudgetFinancialMetrics {
  totalBudget: number;           // Authorized total ceiling ($T$)
  estimatedTotal: number;        // Total planned allocation (\sum estimatedAmount)
  actualSpent: number;           // Actual disbursements made (\sum actualAmount)
  committedCosts: number;        // Contractual commitments (signed/deposits/paid)
  contingencyAllocated: number;  // Planned contingency buffer (planned, not spent)

  // Explicit Remaining Balances
  remainingPlanned: number;      // totalBudget - estimatedTotal (unallocated budget envelope)
  remainingCash: number;         // totalBudget - actualSpent (remaining liquid funds)
  remainingCommitted: number;    // totalBudget - committedCosts (uncommitted capital)

  // Budget Utilization Percentages
  percentPlanned: number;        // (estimatedTotal / totalBudget) * 100
  percentSpent: number;          // (actualSpent / totalBudget) * 100
  percentCommitted: number;      // (committedCosts / totalBudget) * 100

  // Health & Warnings
  isPlannedOverBudget: boolean;  // estimatedTotal > totalBudget
  isActualOverBudget: boolean;   // actualSpent > totalBudget
  isCommittedOverBudget: boolean;// committedCosts > totalBudget
  overrunAmount: number;         // max(0, estimatedTotal - totalBudget)

  // Breakdown & Analysis
  categories: CategoryBudgetSummary[];
  overspentCategoriesCount: number;
}

/**
 * Validates that an amount is a valid, finite, non-negative monetary number.
 */
export function isValidMonetaryAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && !Number.isNaN(value) && value >= 0;
}

/**
 * Rounds a monetary amount to 2 decimal places to avoid floating point precision issues.
 */
export function roundCurrency(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates authoritative financial metrics across a portfolio of budget line items.
 * Adheres strictly to the distinction between planned estimates, actual spending,
 * and contractual commitments without double-counting.
 */
export function calculateBudgetSummary(
  totalBudgetRaw: number,
  items: BudgetItemInput[]
): BudgetFinancialMetrics {
  const totalBudget = isValidMonetaryAmount(totalBudgetRaw) ? roundCurrency(totalBudgetRaw) : 0;

  let estimatedTotal = 0;
  let actualSpent = 0;
  let committedCosts = 0;
  let contingencyAllocated = 0;

  // Category map for category-wise aggregations
  const categoryMap = new Map<
    string,
    { estimated: number; actual: number; committed: number; itemCount: number }
  >();

  for (const item of items) {
    const est = isValidMonetaryAmount(item.estimatedAmount) ? roundCurrency(item.estimatedAmount) : 0;
    const act = isValidMonetaryAmount(item.actualAmount) ? roundCurrency(item.actualAmount) : 0;
    const status = item.paymentStatus || "unpaid";

    // 1. Planned Estimates: Sum of all item targets
    estimatedTotal = roundCurrency(estimatedTotal + est);

    // 2. Actual Spending: Sum of actual disbursements made
    actualSpent = roundCurrency(actualSpent + act);

    // 3. Committed Costs:
    // - If fully paid: committed cost is the actual amount disbursed.
    // - If deposit paid (contract active): committed obligation is max(actual paid so far, estimated target).
    // - If unpaid: not yet contractually committed (0 committed cost).
    let itemCommitted = 0;
    if (status === "paid") {
      itemCommitted = act;
    } else if (status === "deposit_paid") {
      itemCommitted = Math.max(act, est);
    } else {
      itemCommitted = 0;
    }
    committedCosts = roundCurrency(committedCosts + itemCommitted);

    // 4. Contingency: Marked explicitly or in contingency/reserve category
    const isContingency =
      item.isContingency === true ||
      item.category.toLowerCase().includes("contingency") ||
      item.category.toLowerCase().includes("reserve");

    if (isContingency) {
      contingencyAllocated = roundCurrency(contingencyAllocated + est);
    }

    // Category aggregation
    const catName = item.category.trim() || "Uncategorized";
    const existing = categoryMap.get(catName) || { estimated: 0, actual: 0, committed: 0, itemCount: 0 };
    categoryMap.set(catName, {
      estimated: roundCurrency(existing.estimated + est),
      actual: roundCurrency(existing.actual + act),
      committed: roundCurrency(existing.committed + itemCommitted),
      itemCount: existing.itemCount + 1,
    });
  }

  // Explicit remaining balances
  const remainingPlanned = roundCurrency(totalBudget - estimatedTotal);
  const remainingCash = roundCurrency(totalBudget - actualSpent);
  const remainingCommitted = roundCurrency(totalBudget - committedCosts);

  // Utilization percentages
  const percentPlanned = totalBudget > 0 ? roundCurrency((estimatedTotal / totalBudget) * 100) : 0;
  const percentSpent = totalBudget > 0 ? roundCurrency((actualSpent / totalBudget) * 100) : 0;
  const percentCommitted = totalBudget > 0 ? roundCurrency((committedCosts / totalBudget) * 100) : 0;

  // Warning conditions
  const isPlannedOverBudget = estimatedTotal > totalBudget;
  const isActualOverBudget = actualSpent > totalBudget;
  const isCommittedOverBudget = committedCosts > totalBudget;
  const overrunAmount = Math.max(0, roundCurrency(estimatedTotal - totalBudget));

  // Build sorted category summaries
  const categories: CategoryBudgetSummary[] = Array.from(categoryMap.entries()).map(
    ([category, stats]) => {
      const variance = roundCurrency(stats.estimated - stats.actual);
      const isOverspent = stats.actual > stats.estimated && stats.estimated > 0;
      return {
        category,
        estimated: stats.estimated,
        actual: stats.actual,
        committed: stats.committed,
        variance,
        isOverspent,
        itemCount: stats.itemCount,
      };
    }
  );

  const overspentCategoriesCount = categories.filter((c) => c.isOverspent).length;

  return {
    totalBudget,
    estimatedTotal,
    actualSpent,
    committedCosts,
    contingencyAllocated,
    remainingPlanned,
    remainingCash,
    remainingCommitted,
    percentPlanned,
    percentSpent,
    percentCommitted,
    isPlannedOverBudget,
    isActualOverBudget,
    isCommittedOverBudget,
    overrunAmount,
    categories,
    overspentCategoriesCount,
  };
}

/**
 * Formats a monetary amount explicitly based on selected currency without silently mixing currencies.
 * Supports INR with Indian numbering system (Lakhs/Crores), USD, EUR, GBP, and AED.
 */
export function formatBudgetCurrency(amount: number, currency = "₹"): string {
  const safeAmount = Number.isFinite(amount) ? roundCurrency(amount) : 0;
  const isNegative = safeAmount < 0;
  const absAmount = Math.abs(safeAmount);

  const cleanCurrency = currency.trim().toUpperCase();

  let formatted = "";

  if (currency === "₹" || cleanCurrency === "INR") {
    formatted = `₹${absAmount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  } else if (currency === "$" || cleanCurrency === "USD") {
    formatted = `$${absAmount.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  } else if (currency === "€" || cleanCurrency === "EUR") {
    formatted = `€${absAmount.toLocaleString("en-IE", {
      maximumFractionDigits: 0,
    })}`;
  } else if (currency === "£" || cleanCurrency === "GBP") {
    formatted = `£${absAmount.toLocaleString("en-GB", {
      maximumFractionDigits: 0,
    })}`;
  } else if (cleanCurrency === "AED") {
    formatted = `AED ${absAmount.toLocaleString("en-AE", {
      maximumFractionDigits: 0,
    })}`;
  } else {
    formatted = `${currency}${absAmount.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Standard event archetype category distribution benchmarks.
 * Prepares the budget module to accept AI suggestions while ensuring
 * application code authoritatively calculates rounded integer currency amounts.
 */
export interface SuggestedCategoryAllocation {
  category: string;
  percentage: number;
  recommendedAmount: number;
  description: string;
  isContingency?: boolean;
}

export function suggestCategoryAllocations(
  totalBudget: number,
  eventType: string = "wedding"
): SuggestedCategoryAllocation[] {
  const safeBudget = Math.max(0, roundCurrency(totalBudget));

  // Archetype distribution benchmarks
  let distribution: { category: string; percentage: number; description: string; isContingency?: boolean }[] = [];

  switch (eventType.toLowerCase()) {
    case "wedding":
      distribution = [
        { category: "Venue & Estate", percentage: 35, description: "Palace hire, lawn staging, and overnight suites" },
        { category: "Catering & Spirits", percentage: 25, description: "Multi-course banquets, live counters, and bar service" },
        { category: "Decor & Lighting", percentage: 15, description: "Theme florals, architectural lighting, and mandap/altar" },
        { category: "Photography & Film", percentage: 10, description: "Cinematography team, drones, and digital edits" },
        { category: "Music & Entertainment", percentage: 8, description: "Live symphony, folk artists, and DJ staging" },
        { category: "Contingency Safety Reserve", percentage: 7, description: "Unforeseen weather contingencies, overtime fees", isContingency: true },
      ];
      break;

    case "birthday":
      distribution = [
        { category: "Venue & Private Space", percentage: 30, description: "Rooftop lounge, private room, or sanctuary" },
        { category: "Food, Bar & Pastry", percentage: 35, description: "Curated canapes, artisanal cake, and mocktails" },
        { category: "Sound, DJ & Visuals", percentage: 15, description: "Sound setup, custom playlist DJ, and projection" },
        { category: "Decor, Photo & Favors", percentage: 12, description: "Balloon art, Polaroid booth, and party gifts" },
        { category: "Contingency Reserve", percentage: 8, description: "Last-minute guest additions and service fees", isContingency: true },
      ];
      break;

    case "anniversary":
      distribution = [
        { category: "Venue & Dining Room", percentage: 35, description: "Exclusive conservatory or lakefront pavilion" },
        { category: "Gourmet Dining & Wine", percentage: 30, description: "Plated tasting menu with sommelier pairing" },
        { category: "Atmospheric Decor & Florals", percentage: 15, description: "Candlelight ambiance, white florals, and harpist" },
        { category: "Portrait Photography", percentage: 12, description: "Milestone couple and family heirloom portraits" },
        { category: "Contingency Reserve", percentage: 8, description: "Special requests and hospitality buffer", isContingency: true },
      ];
      break;

    case "community":
    default:
      distribution = [
        { category: "Civic Pavilion & Permits", percentage: 25, description: "Park grounds, staging permits, and sanitation" },
        { category: "Staging, AV & Lighting", percentage: 25, description: "Public address sound system, stage, and floodlights" },
        { category: "Food Trucks & Refreshments", percentage: 20, description: "Community concessions and hydration stations" },
        { category: "Publicity & Signage", percentage: 10, description: "Wayfinding banners, flyers, and event wristbands" },
        { category: "Security & First Aid", percentage: 10, description: "Volunteer radios, first aid booth, and marshals" },
        { category: "Emergency Contingency Reserve", percentage: 10, description: "Weather covers and municipal compliance buffer", isContingency: true },
      ];
      break;
  }

  // Authoritatively calculate exact rounded amounts ensuring sum equals totalBudget
  let allocatedSum = 0;
  const result: SuggestedCategoryAllocation[] = distribution.map((item, idx) => {
    // If last item, assign remaining balance to avoid fractional penny/rupee drift
    const isLast = idx === distribution.length - 1;
    let amount = 0;
    if (isLast) {
      amount = Math.max(0, roundCurrency(safeBudget - allocatedSum));
    } else {
      amount = roundCurrency(Math.floor((safeBudget * item.percentage) / 100));
      allocatedSum = roundCurrency(allocatedSum + amount);
    }

    return {
      category: item.category,
      percentage: item.percentage,
      recommendedAmount: amount,
      description: item.description,
      isContingency: item.isContingency,
    };
  });

  return result;
}
