import { describe, it, expect } from "vitest";
import {
  calculateBudgetSummary,
  formatBudgetCurrency,
  isValidMonetaryAmount,
  roundCurrency,
  suggestCategoryAllocations,
  type BudgetItemInput,
} from "@/lib/domain/budget";
import { createBudgetItemSchema, updateBudgetItemSchema } from "@/lib/validation/schemas";

describe("Smart Budget Manager - Domain Engine & Rules", () => {
  describe("1. Monetary Amount Validation & Precision Rounding", () => {
    it("should accept valid finite, non-negative numbers", () => {
      expect(isValidMonetaryAmount(0)).toBe(true);
      expect(isValidMonetaryAmount(100)).toBe(true);
      expect(isValidMonetaryAmount(1250000.5)).toBe(true);
    });

    it("should reject negative numbers, NaN, Infinity, and non-numeric inputs", () => {
      expect(isValidMonetaryAmount(-1)).toBe(false);
      expect(isValidMonetaryAmount(-0.01)).toBe(false);
      expect(isValidMonetaryAmount(NaN)).toBe(false);
      expect(isValidMonetaryAmount(Infinity)).toBe(false);
      expect(isValidMonetaryAmount(-Infinity)).toBe(false);
      expect(isValidMonetaryAmount("5000" as unknown as number)).toBe(false);
      expect(isValidMonetaryAmount(null as unknown as number)).toBe(false);
      expect(isValidMonetaryAmount(undefined as unknown as number)).toBe(false);
    });

    it("should round floating point values to 2 decimals without floating-point drift", () => {
      // 0.1 + 0.2 = 0.30000000000000004 in raw IEEE 754
      expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
      expect(roundCurrency(1234.567)).toBe(1234.57);
      expect(roundCurrency(1234.564)).toBe(1234.56);
      expect(roundCurrency(NaN)).toBe(0);
    });

    it("Zod schema should enforce finite, non-negative monetary amounts", () => {
      const valid = createBudgetItemSchema.safeParse({
        category: "Venue",
        description: "Grand Ballroom deposit",
        estimatedAmount: 500000,
        actualAmount: 250000,
        paymentStatus: "deposit_paid",
      });
      expect(valid.success).toBe(true);

      const invalidNegative = createBudgetItemSchema.safeParse({
        category: "Venue",
        description: "Grand Ballroom",
        estimatedAmount: -100,
        actualAmount: 0,
      });
      expect(invalidNegative.success).toBe(false);

      const invalidNaN = createBudgetItemSchema.safeParse({
        category: "Venue",
        description: "Grand Ballroom",
        estimatedAmount: NaN,
        actualAmount: 0,
      });
      expect(invalidNaN.success).toBe(false);

      const validUpdate = updateBudgetItemSchema.safeParse({
        estimatedAmount: 600000,
        paymentStatus: "paid",
      });
      expect(validUpdate.success).toBe(true);
    });
  });

  describe("2. Totals & Anti-Double-Counting Calculation Rules", () => {
    it("should calculate estimated total, actual disbursements, and committed costs accurately", () => {
      const totalBudget = 1000000;
      const items: BudgetItemInput[] = [
        {
          id: "item-1",
          category: "Catering",
          description: "Full Banquet",
          estimatedAmount: 400000,
          actualAmount: 400000,
          paymentStatus: "paid", // Paid: committed = actual (400000)
        },
        {
          id: "item-2",
          category: "Photography",
          description: "Wedding Cinematography",
          estimatedAmount: 200000,
          actualAmount: 50000,
          paymentStatus: "deposit_paid", // Deposit: committed = max(act, est) = 200000
        },
        {
          id: "item-3",
          category: "Florals",
          description: "Table Florals",
          estimatedAmount: 100000,
          actualAmount: 0,
          paymentStatus: "unpaid", // Unpaid: committed = 0
        },
      ];

      const summary = calculateBudgetSummary(totalBudget, items);

      // Estimated total = 400,000 + 200,000 + 100,000 = 700,000
      expect(summary.estimatedTotal).toBe(700000);
      // Actual spent = 400,000 + 50,000 + 0 = 450,000
      expect(summary.actualSpent).toBe(450000);
      // Committed costs = 400,000 (paid) + 200,000 (deposit committed) + 0 (unpaid) = 600,000
      expect(summary.committedCosts).toBe(600000);
      // Ensure no double counting occurred
      expect(summary.committedCosts).toBeLessThanOrEqual(summary.estimatedTotal);
    });

    it("should treat contingency buffer as a planned allocation, NOT money already spent", () => {
      const totalBudget = 500000;
      const items: BudgetItemInput[] = [
        {
          id: "item-1",
          category: "Venue",
          description: "Hall Hire",
          estimatedAmount: 300000,
          actualAmount: 150000,
          paymentStatus: "deposit_paid",
        },
        {
          id: "item-2",
          category: "Contingency Safety Reserve",
          description: "Unforeseen emergencies buffer",
          estimatedAmount: 50000,
          actualAmount: 0,
          paymentStatus: "unpaid",
          isContingency: true,
        },
      ];

      const summary = calculateBudgetSummary(totalBudget, items);

      // Contingency allocated should be tracked as 50000
      expect(summary.contingencyAllocated).toBe(50000);
      // Actual spent must ONLY reflect real disbursements (150000), not the contingency buffer
      expect(summary.actualSpent).toBe(150000);
      // Remaining liquid cash is totalBudget - actualSpent = 500,000 - 150,000 = 350,000
      expect(summary.remainingCash).toBe(350000);
      // Planned remaining is totalBudget - estimatedTotal = 500,000 - 350,000 = 150,000
      expect(summary.remainingPlanned).toBe(150000);
    });
  });

  describe("3. Remaining Balance Clarification & Separation", () => {
    it("should distinctly separate remaining planned, remaining cash, and remaining committed", () => {
      const totalBudget = 1000000;
      const items: BudgetItemInput[] = [
        {
          category: "Music",
          description: "DJ",
          estimatedAmount: 200000,
          actualAmount: 100000,
          paymentStatus: "deposit_paid",
        },
      ];

      const summary = calculateBudgetSummary(totalBudget, items);

      // Remaining planned envelope: 1,000,000 - 200,000 = 800,000
      expect(summary.remainingPlanned).toBe(800000);
      // Remaining cash in hand: 1,000,000 - 100,000 = 900,000
      expect(summary.remainingCash).toBe(900000);
      // Remaining uncommitted: 1,000,000 - 200,000 = 800,000
      expect(summary.remainingCommitted).toBe(800000);
    });
  });

  describe("4. Budget Overruns & Warning Detection", () => {
    it("should detect when planned estimates exceed the total authorized ceiling", () => {
      const totalBudget = 500000;
      const items: BudgetItemInput[] = [
        {
          category: "Venue",
          description: "Resort",
          estimatedAmount: 350000,
          actualAmount: 0,
          paymentStatus: "unpaid",
        },
        {
          category: "Catering",
          description: "Dinner",
          estimatedAmount: 250000,
          actualAmount: 0,
          paymentStatus: "unpaid",
        },
      ];

      const summary = calculateBudgetSummary(totalBudget, items);

      // Total planned = 600,000 > totalBudget 500,000
      expect(summary.isPlannedOverBudget).toBe(true);
      expect(summary.overrunAmount).toBe(100000);
      expect(summary.remainingPlanned).toBe(-100000);
    });

    it("should detect when actual disbursements exceed the total budget", () => {
      const totalBudget = 100000;
      const items: BudgetItemInput[] = [
        {
          category: "Decor",
          description: "Stage",
          estimatedAmount: 90000,
          actualAmount: 120000,
          paymentStatus: "paid",
        },
      ];

      const summary = calculateBudgetSummary(totalBudget, items);
      expect(summary.isActualOverBudget).toBe(true);
      expect(summary.remainingCash).toBe(-20000);
    });

    it("should flag individual category overruns when actual exceeds estimated target", () => {
      const totalBudget = 1000000;
      const items: BudgetItemInput[] = [
        {
          category: "Decor",
          description: "Flowers",
          estimatedAmount: 50000,
          actualAmount: 75000, // Overspent by 25,000
          paymentStatus: "paid",
        },
        {
          category: "Catering",
          description: "Food",
          estimatedAmount: 200000,
          actualAmount: 180000, // Within budget
          paymentStatus: "paid",
        },
      ];

      const summary = calculateBudgetSummary(totalBudget, items);
      expect(summary.overspentCategoriesCount).toBe(1);

      const decorCat = summary.categories.find((c) => c.category === "Decor");
      expect(decorCat).toBeDefined();
      expect(decorCat?.isOverspent).toBe(true);
      expect(decorCat?.variance).toBe(-25000);

      const cateringCat = summary.categories.find((c) => c.category === "Catering");
      expect(cateringCat).toBeDefined();
      expect(cateringCat?.isOverspent).toBe(false);
      expect(cateringCat?.variance).toBe(20000);
    });
  });

  describe("5. Category Grouping & Mutation Updates", () => {
    it("should correctly re-aggregate when an item's category or amounts change", () => {
      const items: BudgetItemInput[] = [
        {
          id: "1",
          category: "Entertainment",
          description: "DJ",
          estimatedAmount: 50000,
          actualAmount: 50000,
          paymentStatus: "paid",
        },
        {
          id: "2",
          category: "Entertainment",
          description: "Live Band",
          estimatedAmount: 100000,
          actualAmount: 50000,
          paymentStatus: "deposit_paid",
        },
      ];

      const summary1 = calculateBudgetSummary(500000, items);
      expect(summary1.categories).toHaveLength(1);
      expect(summary1.categories[0].estimated).toBe(150000);
      expect(summary1.categories[0].itemCount).toBe(2);

      // Now change item 2 category to "Production"
      const updatedItems: BudgetItemInput[] = [
        items[0],
        {
          ...items[1],
          category: "Production",
        },
      ];

      const summary2 = calculateBudgetSummary(500000, updatedItems);
      expect(summary2.categories).toHaveLength(2);

      const ent = summary2.categories.find((c) => c.category === "Entertainment");
      const prod = summary2.categories.find((c) => c.category === "Production");

      expect(ent?.estimated).toBe(50000);
      expect(ent?.itemCount).toBe(1);
      expect(prod?.estimated).toBe(100000);
      expect(prod?.itemCount).toBe(1);
    });
  });

  describe("6. Multi-Currency Formatting", () => {
    it("should format INR correctly with Indian numbering system (Lakhs / Crores)", () => {
      expect(formatBudgetCurrency(1250000, "₹")).toBe("₹12,50,000");
      expect(formatBudgetCurrency(3850000, "INR")).toBe("₹38,50,000");
      expect(formatBudgetCurrency(-50000, "₹")).toBe("-₹50,000");
    });

    it("should format USD, EUR, GBP, and AED without silently mixing symbols", () => {
      expect(formatBudgetCurrency(25000, "$")).toBe("$25,000");
      expect(formatBudgetCurrency(25000, "USD")).toBe("$25,000");
      expect(formatBudgetCurrency(30000, "€")).toBe("€30,000");
      expect(formatBudgetCurrency(15000, "£")).toBe("£15,000");
      expect(formatBudgetCurrency(50000, "AED")).toBe("AED 50,000");
    });
  });

  describe("7. AI Category Suggestions with Authoritative Summing", () => {
    it("should calculate exact allocations matching 100% of the total budget", () => {
      const totalBudget = 2500000;
      const suggestions = suggestCategoryAllocations(totalBudget, "wedding");

      expect(suggestions.length).toBeGreaterThan(0);

      // Sum of allocated amounts must equal exactly totalBudget
      const sum = suggestions.reduce((acc, curr) => acc + curr.recommendedAmount, 0);
      expect(sum).toBe(totalBudget);

      // Percentage sum must be 100%
      const pctSum = suggestions.reduce((acc, curr) => acc + curr.percentage, 0);
      expect(pctSum).toBe(100);

      // Contingency safety reserve must be included as planned buffer
      const contingency = suggestions.find((s) => s.isContingency);
      expect(contingency).toBeDefined();
      expect(contingency?.percentage).toBe(7);
      expect(contingency?.recommendedAmount).toBeGreaterThan(0);
    });

    it("should handle odd budgets without fractional penny/rupee drift", () => {
      const oddBudget = 333333;
      const suggestions = suggestCategoryAllocations(oddBudget, "birthday");

      const sum = suggestions.reduce((acc, curr) => acc + curr.recommendedAmount, 0);
      expect(sum).toBe(oddBudget);
    });
  });
});
