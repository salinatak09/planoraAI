import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import {
  objectIdSchema,
  userSchema,
  eventModelSchema,
  budgetItemSchema,
  taskModelSchema,
  vendorModelSchema,
  eventVendorModelSchema,
  ideaModelSchema,
  conversationMessageSchema,
} from "@/lib/validation/schemas";
import {
  isValidObjectId,
  toObjectId,
  serializeDocument,
  serializeDocuments,
} from "@/lib/utils/objectid";
import { parsePaginationParams, buildPaginatedResult } from "@/lib/utils/pagination";

describe("MongoDB Atlas Data Layer - Models & Validation", () => {
  const mockOwnerId = new ObjectId().toString();
  const mockEventId = new ObjectId().toString();
  const mockVendorId = new ObjectId().toString();

  describe("ObjectId Utilities", () => {
    it("should validate real 24-character hex ObjectIds", () => {
      const valid = new ObjectId().toString();
      expect(isValidObjectId(valid)).toBe(true);
      expect(isValidObjectId(new ObjectId())).toBe(true);
      expect(isValidObjectId("invalid-id")).toBe(false);
      expect(isValidObjectId("")).toBe(false);
      expect(isValidObjectId(null)).toBe(false);

      expect(objectIdSchema.safeParse(valid).success).toBe(true);
      expect(objectIdSchema.safeParse("not-hex").success).toBe(false);

      const converted = toObjectId(valid);
      expect(converted.toString()).toBe(valid);
    });

    it("should serialize ObjectIds and Dates to string safely for API JSON boundaries", () => {
      const oid = new ObjectId();
      const date = new Date("2026-10-22T12:00:00Z");

      const rawDoc = {
        _id: oid,
        title: "Jaipur Palace Showcase",
        createdAt: date,
        nested: {
          subId: oid,
        },
      };

      const serialized = serializeDocument(rawDoc) as Record<string, unknown>;
      const nested = serialized.nested as Record<string, unknown>;

      expect(serialized.id).toBe(oid.toString());
      expect(serialized._id).toBe(oid.toString());
      expect(serialized.createdAt).toBe("2026-10-22T12:00:00.000Z");
      expect(nested.subId).toBe(oid.toString());
    });

    it("should serialize arrays of documents", () => {
      const oid1 = new ObjectId();
      const oid2 = new ObjectId();
      const docs = [{ _id: oid1 }, { _id: oid2 }];

      const serialized = serializeDocuments(docs) as Array<Record<string, unknown>>;
      expect(serialized).toHaveLength(2);
      expect(serialized[0].id).toBe(oid1.toString());
      expect(serialized[1].id).toBe(oid2.toString());
    });
  });

  describe("User Model Schema", () => {
    it("should validate a proper User model record", () => {
      const validUser = {
        displayName: "Priya Sharma",
        email: "priya@planora.ai",
        authProvider: "credentials",
        preferences: {
          defaultCurrency: "₹",
          timezone: "Asia/Kolkata",
          notifications: true,
        },
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("should reject invalid emails in User record", () => {
      const invalidUser = {
        displayName: "Priya Sharma",
        email: "not-an-email",
        authProvider: "credentials",
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe("Event Model Schema", () => {
    it("should validate a complete Event model record", () => {
      const validEvent = {
        ownerId: mockOwnerId,
        title: "Aarav & Meera Wedding Celebration",
        type: "wedding",
        date: "2026-12-14",
        timezone: "Asia/Kolkata",
        location: "Jaipur Royal Palace, Rajasthan",
        guestCount: 350,
        currency: "₹",
        totalBudget: 3850000,
        theme: "Royal Palace Heritage & Candlelit Amber",
        preferences: { splurgePriority: "decor" },
        status: "confirmed",
      };

      const result = eventModelSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should reject events with invalid ownerId ObjectId", () => {
      const invalidEvent = {
        ownerId: "not-a-mongo-id",
        title: "Aarav & Meera Wedding Celebration",
        type: "wedding",
        date: "2026-12-14",
        location: "Jaipur",
        guestCount: 100,
        totalBudget: 50000,
        theme: "Royal",
      };

      const result = eventModelSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe("BudgetItem Model Schema", () => {
    it("should validate a budget item with payment status", () => {
      const validBudgetItem = {
        eventId: mockEventId,
        ownerId: mockOwnerId,
        category: "Florals & Decor",
        description: "Marigold chandeliers and brass urns",
        estimatedAmount: 580000,
        actualAmount: 580000,
        paymentStatus: "deposit_paid",
      };

      const result = budgetItemSchema.safeParse(validBudgetItem);
      expect(result.success).toBe(true);
    });

    it("should reject negative budget amounts", () => {
      const invalidItem = {
        eventId: mockEventId,
        ownerId: mockOwnerId,
        category: "Florals",
        description: "Invalid",
        estimatedAmount: -100,
        actualAmount: 500,
        paymentStatus: "unpaid",
      };

      const result = budgetItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe("Task Model Schema", () => {
    it("should validate a milestone task record", () => {
      const validTask = {
        eventId: mockEventId,
        ownerId: mockOwnerId,
        title: "Approve royal mandap brass lighting mockups",
        description: "Review canopy mockups with Wildflower Studio",
        dueDate: "2026-11-12",
        priority: "high",
        status: "in_progress",
        assignedTo: "Priya Sharma",
      };

      const result = taskModelSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });
  });

  describe("Vendor & EventVendor Model Schemas", () => {
    it("should validate a shared directory Vendor record", () => {
      const validVendor = {
        isShared: true,
        name: "Wildflower Botanical Studio",
        category: "florals",
        location: "Jaipur, Rajasthan",
        contact: {
          name: "Ananya Deshmukh",
          email: "ananya@wildflower.in",
          phone: "+91 98201 44510",
        },
        priceRange: "$$$",
        verificationStatus: "verified",
      };

      const result = vendorModelSchema.safeParse(validVendor);
      expect(result.success).toBe(true);
    });

    it("should validate an EventVendor contract association", () => {
      const validContract = {
        eventId: mockEventId,
        vendorId: mockVendorId,
        ownerId: mockOwnerId,
        quotedAmount: 580000,
        bookingStatus: "booked",
        notes: "Full day setup on Dec 14th with advance paid",
      };

      const result = eventVendorModelSchema.safeParse(validContract);
      expect(result.success).toBe(true);
    });
  });

  describe("Idea & ConversationMessage Model Schemas", () => {
    it("should validate an AI Idea model record", () => {
      const validIdea = {
        eventId: mockEventId,
        ownerId: mockOwnerId,
        category: "decor",
        title: "Marigold & Brass Floating Candle Pavilions",
        description: "Cast antique brass urli bowls with floating beeswax candles surrounding the pool.",
        estimatedCost: "₹45,000 - ₹65,000",
      };

      const result = ideaModelSchema.safeParse(validIdea);
      expect(result.success).toBe(true);
    });

    it("should validate a ConversationMessage record", () => {
      const validMsg = {
        eventId: mockEventId,
        ownerId: mockOwnerId,
        role: "assistant",
        content: "Sound curfews in Jaipur take effect at 22:00. Moving brass to 17:30.",
      };

      const result = conversationMessageSchema.safeParse(validMsg);
      expect(result.success).toBe(true);
    });
  });

  describe("Pagination Utilities", () => {
    it("should parse default pagination parameters safely", () => {
      const params = parsePaginationParams({});
      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
      expect(params.skip).toBe(0);
    });

    it("should enforce maximum limit ceiling of 100", () => {
      const params = parsePaginationParams({ page: "2", limit: "999" });
      expect(params.page).toBe(2);
      expect(params.limit).toBe(100);
      expect(params.skip).toBe(100);
    });

    it("should correctly build paginated response envelopes", () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = buildPaginatedResult(items, 50, { page: 1, limit: 10, skip: 0 });
      expect(result.items).toHaveLength(2);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(false);
    });
  });
});
