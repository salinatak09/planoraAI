import { describe, it, expect } from "vitest";
import {
  createEventSchema,
  aiGenerateIdeasSchema,
  vendorSchema,
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  describe("createEventSchema", () => {
    it("should accept valid event payload", () => {
      const validPayload = {
        title: "Golden Anniversary Gala",
        type: "anniversary",
        date: "2026-12-10",
        location: "The Glass House, New York",
        guestCount: 120,
        budgetTotal: 25000,
        theme: "Vintage Hollywood Glamour",
        notes: "Black tie optional.",
      };

      const result = createEventSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Golden Anniversary Gala");
        expect(result.data.guestCount).toBe(120);
      }
    });

    it("should reject negative guest count or budget", () => {
      const invalidPayload = {
        title: "Micro Party",
        type: "birthday",
        date: "2026-11-01",
        location: "Home",
        guestCount: 0,
        budgetTotal: -500,
        theme: "Neon",
      };

      const result = createEventSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorFields = result.error.issues.map((i) => i.path[0]);
        expect(errorFields).toContain("guestCount");
        expect(errorFields).toContain("budgetTotal");
      }
    });

    it("should reject invalid event types", () => {
      const invalidTypePayload = {
        title: "Space Launch",
        type: "space_mission", // Not in enum
        date: "2026-11-01",
        location: "Cape Canaveral",
        guestCount: 50,
        budgetTotal: 10000,
        theme: "Cosmic",
      };

      const result = createEventSchema.safeParse(invalidTypePayload);
      expect(result.success).toBe(false);
    });
  });

  describe("vendorSchema", () => {
    it("should accept valid vendor and enforce category enums", () => {
      const validVendor = {
        id: "v-123",
        name: "Luxe Flora Co.",
        category: "florals",
        contactName: "Sarah Connor",
        email: "sarah@luxeflora.com",
        estimatedCost: 3500,
        status: "booked",
      };

      const result = vendorSchema.safeParse(validVendor);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email formats", () => {
      const invalidVendor = {
        id: "v-123",
        name: "Luxe Flora Co.",
        category: "florals",
        email: "not-an-email",
        estimatedCost: 3500,
        status: "booked",
      };

      const result = vendorSchema.safeParse(invalidVendor);
      expect(result.success).toBe(false);
    });
  });

  describe("aiGenerateIdeasSchema", () => {
    it("should accept valid AI generation request", () => {
      const promptPayload = {
        eventType: "wedding",
        theme: "Midsummer Tuscan Vineyard",
        guestCount: 80,
        budget: 35000,
        focusArea: "decor",
      };

      const result = aiGenerateIdeasSchema.safeParse(promptPayload);
      expect(result.success).toBe(true);
    });
  });
});
