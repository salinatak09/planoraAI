import { describe, it, expect } from "vitest";
import { calculateBudgetMetrics, formatCurrency } from "@/lib/utils/currency";
import { getDaysRemaining } from "@/lib/utils/date";

describe("Domain Business Logic", () => {
  describe("calculateBudgetMetrics", () => {
    it("should calculate correct percentage and remaining balance", () => {
      const metrics = calculateBudgetMetrics(20000, 15000);
      expect(metrics.total).toBe(20000);
      expect(metrics.spent).toBe(15000);
      expect(metrics.remaining).toBe(5000);
      expect(metrics.percentageSpent).toBe(75);
      expect(metrics.isOverBudget).toBe(false);
    });

    it("should flag over budget when spent exceeds total", () => {
      const metrics = calculateBudgetMetrics(10000, 12500);
      expect(metrics.remaining).toBe(-2500);
      expect(metrics.isOverBudget).toBe(true);
      expect(metrics.percentageSpent).toBe(100);
    });

    it("should safely handle 0 total budget without dividing by zero", () => {
      const metrics = calculateBudgetMetrics(0, 0);
      expect(metrics.percentageSpent).toBe(0);
      expect(metrics.isOverBudget).toBe(false);
    });
  });

  describe("formatCurrency", () => {
    it("should format dollar amounts properly", () => {
      expect(formatCurrency(5000)).toBe("$5,000");
      expect(formatCurrency(0)).toBe("$0");
    });
  });

  describe("getDaysRemaining", () => {
    it("should calculate positive days for future dates", () => {
      // Future date 10 days ahead
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const days = getDaysRemaining(future.toISOString());
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);
    });
  });
});
