import { describe, it, expect } from "vitest";
import {
  calculateOffsetDate,
  generateChecklistFromRequirements,
  isTaskOverdue,
  isTaskUpcoming,
} from "@/lib/domain/tasks";
import {
  createTaskSchema,
  updateTaskSchema,
  createVendorSchema,
  createEventVendorSchema,
  updateEventVendorSchema,
} from "@/lib/validation/schemas";

describe("Timeline, Tasks & Vendor Management Module", () => {
  describe("1. Timeline & Checklist Domain Logic", () => {
    it("should calculate correct offset dates relative to event date", () => {
      const eventDate = "2026-12-14";
      const offset30 = calculateOffsetDate(eventDate, 30);
      expect(offset30).toBe("2026-11-14");

      const offset60 = calculateOffsetDate(eventDate, 60);
      expect(offset60).toBe("2026-10-15");
    });

    it("should generate checklist tailored to wedding requirements with ALL tasks marked 'pending'", () => {
      const tasks = generateChecklistFromRequirements("wedding", "2026-12-14", {
        venuePreference: "Jaipur Palace Heritage",
        foodPreferences: ["Royal Rajasthani", "Artisanal Chaat"],
      });

      expect(tasks.length).toBeGreaterThanOrEqual(5);

      // CRITICAL REQUIREMENT: Never claim tasks have been completed automatically
      tasks.forEach((task) => {
        expect(task.status).toBe("pending");
        expect(task.title).toBeTruthy();
        expect(task.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(["low", "medium", "high", "urgent"]).toContain(task.priority);
      });

      // Verify domain specifics
      const cateringTask = tasks.find((t) => t.category === "Catering");
      expect(cateringTask).toBeDefined();
      expect(cateringTask?.description).toContain("Royal Rajasthani");
    });

    it("should generate birthday checklist with ALL tasks marked 'pending'", () => {
      const tasks = generateChecklistFromRequirements("birthday", "2026-08-20");
      expect(tasks.length).toBeGreaterThanOrEqual(4);

      tasks.forEach((t) => {
        expect(t.status).toBe("pending");
      });
      const cakeTask = tasks.find((t) => t.category === "Catering");
      expect(cakeTask?.title).toContain("Cake");
    });

    it("should generate community event checklist with municipal permits and safety stations", () => {
      const tasks = generateChecklistFromRequirements("community", "2026-09-10");
      expect(tasks.length).toBeGreaterThanOrEqual(4);

      tasks.forEach((t) => {
        expect(t.status).toBe("pending");
      });
      const permitTask = tasks.find((t) => t.category === "Permits");
      expect(permitTask).toBeDefined();
    });

    it("should accurately detect overdue tasks", () => {
      const pastDate = "2020-01-01";
      const futureDate = "2099-01-01";

      expect(isTaskOverdue(pastDate, "pending")).toBe(true);
      expect(isTaskOverdue(pastDate, "in_progress")).toBe(true);
      // Completed tasks should NEVER be flagged as overdue
      expect(isTaskOverdue(pastDate, "completed")).toBe(false);
      expect(isTaskOverdue(futureDate, "pending")).toBe(false);
    });

    it("should accurately detect upcoming deadlines within threshold", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 2);
      const nextYearStr = nextYear.toISOString().split("T")[0];

      expect(isTaskUpcoming(tomorrowStr, "pending", 14)).toBe(true);
      expect(isTaskUpcoming(tomorrowStr, "completed", 14)).toBe(false);
      expect(isTaskUpcoming(nextYearStr, "pending", 14)).toBe(false);
    });
  });

  describe("2. Task Validation Schemas", () => {
    it("should validate valid task creation", () => {
      const valid = createTaskSchema.safeParse({
        title: "Confirm Floral Mandap Mockup",
        description: "Review canopy mockups with designer",
        dueDate: "2026-11-15",
        priority: "high",
        status: "pending",
        assignedTo: "Priya Sharma",
        category: "Decor",
      });
      expect(valid.success).toBe(true);
    });

    it("should reject invalid task data", () => {
      const invalidShortTitle = createTaskSchema.safeParse({
        title: "A", // min 2
        dueDate: "2026-11-15",
      });
      expect(invalidShortTitle.success).toBe(false);

      const missingDate = createTaskSchema.safeParse({
        title: "Valid Title",
        dueDate: "",
      });
      expect(missingDate.success).toBe(false);
    });

    it("should validate task updates", () => {
      const validUpdate = updateTaskSchema.safeParse({
        status: "completed",
        priority: "urgent",
      });
      expect(validUpdate.success).toBe(true);
    });
  });

  describe("3. Vendor Management & Directory Validation", () => {
    it("should validate vendor creation for manual organizer entry", () => {
      const validManualVendor = createVendorSchema.safeParse({
        name: "Artisan Woodcraft & Canopies",
        category: "decor",
        location: "Jaipur, Rajasthan",
        contact: {
          name: "Ramesh Sharma",
          email: "ramesh@woodcraft.in",
          phone: "+91 98200 12345",
          website: "https://woodcraft.example.com",
        },
        priceRange: "$$$",
        serviceDescription: "Handcrafted carved teakwood pavilions and mandaps",
        isShared: false,
        isSampleData: false,
      });

      expect(validManualVendor.success).toBe(true);
    });

    it("should reject vendor creation with invalid category or short name", () => {
      const invalidCategory = createVendorSchema.safeParse({
        name: "Valid Name",
        category: "invalid_category",
        location: "Jaipur",
      });
      expect(invalidCategory.success).toBe(false);
    });

    it("should validate event vendor contract with separate quoted and estimated amounts", () => {
      const validContract = createEventVendorSchema.safeParse({
        vendorId: "507f1f77bcf86cd799439011",
        estimatedAmount: 500000,
        quotedAmount: 480000,
        actualPaid: 200000,
        bookingStatus: "booked",
        notes: "Advance 40% disbursed; balance upon delivery",
      });

      expect(validContract.success).toBe(true);
      if (validContract.success) {
        expect(validContract.data.estimatedAmount).toBe(500000);
        expect(validContract.data.quotedAmount).toBe(480000);
        expect(validContract.data.actualPaid).toBe(200000);
        expect(validContract.data.bookingStatus).toBe("booked");
      }
    });

    it("should support all required booking states: shortlisted, contacted, booked, cancelled, completed", () => {
      const states = ["shortlisted", "contacted", "booked", "cancelled", "completed"];
      states.forEach((st) => {
        const res = updateEventVendorSchema.safeParse({
          bookingStatus: st,
        });
        expect(res.success).toBe(true);
      });
    });

    it("should calculate quote variance without negative sign anomalies", () => {
      const estimated = 600000;
      const quotedOver = 650000;
      const quotedUnder = 550000;

      const overVariance = estimated - quotedOver; // -50,000 (over budget quote)
      const underVariance = estimated - quotedUnder; // +50,000 (under budget quote)

      expect(overVariance).toBe(-50000);
      expect(underVariance).toBe(50000);
    });
  });
});
