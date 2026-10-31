import { describe, it, expect, beforeEach, vi } from "vitest";
import { ObjectId, Collection } from "mongodb";
import { NextRequest } from "next/server";
import {
  calculateFinancialImpact,
  calculateTimelineImpact,
} from "@/lib/domain/change-impact";
import {
  generateAIChangeAnalysis,
  generateFallbackAnalysis,
} from "@/lib/ai/change-impact";
import { setMockGenAIClient, resetGenAIClient } from "@/lib/ai/gemini";
import * as collectionsModule from "@/lib/db/collections";
import * as dbServicesModule from "@/lib/db/services";
import * as sessionModule from "@/lib/auth/session";
import { POST as postAnalyzeRoute } from "@/app/api/events/[id]/impact/analyze/route";
import { POST as postApplyRoute } from "@/app/api/events/[id]/impact/apply/route";
import { GET as getHistoryRoute } from "@/app/api/events/[id]/impact/history/route";
import type {
  EventModel,
  BudgetItemModel,
  TaskModel,
  EventVendorWithDetails,
  VendorModel,
} from "@/lib/types";

describe("Planora AI Change Impact & Replanning Suite", () => {
  const ownerId = new ObjectId();
  const eventId = new ObjectId();
  const unauthorizedUserId = new ObjectId();

  const mockEvent: EventModel = {
    _id: eventId,
    ownerId,
    title: "Aarav & Meera Royal Heritage Gala",
    type: "wedding",
    date: "2026-12-14",
    timezone: "Asia/Kolkata",
    location: "Jaipur Royal Palace, Rajasthan",
    guestCount: 350,
    totalBudget: 3850000,
    currency: "₹",
    theme: "Royal Amber & Candlelit Heritage",
    status: "confirmed",
    version: 1,
    preferences: {
      city: "Jaipur",
      indoorOutdoor: "mixed",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBudgetItems: BudgetItemModel[] = [
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      category: "Catering",
      description: "Royal Rajasthani Banquet (350 pax)",
      estimatedAmount: 1050000,
      actualAmount: 500000,
      paymentStatus: "deposit_paid",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      category: "Venue",
      description: "Palace courtyard reservation",
      estimatedAmount: 1200000,
      actualAmount: 1200000,
      paymentStatus: "paid",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      category: "Decor & Production",
      description: "Heritage floral mandap & lighting",
      estimatedAmount: 600000,
      actualAmount: 0,
      paymentStatus: "unpaid",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTasks: TaskModel[] = [
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      title: "Confirm Palace Floor Plan",
      description: "Approve seating layout for 350 guests",
      dueDate: "2026-11-15",
      priority: "high",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      title: "Sign Royal Banquet Catering Contract",
      description: "Finalize menu and tasting",
      dueDate: "2026-10-10",
      priority: "urgent",
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockVendorModel1: VendorModel = {
    _id: new ObjectId(),
    isShared: true,
    name: "Royal Rajputana Caterers",
    category: "catering",
    location: "Jaipur",
    contact: { email: "catering@rajputana.in" },
    priceRange: "$$$$",
    verificationStatus: "verified",
    createdAt: new Date(),
  };

  const mockVendorModel2: VendorModel = {
    _id: new ObjectId(),
    isShared: true,
    name: "Moments & Memories Studio",
    category: "photography",
    location: "Jaipur",
    contact: { email: "contact@moments.in" },
    priceRange: "$$$",
    verificationStatus: "verified",
    createdAt: new Date(),
  };

  const mockVendors: EventVendorWithDetails[] = [
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      vendorId: mockVendorModel1._id!,
      bookingStatus: "booked",
      estimatedAmount: 1050000,
      quotedAmount: 1050000,
      actualPaid: 500000,
      notes: "Contract signed, 500k advance paid",
      createdAt: new Date(),
      updatedAt: new Date(),
      vendor: mockVendorModel1,
    },
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      vendorId: mockVendorModel2._id!,
      bookingStatus: "shortlisted",
      estimatedAmount: 250000,
      quotedAmount: 250000,
      actualPaid: 0,
      notes: "Evaluating portfolio",
      createdAt: new Date(),
      updatedAt: new Date(),
      vendor: mockVendorModel2,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    resetGenAIClient();
  });

  // -------------------------------------------------------------
  // 1. Deterministic Domain Financial Calculations
  // -------------------------------------------------------------
  describe("1. Deterministic Financial Impact Math", () => {
    it("should accurately scale catering budget estimates when guest count increases", () => {
      // 350 -> 400 guests (+50 guests)
      const impact = calculateFinancialImpact({
        currentEvent: mockEvent,
        proposedGuestCount: 400,
        currentBudgetItems: mockBudgetItems,
      });

      expect(impact.budgetDelta).toBe(0);
      expect(impact.currentTotalBudget).toBe(3850000);
      expect(impact.proposedTotalBudget).toBe(3850000);
      expect(impact.currentCommitted).toBe(2850000); // 1050000 + 1200000 + 600000
      expect(impact.currentActualSpend).toBe(1700000); // 500000 + 1200000

      // Catering baseline was 1,050,000 for 350 pax (3,000 / pax)
      // For +50 pax: 50 * 3,000 = +150,000. New catering: 1,200,000
      const cateringCat = impact.affectedBudgetCategories.find((c) =>
        c.category.toLowerCase().includes("catering")
      );
      expect(cateringCat).toBeDefined();
      expect(cateringCat?.suggestedNewEstimated).toBe(1200000);
      expect(cateringCat?.difference).toBe(150000);
      // Scaled benchmark estimate
      expect(cateringCat?.isVerified).toBe(false);
    });

    it("should detect budget deficit when budget is reduced below committed costs", () => {
      // Budget cut from 3,850,000 to 2,500,000
      // Committed is 2,850,000
      const impact = calculateFinancialImpact({
        currentEvent: mockEvent,
        proposedBudget: 2500000,
        currentBudgetItems: mockBudgetItems,
      });

      expect(impact.budgetDelta).toBe(-1350000);
      expect(impact.proposedTotalBudget).toBe(2500000);
      expect(impact.isBudgetFeasible).toBe(false);
      expect(impact.deficitAmount).toBe(350000); // 2,850,000 - 2,500,000
    });

    it("should flag critical deficit if budget is reduced below already disbursed actual spend", () => {
      // Actual spend is 1,700,000. If user attempts to cut budget to 1,500,000:
      const impact = calculateFinancialImpact({
        currentEvent: mockEvent,
        proposedBudget: 1500000,
        currentBudgetItems: mockBudgetItems,
      });

      expect(impact.isBudgetFeasible).toBe(false);
      expect(impact.proposedTotalBudget).toBe(1500000);
      expect(impact.currentActualSpend).toBe(1700000);
      expect(impact.proposedTotalBudget < impact.currentActualSpend).toBe(true);
      expect(impact.deficitAmount).toBeGreaterThan(0);
    });

    it("should properly calculate surplus when budget is increased", () => {
      const impact = calculateFinancialImpact({
        currentEvent: mockEvent,
        proposedBudget: 4500000,
        currentBudgetItems: mockBudgetItems,
      });

      expect(impact.budgetDelta).toBe(650000);
      expect(impact.isBudgetFeasible).toBe(true);
      expect(impact.deficitAmount).toBeUndefined();
      expect(impact.projectedVariance).toBe(1650000); // 4500000 - 2850000
    });
  });

  // -------------------------------------------------------------
  // 2. Timeline Shift & Vendor Safety Rules
  // -------------------------------------------------------------
  describe("2. Timeline Shift & Vendor Safety Rules", () => {
    it("should shift pending tasks forward when event date is postponed without modifying completed tasks", () => {
      // Postpone event by 30 days: 2026-12-14 -> 2027-01-13
      const proposedDate = "2027-01-13";

      const impact = calculateTimelineImpact({
        currentDate: mockEvent.date,
        proposedDate,
        tasks: mockTasks,
        eventVendors: mockVendors,
      });

      expect(impact.daysShifted).toBe(30);

      // Pending task due on 2026-11-15 should shift by +30 days -> 2026-12-15
      expect(impact.affectedTasks.length).toBe(1);
      const pendingTask = impact.affectedTasks[0];
      expect(pendingTask).toBeDefined();
      expect(pendingTask?.suggestedNewDueDate).toBe("2026-12-15");
      expect(pendingTask?.currentDueDate).toBe("2026-11-15");
      expect(pendingTask?.taskTitle).toBe("Confirm Palace Floor Plan");
    });

    it("should flag booked vendors for manual reconfirmation without auto-cancelling or modifying bookings", () => {
      const proposedDate = "2027-01-13";

      const impact = calculateTimelineImpact({
        currentDate: mockEvent.date,
        proposedDate,
        tasks: mockTasks,
        eventVendors: mockVendors,
      });

      // Both booked and shortlisted vendors are surfaced for timeline verification
      expect(impact.vendorsRequiringConfirmation.length).toBe(2);
      const bookedFlag = impact.vendorsRequiringConfirmation.find((v) => v.currentStatus === "booked");
      expect(bookedFlag).toBeDefined();
      expect(bookedFlag?.vendorName).toBe("Royal Rajputana Caterers");
      expect(bookedFlag?.category).toBe("catering");
      expect(bookedFlag?.currentStatus).toBe("booked");
      expect(bookedFlag?.actionRequired).toBe("Manual Date Reconfirmation Required");
      expect(bookedFlag?.notes).toContain("Reach out to verify availability and lock the new date");
    });

    it("should clamp shifted task dates so they do not exceed new event date", () => {
      // Event date moved up (advanced): 2026-12-14 -> 2026-11-10 (-34 days)
      const proposedDate = "2026-11-10";

      const impact = calculateTimelineImpact({
        currentDate: mockEvent.date,
        proposedDate,
        tasks: mockTasks,
        eventVendors: mockVendors,
      });

      expect(impact.daysShifted).toBe(-34);
      expect(impact.affectedTasks.length).toBe(1);
      const pendingTask = impact.affectedTasks[0];
      expect(pendingTask).toBeDefined();
      expect(new Date(pendingTask!.suggestedNewDueDate).getTime()).toBeLessThanOrEqual(
        new Date(proposedDate).getTime()
      );
    });
  });

  // -------------------------------------------------------------
  // 3. AI Trade-off Analysis & Fallback Behavior
  // -------------------------------------------------------------
  describe("3. AI Trade-off Analysis & Safe Fallbacks", () => {
    it("should generate structured AI trade-offs and alternatives via Gemini SDK", async () => {
      const mockAIResponse = {
        summary: "Scaling guest count to 400 increases catering costs by ₹150,000, leaving ₹850,000 buffer.",
        tradeoffs: [
          "Catering: Higher variable cost per plate for additional 50 guests.",
        ],
        alternatives: [
          {
            title: "Optimize Buffet Spread",
            description: "Shift 2 luxury live stations to classic regional counters to absorb 50 guests.",
            estimatedSavingsOrCost: "Save approximately ₹60,000",
          },
        ],
        risks: [
          {
            risk: "Banquet Hall capacity limits",
            severity: "medium",
            mitigation: "Confirm palace courtyard expansion layout with venue manager.",
          },
        ],
      };

      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify(mockAIResponse),
          }),
        },
      });

      const financialImpact = calculateFinancialImpact({
        currentEvent: mockEvent,
        proposedGuestCount: 400,
        currentBudgetItems: mockBudgetItems,
      });
      const timelineImpact = calculateTimelineImpact({
        currentDate: mockEvent.date,
        proposedDate: mockEvent.date,
        tasks: mockTasks,
        eventVendors: mockVendors,
      });

      const analysis = await generateAIChangeAnalysis({
        currentEvent: mockEvent,
        changes: {
          guestCount: { before: 350, after: 400 },
        },
        financialImpact,
        timelineImpact,
      });

      expect(analysis.summary).toContain("Scaling guest count");
      expect(analysis.tradeoffs.length).toBeGreaterThan(0);
      expect(analysis.alternatives[0].title).toBe("Optimize Buffet Spread");
      expect(analysis.risks[0].risk).toContain("Banquet Hall");
    });

    it("should gracefully return deterministic fallback analysis if Gemini API times out or fails", async () => {
      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error("API quota exceeded or network timeout")),
        },
      });

      const financialImpact = calculateFinancialImpact({
        currentEvent: mockEvent,
        proposedBudget: 2500000,
        currentBudgetItems: mockBudgetItems,
      });
      const timelineImpact = calculateTimelineImpact({
        currentDate: mockEvent.date,
        proposedDate: mockEvent.date,
        tasks: mockTasks,
        eventVendors: mockVendors,
      });

      const analysis = await generateAIChangeAnalysis({
        currentEvent: mockEvent,
        changes: {
          totalBudget: { before: 3850000, after: 2500000 },
        },
        financialImpact,
        timelineImpact,
      });

      expect(analysis).toBeDefined();
      expect(analysis.summary).toContain("domain analysis");
      expect(analysis.tradeoffs.length).toBeGreaterThan(0);
      expect(analysis.risks.length).toBeGreaterThan(0);
    });

    it("should generate deterministic fallback directly via generateFallbackAnalysis", () => {
      const financialImpact = calculateFinancialImpact({
        currentEvent: mockEvent,
        proposedGuestCount: 450,
        proposedBudget: 3500000,
        currentBudgetItems: mockBudgetItems,
      });
      const timelineImpact = calculateTimelineImpact({
        currentDate: mockEvent.date,
        proposedDate: "2027-01-10",
        tasks: mockTasks,
        eventVendors: mockVendors,
      });

      const fallback = generateFallbackAnalysis(
        {
          currentEvent: mockEvent,
          changes: {
            guestCount: { before: 350, after: 450 },
            totalBudget: { before: 3850000, after: 3500000 },
            date: { before: "2026-12-14", after: "2027-01-10", daysShifted: 27 },
          },
          financialImpact,
          timelineImpact,
        },
        "Deterministic heuristic mode."
      );

      expect(fallback.summary).toContain("Deterministic heuristic mode");
      expect(fallback.tradeoffs.length).toBeGreaterThan(0);
      expect(fallback.alternatives.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------
  // 4. Concurrency Control & Database Versioning
  // -------------------------------------------------------------
  describe("4. Optimistic Concurrency Control", () => {
    it("should throw ConcurrencyError if expected version does not match database version", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue({
          ...mockEvent,
          version: 3, // Current DB version is 3
        }),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
        mockCollection as unknown as Collection<EventModel>
      );

      await expect(
        dbServicesModule.updateEventWithConcurrencyCheck(
          eventId.toString(),
          ownerId.toString(),
          { guestCount: 400 },
          2 // User proposal was based on stale version 2
        )
      ).rejects.toThrow(dbServicesModule.ConcurrencyError);
    });

    it("should succeed and increment version when expected version matches database version", async () => {
      let findCount = 0;
      const mockCollection = {
        findOne: vi.fn().mockImplementation(() => {
          findCount++;
          // First 2 calls (verifyEventOwnership in check + verify in updateEventRecord): version 2
          // Subsequent calls (returning updated doc): version 3
          return Promise.resolve({
            ...mockEvent,
            guestCount: findCount > 2 ? 400 : 350,
            version: findCount > 2 ? 3 : 2,
          });
        }),
        updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
        mockCollection as unknown as Collection<EventModel>
      );

      const updated = await dbServicesModule.updateEventWithConcurrencyCheck(
        eventId.toString(),
        ownerId.toString(),
        { guestCount: 400 },
        2
      );

      expect(updated.version).toBe(3);
      expect(updated.guestCount).toBe(400);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: eventId, ownerId },
        expect.objectContaining({
          $set: expect.objectContaining({
            guestCount: 400,
            version: 3,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------
  // 5. API Route Handlers Integration & Security
  // -------------------------------------------------------------
  describe("5. Endpoint Security & Proposal Lifecycle Handlers", () => {
    it("should reject unauthenticated request to POST /api/events/[id]/impact/analyze with 401", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockRejectedValue(
        new sessionModule.AuthenticationError("You must be signed in")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/impact/analyze`, {
        method: "POST",
        body: JSON.stringify({ guestCount: 400 }),
      });

      const res = await postAnalyzeRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject cross-user access to POST /api/events/[id]/impact/analyze with 403", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: unauthorizedUserId.toString(),
        email: "intruder@planora.ai",
        name: "Intruder",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockRejectedValue(
        new dbServicesModule.AuthorizationError("Unauthorized event access")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/impact/analyze`, {
        method: "POST",
        body: JSON.stringify({ guestCount: 400 }),
      });

      const res = await postAnalyzeRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });
      expect(res.status).toBe(403);
    });

    it("should generate a complete change proposal on POST /api/events/[id]/impact/analyze", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: ownerId.toString(),
        email: "aarav@planora.ai",
        name: "Aarav Sharma",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue(mockEvent);
      vi.spyOn(dbServicesModule, "getEventBudgetItems").mockResolvedValue(mockBudgetItems);
      vi.spyOn(dbServicesModule, "getEventTasksList").mockResolvedValue(mockTasks);
      vi.spyOn(dbServicesModule, "getEventVendorsWithDetails").mockResolvedValue(mockVendors);

      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              summary: "Adding 50 guests will require additional catering capacity.",
              tradeoffs: ["Catering: Increased per-plate budget"],
              alternatives: [{ title: "Adjust Menu", description: "Use seasonal dishes", estimatedSavingsOrCost: "₹50,000" }],
              risks: [{ risk: "Venue space limit", severity: "medium", mitigation: "Check lawn extension" }],
            }),
          }),
        },
      });

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/impact/analyze`, {
        method: "POST",
        body: JSON.stringify({ guestCount: 400 }),
      });

      const res = await postAnalyzeRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.proposal.proposalId).toBeDefined();
      expect(data.data.proposal.baseVersion).toBe(1);
      expect(data.data.proposal.financialImpact.proposedTotalBudget).toBe(3850000);
      expect(data.data.proposal.aiAnalysis.summary).toContain("Adding 50 guests");
    });

    it("should reject POST /api/events/[id]/impact/apply with 409 Conflict if proposal is stale", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: ownerId.toString(),
        email: "aarav@planora.ai",
        name: "Aarav Sharma",
        agency: "Text Agency",
        role: "organizer",
      });

      // DB version is 2
      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue({
        ...mockEvent,
        version: 2,
      });

      // User proposal was based on baseVersion: 1
      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/impact/apply`, {
        method: "POST",
        body: JSON.stringify({
          proposalId: "prop-123456",
          baseVersion: 1,
          changes: { guestCount: 400 },
        }),
      });

      const res = await postApplyRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });
      expect(res.status).toBe(409);

      const data = await res.json();
      expect(data.error.code).toBe("STALE_PROPOSAL");
      expect(data.error.details.currentVersion).toBe(2);
    });

    it("should apply authorized proposal on POST /api/events/[id]/impact/apply and log audit history", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: ownerId.toString(),
        email: "aarav@planora.ai",
        name: "Aarav Sharma",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue(mockEvent);
      vi.spyOn(dbServicesModule, "getEventBudgetItems").mockResolvedValue(mockBudgetItems);
      vi.spyOn(dbServicesModule, "getEventTasksList").mockResolvedValue(mockTasks);
      vi.spyOn(dbServicesModule, "getEventVendorsWithDetails").mockResolvedValue(mockVendors);

      const updateEventSpy = vi.spyOn(dbServicesModule, "updateEventWithConcurrencyCheck").mockResolvedValue({
        ...mockEvent,
        version: 2,
        guestCount: 400,
      });

      const batchBudgetSpy = vi.spyOn(dbServicesModule, "batchUpdateBudgetEstimated").mockResolvedValue(1);
      const batchTasksSpy = vi.spyOn(dbServicesModule, "batchUpdateTaskDueDates").mockResolvedValue(1);
      const updateVendorsSpy = vi.spyOn(dbServicesModule, "updateEventVendorsAuditNotes").mockResolvedValue(1);
      const recordLogSpy = vi.spyOn(dbServicesModule, "recordChangeLog").mockResolvedValue({
        _id: new ObjectId(),
        eventId,
        ownerId,
        version: 2,
        timestamp: new Date(),
        summary: "Guest count increased to 400",
        changes: { guestCount: { before: 350, after: 400 } },
        appliedModifications: {
          budgetAdjusted: true,
          budgetDetails: [],
          tasksRescheduledCount: 0,
          tasksRescheduled: [],
          vendorsRequiringConfirmationCount: 0,
          vendorsRequiringConfirmation: [],
        },
        aiRationale: "Replanning executed at version 2.",
      });

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/impact/apply`, {
        method: "POST",
        body: JSON.stringify({
          proposalId: "prop-999999",
          baseVersion: 1,
          changes: {
            guestCount: 400,
            date: "2027-01-13",
          },
          acceptedAdjustments: {
            applyBudgetAdjustments: true,
            applyTaskReschedules: true,
          },
        }),
      });

      const res = await postApplyRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.newVersion).toBe(2);

      expect(updateEventSpy).toHaveBeenCalledWith(
        eventId.toString(),
        ownerId.toString(),
        expect.objectContaining({ guestCount: 400, date: "2027-01-13" }),
        1
      );
      expect(batchBudgetSpy).toHaveBeenCalled();
      expect(batchTasksSpy).toHaveBeenCalled();
      expect(updateVendorsSpy).toHaveBeenCalled();
      expect(recordLogSpy).toHaveBeenCalled();
    });

    it("should retrieve immutable change logs on GET /api/events/[id]/impact/history", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: ownerId.toString(),
        email: "aarav@planora.ai",
        name: "Aarav Sharma",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue(mockEvent);
      vi.spyOn(dbServicesModule, "getEventChangeLogs").mockResolvedValue([
        {
          _id: new ObjectId(),
          eventId,
          ownerId,
          version: 2,
          timestamp: new Date(),
          summary: "Updated guest count to 400",
          changes: { guestCount: { before: 350, after: 400 } },
          appliedModifications: {
            budgetAdjusted: true,
            budgetDetails: [],
            tasksRescheduledCount: 0,
            tasksRescheduled: [],
            vendorsRequiringConfirmationCount: 0,
            vendorsRequiringConfirmation: [],
          },
          aiRationale: "Replanning executed at version 2.",
        },
      ]);

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/impact/history`);
      const res = await getHistoryRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.changeLogs.length).toBe(1);
      expect(data.data.changeLogs[0].version).toBe(2);
      expect(data.data.changeLogs[0].summary).toContain("400");
    });
  });
});
