/**
 * Formats a numeric amount into USD currency string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates budget variance and percentage spent.
 */
export function calculateBudgetMetrics(budgetTotal: number, budgetSpent: number) {
  const safeTotal = Math.max(0, budgetTotal);
  const safeSpent = Math.max(0, budgetSpent);
  const remaining = safeTotal - safeSpent;
  const percentageSpent = safeTotal > 0 ? Math.min(100, Math.round((safeSpent / safeTotal) * 100)) : 0;
  const isOverBudget = safeSpent > safeTotal;

  return {
    total: safeTotal,
    spent: safeSpent,
    remaining,
    percentageSpent,
    isOverBudget,
  };
}
