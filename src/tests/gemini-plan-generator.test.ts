import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import {
  generateCompleteEventPlan,
  enforceSemanticPlanConstraints,
  setMockGenAIClient,
  resetGenAIClient,
  checkPlanGenerationRateLimit,
} from "@/lib/ai/gemini";
import type { PlanGenerationInput } from "@/lib/ai/schemas";
import { POST as generatePlanRoute } from "@/app/api/events/[id]/plan/generate/route";
import { POST as applyPlanRoute } from "@/app/api/events/[id]/plan/apply/route";
import * as sessionModule from "@/lib/auth/session";
import * as dbServicesModule from "@/lib/db/services";

describe("Gemini AI Event Plan Generator", () => {
  const baseInput: PlanGenerationInput = {
    eventType: "wedding",
    eventDate: "2026-12-14",
    timezone: "Asia/Kolkata",
    city: "Jaipur",
    location: "Jaipur Palace Heritage",
    guestCount: 300,
    totalBudget: 3000000,
    currency: "₹",
    theme: "Royal Amber Heritage",
    stylePreferences: "Traditional elegance with modern brass lighting",
    foodPreferences: ["Rajasthani Banquet", "Live Chaat Counters"],
    dietaryRequirements: ["Vegetarian Options", "Nut-free"],
    indoorOutdoor: "mixed",
    accessibilityNeeds: ["Wheelchair ramps"],
    userPriorities: ["Exceptional dining", "Cinematic memories"],
    constraints: "Sound curfew at 10 PM",
  };

  const sampleMockPlan = {
    eventSummary: {
      title: "Royal Amber Heritage Palace Gala",
      concept: "A majestic 300-guest celebration set in the historic courtyards of Jaipur, featuring authentic royal banquets and candlelit elegance.",
      theme: "Royal Amber Heritage",
      colorPalette: ["#5a4bac", "#884a0f", "#466557", "#eae6df"],
      planningAssumptions: [
        "Capacity for 300 seated banquet guests",
        "Curfew compliance at 10 PM on outdoor terraces",
      ],
    },
    budget: [
      {
        category: "Venue & Courtyards",
        estimatedAmount: 1000000,
        rationale: "Palace hire and overnight preparation suites",
        costConfidence: "high",
        costAssumptions: "Standard palace reservation benchmark",
      },
      {
        category: "Catering & Banquet",
        estimatedAmount: 900000,
        rationale: "3-course banquet and live counters for 300 guests",
        costConfidence: "medium",
        costAssumptions: "₹3,000 per guest banquet package",
      },
      {
        category: "Florals & Staging",
        estimatedAmount: 500000,
        rationale: "Marigold chandeliers and brass urn arrangements",
        costConfidence: "medium",
        costAssumptions: "Local botanical sourcing in Jaipur",
      },
      {
        category: "Cinematography & Film",
        estimatedAmount: 350000,
        rationale: "4K aerial drone coverage and master trailer",
        costConfidence: "high",
        costAssumptions: "Standard lead cinematographer package",
      },
    ],
    timeline: [
      {
        taskTitle: "Book Venue & Lock Stage Layout",
        description: "Sign palace agreement and pay preliminary deposit",
        suggestedDueDate: "2026-10-01",
        priority: "urgent",
        dependencies: [],
      },
      {
        taskTitle: "Finalize Tasting with Executive Chef",
        description: "Lock authentic Rajasthani live stations and allergen protocols",
        suggestedDueDate: "2026-11-10",
        priority: "high",
        dependencies: ["Book Venue & Lock Stage Layout"],
      },
      {
        taskTitle: "Confirm Noise Curfew Exemption",
        description: "Submit sound clearances to local municipal authorities",
        suggestedDueDate: "2026-11-25",
        priority: "high",
        dependencies: [],
      },
    ],
    vendorChecklist: [
      {
        vendorCategory: "Catering",
        requirements: "License for 300-pax preparation with dedicated live stations",
        questionsToAsk: [
          "Do you provide customized menus for dietary accommodations?",
          "What is your server-to-guest ratio?",
        ],
        bookingPriority: "urgent",
      },
      {
        vendorCategory: "Photography",
        requirements: "Drone cinematography certification and lighting kit",
        questionsToAsk: ["Have you previously filmed at Jaipur Palace Heritage?"],
        bookingPriority: "high",
      },
    ],
    personalizedIdeas: [
      {
        title: "Artisanal Saffron Welcome Mocktails",
        description: "Custom rosewater spritzers served in brass goblets upon arrival.",
        estimatedCost: 35000,
        materialsOrPreparationRequired: ["Brass goblets", "Kashmiri saffron syrup"],
      },
      {
        title: "Sunset Sufi Qawwali Interlude",
        description: "Acoustic folk transition during the sunset hour on the terrace.",
        estimatedCost: 60000,
        materialsOrPreparationRequired: ["Sound equipment", "Low seating diwans"],
      },
    ],
    risksAndBackups: [
      {
        risk: "Late evening temperature drop on outdoor terrace",
        mitigation: "Provide brass braziers and warm pashmina shawls for guests",
        backupOption: "Transition after-party to the indoor heated ballroom",
      },
      {
        risk: "10 PM sound curfew enforcement",
        mitigation: "Schedule live loud performances before 9:45 PM",
        backupOption: "Silent disco or acoustic instruments after 10 PM",
      },
    ],
  };

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-server-api-key";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    resetGenAIClient();
  });

  afterEach(() => {
    resetGenAIClient();
    vi.restoreAllMocks();
  });

  describe("1. Valid Plan Generation & Schema Conformance", () => {
    it("should generate a complete, schema-validated event plan with all required sections", async () => {
      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify(sampleMockPlan),
          }),
        },
      });

      const plan = await generateCompleteEventPlan(baseInput);

      expect(plan).toBeDefined();
      expect(plan.eventSummary.title).toBe("Royal Amber Heritage Palace Gala");
      expect(plan.eventSummary.colorPalette.length).toBeGreaterThanOrEqual(2);
      expect(plan.budget.length).toBeGreaterThanOrEqual(4);
      expect(plan.timeline.length).toBeGreaterThanOrEqual(3);
      expect(plan.vendorChecklist.length).toBeGreaterThanOrEqual(2);
      expect(plan.personalizedIdeas.length).toBeGreaterThanOrEqual(2);
      expect(plan.risksAndBackups.length).toBeGreaterThanOrEqual(2);

      // Metadata verification
      expect(plan.metadata.isPlanningEstimate).toBe(true);
      expect(plan.metadata.currency).toBe("₹");
      expect(plan.metadata.totalBudget).toBe(3000000);
      expect(plan.metadata.budgetHealth).toBe("balanced");
      expect(plan.metadata.contingencyReserved).toBeGreaterThan(0);
    });

    it("should auto-allocate contingency reserve from remaining headroom", () => {
      // Sum in sampleMockPlan is 1,000,000 + 900,000 + 500,000 + 350,000 = 2,750,000
      // Out of 3,000,000 totalBudget, 250,000 remains unallocated
      const processed = enforceSemanticPlanConstraints(sampleMockPlan, baseInput);

      expect(processed.metadata.contingencyReserved).toBe(250000);
      expect(processed.metadata.totalEstimatedCost).toBe(3000000);

      const contingencyItem = processed.budget.find((b) =>
        b.category.toLowerCase().includes("contingency")
      );
      expect(contingencyItem).toBeDefined();
      expect(contingencyItem?.estimatedAmount).toBe(250000);
    });
  });

  describe("2. Budget Constraints & Infeasibility Trade-offs", () => {
    it("should detect budget overruns and populate trade-offs rather than silently violating budget", () => {
      const overBudgetPlan = {
        ...sampleMockPlan,
        budget: [
          {
            category: "Palace Venue Hire",
            estimatedAmount: 2500000,
            rationale: "Ultra luxury buyout",
            costConfidence: "high",
            costAssumptions: "Full buyout",
          },
          {
            category: "Gourmet Catering",
            estimatedAmount: 1500000,
            rationale: "Imported caviar and truffle stations",
            costConfidence: "medium",
            costAssumptions: "Luxury menu",
          },
        ],
      };

      // Total proposed is 4,000,000 vs totalBudget 3,000,000
      const processed = enforceSemanticPlanConstraints(overBudgetPlan, baseInput);

      expect(processed.metadata.budgetHealth).toBe("infeasible");
      expect(processed.metadata.totalEstimatedCost).toBe(4000000);
      expect(processed.metadata.infeasibilityTradeoffs).toBeTruthy();
      expect(processed.metadata.infeasibilityTradeoffs).toContain("exceeds the authorized budget ceiling");
      expect(processed.metadata.infeasibilityTradeoffs).toContain(baseInput.totalBudget.toLocaleString());
    });

    it("should round all currency allocations to 2 decimal places to avoid floating point drift", () => {
      const fractionalPlan = {
        ...sampleMockPlan,
        budget: [
          {
            category: "Decor",
            estimatedAmount: 1234.5678,
            rationale: "Fractional",
            costConfidence: "low",
            costAssumptions: "Raw estimate",
          },
        ],
      };

      const processed = enforceSemanticPlanConstraints(fractionalPlan, {
        ...baseInput,
        totalBudget: 10000,
      });

      expect(processed.budget[0].estimatedAmount).toBe(1234.57);
    });
  });

  describe("3. Timeline Constraints & Relative Date Enforcement", () => {
    it("should reject/clamp tasks scheduled in the past for future events", () => {
      const pastDatedPlan = {
        ...sampleMockPlan,
        timeline: [
          {
            taskTitle: "Past Milestone",
            description: "Old task",
            suggestedDueDate: "2020-01-01", // Past date
            priority: "medium",
            dependencies: [],
          },
        ],
      };

      const processed = enforceSemanticPlanConstraints(pastDatedPlan, baseInput);
      const todayStr = new Date().toISOString().split("T")[0];

      // Must be clamped to today or future date
      expect(processed.timeline[0].suggestedDueDate >= todayStr).toBe(true);
    });

    it("should reject/clamp tasks scheduled after the event date", () => {
      const postEventPlan = {
        ...sampleMockPlan,
        timeline: [
          {
            taskTitle: "Post Event Task",
            description: "Late task",
            suggestedDueDate: "2099-12-31", // Far after event date 2026-12-14
            priority: "low",
            dependencies: [],
          },
        ],
      };

      const processed = enforceSemanticPlanConstraints(postEventPlan, baseInput);

      // Must not exceed eventDate
      expect(processed.timeline[0].suggestedDueDate <= baseInput.eventDate).toBe(true);
    });

    it("should handle events with very short preparation periods (<= 7 days)", () => {
      const shortNoticeDate = new Date();
      shortNoticeDate.setDate(shortNoticeDate.getDate() + 3);
      const shortNoticeDateStr = shortNoticeDate.toISOString().split("T")[0];

      const shortNoticeInput: PlanGenerationInput = {
        ...baseInput,
        eventDate: shortNoticeDateStr,
      };

      const processed = enforceSemanticPlanConstraints(sampleMockPlan, shortNoticeInput);

      // Medium priority tasks should be bumped to high on short prep
      processed.timeline.forEach((t) => {
        expect(["high", "urgent"]).toContain(t.priority);
      });
    });

    it("should sanitize task titles to avoid claiming contracts are already booked", () => {
      const claimPlan = {
        ...sampleMockPlan,
        timeline: [
          {
            taskTitle: "Booked Venue & Caterer",
            description: "Done",
            suggestedDueDate: "2026-11-01",
            priority: "urgent",
          },
          {
            taskTitle: "Sent Invitations",
            description: "Done",
            suggestedDueDate: "2026-11-05",
            priority: "high",
          },
        ],
      };

      const processed = enforceSemanticPlanConstraints(claimPlan, baseInput);

      expect(processed.timeline[0].taskTitle).toBe("Book Venue & Caterer");
      expect(processed.timeline[1].taskTitle).toBe("Send Invitations");
    });
  });

  describe("4. Error Handling & Quota Exhaustion", () => {
    it("should handle invalid JSON from AI model gracefully", async () => {
      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: "Sorry, I am unable to generate a plan.", // Not JSON
          }),
        },
      });

      await expect(generateCompleteEventPlan(baseInput)).rejects.toThrow(
        "AI response was not valid JSON"
      );
    });

    it("should handle empty response from AI model", async () => {
      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: "",
          }),
        },
      });

      await expect(generateCompleteEventPlan(baseInput)).rejects.toThrow(
        "Empty response received from AI model"
      );
    });

    it("should map 429 quota exhaustion to user-friendly safe error", async () => {
      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED: Quota exceeded")),
        },
      });

      await expect(generateCompleteEventPlan(baseInput)).rejects.toThrow(
        "AI service quota reached. Please try again in a few moments."
      );
    });

    it("should map timeout to clean user-facing error", async () => {
      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 500))
          ),
        },
      });

      await expect(
        generateCompleteEventPlan(baseInput, { timeoutMs: 50 })
      ).rejects.toThrow("AI generation request timed out");
    });
  });

  describe("5. Rate Limiting", () => {
    it("should enforce sliding window rate limiting per user identifier", () => {
      const userId = "test-user-rate-limit-1";

      // 10 requests allowed
      for (let i = 0; i < 10; i++) {
        const check = checkPlanGenerationRateLimit(userId, 10, 60000);
        expect(check.allowed).toBe(true);
      }

      // 11th request blocked
      const blocked = checkPlanGenerationRateLimit(userId, 10, 60000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe("6. Route Authorization & Cross-User Security", () => {
    const validEventId = new ObjectId().toString();

    it("should reject unauthenticated request to POST /api/events/[id]/plan/generate with 401", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockRejectedValue(
        new sessionModule.AuthenticationError("You must be signed in")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${validEventId}/plan/generate`, {
        method: "POST",
      });
      const res = await generatePlanRoute(req, {
        params: Promise.resolve({ id: validEventId }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject cross-user access to POST /api/events/[id]/plan/generate with 403", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: new ObjectId().toString(),
        email: "intruder@planora.ai",
        name: "Intruder User",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockRejectedValue(
        new dbServicesModule.AuthorizationError("You do not have permission to access this event")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${validEventId}/plan/generate`, {
        method: "POST",
      });
      const res = await generatePlanRoute(req, {
        params: Promise.resolve({ id: validEventId }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject unauthenticated request to POST /api/events/[id]/plan/apply with 401", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockRejectedValue(
        new sessionModule.AuthenticationError("You must be signed in")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${validEventId}/plan/apply`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await applyPlanRoute(req, {
        params: Promise.resolve({ id: validEventId }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject cross-user access to POST /api/events/[id]/plan/apply with 403", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: new ObjectId().toString(),
        email: "intruder@planora.ai",
        name: "Intruder User",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockRejectedValue(
        new dbServicesModule.AuthorizationError("You do not have permission to access this event")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${validEventId}/plan/apply`, {
        method: "POST",
        body: JSON.stringify({
          plan: {
            eventSummary: {
              title: "Test Plan",
              concept: "Test Concept",
              theme: "Test Theme",
              colorPalette: ["#000", "#fff"],
              planningAssumptions: ["Test"],
            },
            budget: [],
            timeline: [],
            vendorChecklist: [],
            personalizedIdeas: [],
            risksAndBackups: [],
            metadata: {
              currency: "₹",
              totalBudget: 100000,
              totalEstimatedCost: 100000,
              contingencyReserved: 0,
              budgetHealth: "balanced",
              isPlanningEstimate: true,
              generatedAt: new Date().toISOString(),
            },
          },
          applyOptions: {
            applySummary: true,
            applyBudget: true,
            applyTasks: true,
            applyIdeas: true,
          },
        }),
      });
      const res = await applyPlanRoute(req, {
        params: Promise.resolve({ id: validEventId }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });
  });
});
