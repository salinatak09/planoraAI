import { describe, it, expect, vi } from "vitest";
import { ObjectId, Collection } from "mongodb";
import {
  createEventSchema,
  updateEventSchema,
} from "@/lib/validation/schemas";
import {
  getEventById,
  updateEventRecord,
  deleteEventRecord,
  getDashboardSummaryForOwner,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import * as collectionsModule from "@/lib/db/collections";
import type {
  EventModel,
  BudgetItemModel,
  TaskModel,
  EventVendorModel,
  IdeaModel,
  ConversationMessageModel,
} from "@/lib/types";

describe("Event Management & CRUD Security Suite", () => {
  const ownerId = new ObjectId();
  const unauthorizedUserId = new ObjectId();
  const eventId = new ObjectId();

  describe("Event Schema Authoritative Validation", () => {
    it("should validate a complete event creation payload with all 8 prompt criteria", () => {
      const validPayload = {
        title: "Kavya & Kabir Destination Sangeet",
        type: "wedding",
        date: "2026-12-20",
        timezone: "Asia/Kolkata",
        city: "Udaipur",
        location: "City Palace Lakefront Pavilion",
        venuePreference: "Historic Heritage Palace",
        indoorOutdoor: "mixed" as const,
        guestCount: 350,
        budgetTotal: 5000000,
        currency: "₹",
        theme: "Royal Heritage & Candlelit Amber",
        colorPreferences: ["Burgundy & Gold", "Ivory & Warm Amber"],
        foodPreferences: ["Traditional Royal Banquet", "Live Craft Counters"],
        eventPriorities: ["Catering & Culinary", "Decor & Ambiance"],
        accessibilityNeeds: ["Step-Free Wheelchair Access", "Assisted Buggy Transfer"],
        notes: "North gate entry for VIP arrivals.",
      };

      const result = createEventSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Kavya & Kabir Destination Sangeet");
        expect(result.data.type).toBe("wedding");
        expect(result.data.guestCount).toBe(350);
        expect(result.data.budgetTotal).toBe(5000000);
        expect(result.data.city).toBe("Udaipur");
        expect(result.data.colorPreferences).toHaveLength(2);
      }
    });

    it("should accept all 5 event archetype options including 'other'", () => {
      const archetypes = ["wedding", "birthday", "anniversary", "community", "other"] as const;

      archetypes.forEach((type) => {
        const payload = {
          title: `Celebration for ${type}`,
          type,
          date: "2026-11-15",
          location: "The Grand Ballroom",
          guestCount: 100,
          budgetTotal: 500000,
          theme: "Celebratory",
        };
        const result = createEventSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid payloads with negative budgets or zero guests", () => {
      const invalid = {
        title: "AB", // too short (min 3)
        type: "space_mission", // invalid enum
        date: "",
        location: "",
        guestCount: 0, // must be >= 1
        budgetTotal: -100, // must be >= 0
        theme: "",
      };

      const result = createEventSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain("title");
        expect(issues).toContain("type");
        expect(issues).toContain("guestCount");
        expect(issues).toContain("budgetTotal");
        expect(issues).toContain("theme");
      }
    });

    it("should validate partial updates with updateEventSchema", () => {
      const updatePayload = {
        title: "Updated Royal Reception Title",
        guestCount: 400,
        status: "confirmed" as const,
      };

      const result = updateEventSchema.safeParse(updatePayload);
      expect(result.success).toBe(true);
    });
  });

  describe("Event Retrieval & Ownership Verification (GET /api/events/[id])", () => {
    it("should allow the authorized owner to retrieve the event", async () => {
      const mockEvent: EventModel = {
        _id: eventId,
        ownerId,
        title: "Kavya & Kabir Destination Sangeet",
        type: "wedding",
        date: "2026-12-20",
        timezone: "Asia/Kolkata",
        location: "City Palace, Udaipur",
        guestCount: 350,
        currency: "₹",
        totalBudget: 5000000,
        theme: "Royal Heritage",
        preferences: {},
        status: "planning",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(mockEvent),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
        mockCollection as unknown as Collection<EventModel>
      );

      const result = await getEventById(eventId.toString(), ownerId.toString());
      expect(result).toBeDefined();
      expect(result._id).toEqual(eventId);
      expect(result.title).toBe("Kavya & Kabir Destination Sangeet");
    });

    it("should throw AuthorizationError when unauthorized user tries to access the event", async () => {
      const mockEvent: EventModel = {
        _id: eventId,
        ownerId,
        title: "Owner A's Private Event",
        type: "wedding",
        date: "2026-12-20",
        timezone: "Asia/Kolkata",
        location: "City Palace",
        guestCount: 200,
        currency: "₹",
        totalBudget: 1000000,
        theme: "Private",
        preferences: {},
        status: "planning",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(mockEvent),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
        mockCollection as unknown as Collection<EventModel>
      );

      await expect(
        getEventById(eventId.toString(), unauthorizedUserId.toString())
      ).rejects.toThrow(AuthorizationError);
    });

    it("should throw ResourceNotFoundError when event does not exist", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
        mockCollection as unknown as Collection<EventModel>
      );

      await expect(
        getEventById(eventId.toString(), ownerId.toString())
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe("Event Updating (PATCH /api/events/[id])", () => {
    it("should update event fields and refresh updatedAt timestamp", async () => {
      const initialEvent: EventModel = {
        _id: eventId,
        ownerId,
        title: "Initial Title",
        type: "wedding",
        date: "2026-12-20",
        timezone: "Asia/Kolkata",
        location: "Jaipur",
        guestCount: 200,
        currency: "₹",
        totalBudget: 2000000,
        theme: "Initial Theme",
        preferences: {},
        status: "planning",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedEvent: EventModel = {
        ...initialEvent,
        title: "Updated Grand Reception",
        guestCount: 280,
        totalBudget: 3000000,
        status: "confirmed",
        updatedAt: new Date(),
      };

      const mockCollection = {
        findOne: vi
          .fn()
          .mockResolvedValueOnce(initialEvent) // during ownership check
          .mockResolvedValueOnce(updatedEvent), // after update
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
        mockCollection as unknown as Collection<EventModel>
      );

      const result = await updateEventRecord(eventId.toString(), ownerId.toString(), {
        title: "Updated Grand Reception",
        guestCount: 280,
        totalBudget: 3000000,
        status: "confirmed",
      });

      expect(result.title).toBe("Updated Grand Reception");
      expect(result.guestCount).toBe(280);
      expect(result.status).toBe("confirmed");
      expect(mockCollection.updateOne).toHaveBeenCalled();
    });
  });

  describe("Cascading Child-Record Deletion Policy (DELETE /api/events/[id])", () => {
    it("should irrevocably purge event and all associated child documents (budget, tasks, vendors, ideas, messages)", async () => {
      const mockEvent: EventModel = {
        _id: eventId,
        ownerId,
        title: "Event to Delete",
        type: "wedding",
        date: "2026-12-20",
        timezone: "Asia/Kolkata",
        location: "Jaipur",
        guestCount: 200,
        currency: "₹",
        totalBudget: 2000000,
        theme: "Theme",
        preferences: {},
        status: "planning",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEventsCol = {
        findOne: vi.fn().mockResolvedValue(mockEvent),
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      };
      const mockBudgetCol = {
        deleteMany: vi.fn().mockResolvedValue({ deletedCount: 4 }),
      };
      const mockTasksCol = {
        deleteMany: vi.fn().mockResolvedValue({ deletedCount: 8 }),
      };
      const mockVendorsCol = {
        deleteMany: vi.fn().mockResolvedValue({ deletedCount: 3 }),
      };
      const mockIdeasCol = {
        deleteMany: vi.fn().mockResolvedValue({ deletedCount: 6 }),
      };
      const mockMessagesCol = {
        deleteMany: vi.fn().mockResolvedValue({ deletedCount: 12 }),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(mockEventsCol as unknown as Collection<EventModel>);
      vi.spyOn(collectionsModule, "getBudgetItemsCollection").mockResolvedValue(mockBudgetCol as unknown as Collection<BudgetItemModel>);
      vi.spyOn(collectionsModule, "getTasksCollection").mockResolvedValue(mockTasksCol as unknown as Collection<TaskModel>);
      vi.spyOn(collectionsModule, "getEventVendorsCollection").mockResolvedValue(mockVendorsCol as unknown as Collection<EventVendorModel>);
      vi.spyOn(collectionsModule, "getIdeasCollection").mockResolvedValue(mockIdeasCol as unknown as Collection<IdeaModel>);
      vi.spyOn(collectionsModule, "getConversationMessagesCollection").mockResolvedValue(mockMessagesCol as unknown as Collection<ConversationMessageModel>);

      const result = await deleteEventRecord(eventId.toString(), ownerId.toString());

      expect(result.success).toBe(true);
      expect(result.eventId).toBe(eventId.toString());
      expect(result.deletedCounts.event).toBe(1);
      expect(result.deletedCounts.budgetItems).toBe(4);
      expect(result.deletedCounts.tasks).toBe(8);
      expect(result.deletedCounts.eventVendors).toBe(3);
      expect(result.deletedCounts.ideas).toBe(6);
      expect(result.deletedCounts.conversationMessages).toBe(12);

      expect(mockEventsCol.deleteOne).toHaveBeenCalledWith({ _id: eventId, ownerId });
      expect(mockBudgetCol.deleteMany).toHaveBeenCalledWith({ eventId, ownerId });
      expect(mockTasksCol.deleteMany).toHaveBeenCalledWith({ eventId, ownerId });
    });
  });

  describe("Dashboard Metric Aggregation", () => {
    it("should aggregate total budget, guest count, and task completion percentage across owner's events", async () => {
      const event1: EventModel = {
        _id: new ObjectId(),
        ownerId,
        title: "Event 1",
        type: "wedding",
        date: "2026-12-25",
        timezone: "Asia/Kolkata",
        location: "Venue 1",
        guestCount: 200,
        currency: "₹",
        totalBudget: 2000000,
        theme: "T1",
        preferences: {},
        status: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event2: EventModel = {
        _id: new ObjectId(),
        ownerId,
        title: "Event 2",
        type: "anniversary",
        date: "2027-01-10",
        timezone: "Asia/Kolkata",
        location: "Venue 2",
        guestCount: 100,
        currency: "₹",
        totalBudget: 1000000,
        theme: "T2",
        preferences: {},
        status: "planning",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTasks = [
        { _id: new ObjectId(), eventId: event1._id, ownerId, title: "T1", dueDate: "2026-12-01", status: "completed", priority: "high" },
        { _id: new ObjectId(), eventId: event1._id, ownerId, title: "T2", dueDate: "2026-12-10", status: "completed", priority: "medium" },
        { _id: new ObjectId(), eventId: event2._id, ownerId, title: "T3", dueDate: "2026-12-15", status: "pending", priority: "urgent" },
        { _id: new ObjectId(), eventId: event2._id, ownerId, title: "T4", dueDate: "2026-12-20", status: "pending", priority: "low" },
      ];

      const mockBudgetItems = [
        { _id: new ObjectId(), eventId: event1._id, ownerId, estimatedAmount: 800000, actualAmount: 500000 },
        { _id: new ObjectId(), eventId: event2._id, ownerId, estimatedAmount: 400000, actualAmount: 200000 },
      ];

      const mockEventsCol = {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([event1, event2]),
          }),
        }),
      };
      const mockTasksCol = {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockTasks),
        }),
      };
      const mockBudgetCol = {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockBudgetItems),
        }),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(mockEventsCol as unknown as Collection<EventModel>);
      vi.spyOn(collectionsModule, "getTasksCollection").mockResolvedValue(mockTasksCol as unknown as Collection<TaskModel>);
      vi.spyOn(collectionsModule, "getBudgetItemsCollection").mockResolvedValue(mockBudgetCol as unknown as Collection<BudgetItemModel>);

      const summary = await getDashboardSummaryForOwner(ownerId.toString());

      expect(summary.totalEvents).toBe(2);
      expect(summary.totalBudget).toBe(3000000);
      expect(summary.totalGuests).toBe(300);
      expect(summary.totalEstimatedAmount).toBe(1200000);
      expect(summary.totalActualSpent).toBe(700000);
      expect(summary.tasksTotal).toBe(4);
      expect(summary.tasksCompleted).toBe(2);
      expect(summary.taskCompletionRate).toBe(50); // 2 out of 4 = 50%
      expect(summary.upcomingDeadlines).toHaveLength(2); // 2 pending tasks
    });
  });
});
