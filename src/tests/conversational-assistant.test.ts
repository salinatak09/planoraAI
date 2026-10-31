import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ObjectId } from "mongodb";
import { NextRequest } from "next/server";
import {
  buildEventAssistantContext,
  generateAssistantChatResponse,
  executeAssistantAction,
} from "@/lib/ai/assistant";
import { setMockGenAIClient, resetGenAIClient } from "@/lib/ai/gemini";
import * as dbServicesModule from "@/lib/db/services";
import * as sessionModule from "@/lib/auth/session";
import { GET as getChatRoute, POST as postChatRoute } from "@/app/api/events/[id]/chat/route";
import { POST as postActionRoute } from "@/app/api/events/[id]/chat/action/route";
import type { EventModel, BudgetItemModel, TaskModel } from "@/lib/types";

describe("Planora AI Conversational Assistant Suite", () => {
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
    preferences: {
      city: "Jaipur",
      foodPreferences: ["Royal Rajasthani Banquet", "Live Chaat Counter"],
      indoorOutdoor: "mixed",
    },
    status: "confirmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBudgetItems: BudgetItemModel[] = [
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      category: "Catering",
      description: "Royal banquet for 350 pax",
      estimatedAmount: 1050000,
      actualAmount: 1000000,
      paymentStatus: "paid",
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
      actualAmount: 600000,
      paymentStatus: "deposit_paid",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTasks: TaskModel[] = [
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      title: "Confirm Sound Curfew Exemption",
      dueDate: "2026-11-20",
      priority: "high",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      eventId,
      ownerId,
      title: "Finalize Royal Banquet Tasting",
      dueDate: "2026-11-25",
      priority: "medium",
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    resetGenAIClient();
  });

  afterEach(() => {
    resetGenAIClient();
  });

  describe("1. Authorized Event Context Aggregation", () => {
    it("should assemble bounded context with accurate financial, task, and deadline metrics", async () => {
      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue(mockEvent);
      vi.spyOn(dbServicesModule, "getEventBudgetItems").mockResolvedValue(mockBudgetItems);
      vi.spyOn(dbServicesModule, "getEventTasksList").mockResolvedValue(mockTasks);
      vi.spyOn(dbServicesModule, "getEventVendorsWithDetails").mockResolvedValue([]);

      const context = await buildEventAssistantContext(eventId.toString(), ownerId.toString());

      expect(context.eventId).toBe(eventId.toString());
      expect(context.title).toBe(mockEvent.title);
      expect(context.totalBudget).toBe(3850000);
      expect(context.committedEstimated).toBe(2250000);
      expect(context.actualSpent).toBe(1600000);
      expect(context.remainingBalance).toBe(2250000);
      expect(context.taskSummary.total).toBe(2);
      expect(context.taskSummary.pending).toBe(1);
      expect(context.taskSummary.completed).toBe(1);
    });
  });

  describe("2. Conversational Intent Handling & Proposals", () => {
    it("should provide direct informational answers without proposing data mutations for questions", async () => {
      const mockResponse = {
        reply: "Here is a tailored Royal Rajasthani vegetarian menu for 100 guests: 1. Dal Baati Churma, 2. Gatte Ki Sabzi, 3. Ker Sangri, 4. Shahi Paneer, 5. Saffron Ghewar.",
        suggestedPrompts: [
          "What should I finish this week?",
          "Suggest a backup plan for rain",
        ],
        actionProposal: null,
      };

      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify(mockResponse),
          }),
        },
      });

      const context = {
        eventId: eventId.toString(),
        title: mockEvent.title,
        type: mockEvent.type,
        date: mockEvent.date,
        daysRemaining: 140,
        city: "Jaipur",
        location: mockEvent.location,
        guestCount: 100,
        currency: "₹",
        totalBudget: 1000000,
        committedEstimated: 500000,
        actualSpent: 200000,
        remainingBalance: 800000,
        budgetCategories: [],
        taskSummary: { total: 0, pending: 0, completed: 0, overdue: 0, upcomingNext7Days: [] },
        vendorSummary: { total: 0, booked: 0, shortlisted: 0, vendors: [] },
      };

      const result = await generateAssistantChatResponse({
        eventContext: context,
        recentHistory: [],
        userMessage: "Suggest a vegetarian menu for 100 guests",
      });

      expect(result.reply).toContain("Dal Baati Churma");
      expect(result.actionProposal).toBeNull();
      expect(result.suggestedPrompts.length).toBeGreaterThan(0);
    });

    it("should propose a controlled REDUCE_BUDGET action when user requests budget cuts", async () => {
      const mockProposalResponse = {
        reply: "I have prepared a proposal to reduce your event budget by ₹30,000. Review the preview below and confirm to update the ledger.",
        suggestedPrompts: [
          "Where can we save an additional ₹20,000?",
          "Review remaining vendor allocations",
        ],
        actionProposal: {
          type: "REDUCE_BUDGET",
          description: "Reduce overall celebration budget ceiling by ₹30,000",
          preview: {
            title: "Reduce Total Budget by ₹30,000",
            before: 3850000,
            after: 3820000,
          },
          payload: {
            amount: 30000,
          },
          status: "pending",
        },
      };

      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify(mockProposalResponse),
          }),
        },
      });

      const context = {
        eventId: eventId.toString(),
        title: mockEvent.title,
        type: mockEvent.type,
        date: mockEvent.date,
        daysRemaining: 140,
        city: "Jaipur",
        location: mockEvent.location,
        guestCount: 350,
        currency: "₹",
        totalBudget: 3850000,
        committedEstimated: 2250000,
        actualSpent: 1600000,
        remainingBalance: 2250000,
        budgetCategories: [],
        taskSummary: { total: 2, pending: 1, completed: 1, overdue: 0, upcomingNext7Days: [] },
        vendorSummary: { total: 0, booked: 0, shortlisted: 0, vendors: [] },
      };

      const result = await generateAssistantChatResponse({
        eventContext: context,
        recentHistory: [],
        userMessage: "Reduce my budget by ₹30,000",
      });

      expect(result.actionProposal).toBeDefined();
      expect(result.actionProposal?.type).toBe("REDUCE_BUDGET");
      expect(result.actionProposal?.payload.amount).toBe(30000);
      expect(result.actionProposal?.status).toBe("pending");
      // Must not claim it is already changed
      expect(result.reply).not.toContain("I have changed your budget");
      expect(result.reply).toContain("proposal");
    });

    it("should understand Hindi / Hinglish queries and reply respectfully", async () => {
      const mockHinglishResponse = {
        reply: "Namaste! Aapke Sangeet ke liye humne ₹25,000 ki savings identify ki hai. Kya aap budget ko kam karna chahenge?",
        suggestedPrompts: ["Haan, ₹25,000 kam karo", "Vegetarian live counters add karo"],
        actionProposal: null,
      };

      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify(mockHinglishResponse),
          }),
        },
      });

      const context = {
        eventId: eventId.toString(),
        title: mockEvent.title,
        type: mockEvent.type,
        date: mockEvent.date,
        daysRemaining: 140,
        city: "Jaipur",
        location: mockEvent.location,
        guestCount: 350,
        currency: "₹",
        totalBudget: 3850000,
        committedEstimated: 2250000,
        actualSpent: 1600000,
        remainingBalance: 2250000,
        budgetCategories: [],
        taskSummary: { total: 2, pending: 1, completed: 1, overdue: 0, upcomingNext7Days: [] },
        vendorSummary: { total: 0, booked: 0, shortlisted: 0, vendors: [] },
      };

      const result = await generateAssistantChatResponse({
        eventContext: context,
        recentHistory: [],
        userMessage: "Shaadi ka budget kam karne ke tarike batao",
      });

      expect(result.reply).toContain("Namaste");
      expect(result.reply).toContain("Sangeet");
    });
  });

  describe("3. Controlled Action Execution Workflow", () => {
    it("should validate and execute REDUCE_BUDGET mutation and record confirmation in MongoDB", async () => {
      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue(mockEvent);
      const updateSpy = vi.spyOn(dbServicesModule, "updateEventRecord").mockResolvedValue({
        ...mockEvent,
        totalBudget: 3820000,
      });
      const appendSpy = vi.spyOn(dbServicesModule, "appendConversationMessage").mockResolvedValue({
        _id: new ObjectId(),
        eventId,
        ownerId,
        role: "assistant",
        content: "Budget reduced",
        createdAt: new Date(),
      });

      const result = await executeAssistantAction({
        eventId: eventId.toString(),
        ownerId: ownerId.toString(),
        action: {
          type: "REDUCE_BUDGET",
          description: "Cut budget by 30000",
          preview: { title: "Cut 30000" },
          payload: { amount: 30000 },
          status: "pending",
        },
      });

      expect(result.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(
        eventId.toString(),
        ownerId.toString(),
        { totalBudget: 3820000 }
      );
      expect(appendSpy).toHaveBeenCalled();
    });

    it("should reject budget reduction that exceeds total budget", async () => {
      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue(mockEvent);

      await expect(
        executeAssistantAction({
          eventId: eventId.toString(),
          ownerId: ownerId.toString(),
          action: {
            type: "REDUCE_BUDGET",
            description: "Excessive cut",
            preview: { title: "Excessive" },
            payload: { amount: 9999999 }, // Exceeds 3,850,000
            status: "pending",
          },
        })
      ).rejects.toThrow("Cannot reduce budget");
    });

    it("should execute CREATE_CHECKLIST and bulk insert tasks with pending status", async () => {
      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue(mockEvent);
      const bulkTasksSpy = vi.spyOn(dbServicesModule, "bulkCreateTasks").mockResolvedValue(mockTasks);
      vi.spyOn(dbServicesModule, "appendConversationMessage").mockResolvedValue({
        _id: new ObjectId(),
        eventId,
        ownerId,
        role: "assistant",
        content: "Tasks created",
        createdAt: new Date(),
      });

      const result = await executeAssistantAction({
        eventId: eventId.toString(),
        ownerId: ownerId.toString(),
        action: {
          type: "CREATE_CHECKLIST",
          description: "Final 7 days checklist",
          preview: { title: "Final 7 days checklist" },
          payload: {
            tasks: [
              { title: "Final Sound Clearances", dueDate: "2026-12-07", priority: "high" },
              { title: "Review Master Seating Chart", dueDate: "2026-12-10", priority: "urgent" },
              { title: "Welcome Bag Distribution", dueDate: "2026-12-13", priority: "high" },
            ],
          },
          status: "pending",
        },
      });

      expect(result.success).toBe(true);
      expect(bulkTasksSpy).toHaveBeenCalled();
    });
  });

  describe("4. Endpoint Security & Authorization", () => {
    it("should reject unauthenticated request to GET /api/events/[id]/chat with 401", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockRejectedValue(
        new sessionModule.AuthenticationError("You must be signed in")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/chat`);
      const res = await getChatRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject cross-user access to GET /api/events/[id]/chat with 403", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: unauthorizedUserId.toString(),
        email: "intruder@planora.ai",
        name: "Intruder User",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockRejectedValue(
        new dbServicesModule.AuthorizationError("Unauthorized event access")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/chat`);
      const res = await getChatRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject cross-user execution on POST /api/events/[id]/chat/action with 403", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: unauthorizedUserId.toString(),
        email: "intruder@planora.ai",
        name: "Intruder User",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockRejectedValue(
        new dbServicesModule.AuthorizationError("Unauthorized event access")
      );

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/chat/action`, {
        method: "POST",
        body: JSON.stringify({
          actionProposal: {
            type: "REDUCE_BUDGET",
            description: "Illegal cut",
            preview: { title: "Illegal" },
            payload: { amount: 50000 },
            status: "pending",
          },
        }),
      });

      const res = await postActionRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });
      expect(res.status).toBe(403);
    });

    it("should accept valid authorized message to POST /api/events/[id]/chat and return response", async () => {
      vi.spyOn(sessionModule, "requireAuthenticatedUser").mockResolvedValue({
        userId: ownerId.toString(),
        email: "priya@planora.ai",
        name: "Priya Sharma",
        agency: "Text Agency",
        role: "organizer",
      });

      vi.spyOn(dbServicesModule, "getEventById").mockResolvedValue(mockEvent);
      vi.spyOn(dbServicesModule, "getEventBudgetItems").mockResolvedValue(mockBudgetItems);
      vi.spyOn(dbServicesModule, "getEventTasksList").mockResolvedValue(mockTasks);
      vi.spyOn(dbServicesModule, "getEventVendorsWithDetails").mockResolvedValue([]);
      vi.spyOn(dbServicesModule, "getConversationMessages").mockResolvedValue([]);
      vi.spyOn(dbServicesModule, "appendConversationMessage").mockImplementation(
        async (_eid, _oid, role, content, extra) => ({
          _id: new ObjectId(),
          eventId,
          ownerId,
          role,
          content,
          actionProposal: extra?.actionProposal,
          suggestedPrompts: extra?.suggestedPrompts,
          createdAt: new Date(),
        })
      );

      setMockGenAIClient({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              reply: "I analyzed your Jaipur palace setup and verified all metrics.",
              suggestedPrompts: ["What should I finish this week?"],
              actionProposal: null,
            }),
          }),
        },
      });

      const req = new NextRequest(`http://localhost:3000/api/events/${eventId}/chat`, {
        method: "POST",
        body: JSON.stringify({ message: "What is my current remaining balance?" }),
      });

      const res = await postChatRoute(req, { params: Promise.resolve({ id: eventId.toString() }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.assistantMessage.content).toContain("Jaipur palace");
    });
  });
});
