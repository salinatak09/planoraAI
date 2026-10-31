import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { createEventSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiValidationError, apiError, apiUnauthorized } from "@/lib/utils/response";
import { getEventsCollection } from "@/lib/db/collections";
import { parsePaginationParams, buildPaginatedResult } from "@/lib/utils/pagination";
import { serializeDocument, serializeDocuments, toOptionalObjectId } from "@/lib/utils/objectid";
import { ObjectId } from "mongodb";
import type { EventModel } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to view events");
      }
      throw err;
    }

    const pagination = parsePaginationParams(req.nextUrl.searchParams);
    const filterType = req.nextUrl.searchParams.get("type");

    if (process.env.MONGODB_URI) {
      const collection = await getEventsCollection();

      // Convert user.userId to ObjectId if valid, or query string
      const userObjectId = toOptionalObjectId(user.userId);
      const query: Record<string, unknown> = userObjectId
        ? { $or: [{ ownerId: userObjectId }, { ownerId: user.userId }, { userId: user.userId }] }
        : { $or: [{ ownerId: user.userId }, { userId: user.userId }] };

      if (filterType && filterType !== "all") {
        query.type = filterType;
      }

      const [items, total] = await Promise.all([
        collection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .toArray(),
        collection.countDocuments(query),
      ]);

      const serialized = serializeDocuments(items);
      const paginated = buildPaginatedResult(serialized, total, pagination);
      return apiSuccess(paginated);
    }

    // Default demo payload when MONGODB_URI is not set in development
    const sampleItems = [
      {
        id: "evt-aarav-meera",
        _id: "671800000000000000000001",
        ownerId: user.userId,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const paginated = buildPaginatedResult(sampleItems, sampleItems.length, pagination);
    return apiSuccess(paginated);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return apiError("Failed to fetch events", "DATABASE_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to create an event");
      }
      throw err;
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const now = new Date();
    const ownerObjectId = toOptionalObjectId(user.userId) || new ObjectId();
    const eventId = new ObjectId();

    const preferences = {
      ...(parsed.data.city ? { city: parsed.data.city } : {}),
      ...(parsed.data.venuePreference ? { venuePreference: parsed.data.venuePreference } : {}),
      ...(parsed.data.indoorOutdoor ? { indoorOutdoor: parsed.data.indoorOutdoor } : {}),
      colorPreferences: parsed.data.colorPreferences || [],
      foodPreferences: parsed.data.foodPreferences || [],
      eventPriorities: parsed.data.eventPriorities || [],
      accessibilityNeeds: parsed.data.accessibilityNeeds || [],
      ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.preferences || {}),
    };

    const newEvent: EventModel = {
      _id: eventId,
      ownerId: ownerObjectId,
      title: parsed.data.title,
      type: parsed.data.type,
      date: parsed.data.date,
      timezone: parsed.data.timezone || "Asia/Kolkata",
      location: parsed.data.location,
      guestCount: parsed.data.guestCount,
      currency: parsed.data.currency || "₹",
      totalBudget: parsed.data.budgetTotal,
      theme: parsed.data.theme,
      preferences,
      status: "planning",
      createdAt: now,
      updatedAt: now,
    };

    if (process.env.MONGODB_URI) {
      const collection = await getEventsCollection();
      await collection.insertOne(newEvent);

      // Seed starter budget envelopes and starter tasks for immediate productivity
      try {
        const [budgetCol, taskCol] = await Promise.all([
          (await import("@/lib/db/collections")).getBudgetItemsCollection(),
          (await import("@/lib/db/collections")).getTasksCollection(),
        ]);

        const totalB = parsed.data.budgetTotal;
        const initialBudgetItems = [
          {
            _id: new ObjectId(),
            eventId,
            ownerId: ownerObjectId,
            category: "venue",
            description: "Venue reservation & security deposit",
            estimatedAmount: Math.round(totalB * 0.35),
            actualAmount: 0,
            paymentStatus: "unpaid" as const,
            createdAt: now,
            updatedAt: now,
          },
          {
            _id: new ObjectId(),
            eventId,
            ownerId: ownerObjectId,
            category: "catering",
            description: "Bespoke banquet menu & bar service",
            estimatedAmount: Math.round(totalB * 0.25),
            actualAmount: 0,
            paymentStatus: "unpaid" as const,
            createdAt: now,
            updatedAt: now,
          },
          {
            _id: new ObjectId(),
            eventId,
            ownerId: ownerObjectId,
            category: "decor",
            description: "Theme styling, florals & stage lighting",
            estimatedAmount: Math.round(totalB * 0.2),
            actualAmount: 0,
            paymentStatus: "unpaid" as const,
            createdAt: now,
            updatedAt: now,
          },
          {
            _id: new ObjectId(),
            eventId,
            ownerId: ownerObjectId,
            category: "photography",
            description: "Cinematography & photography team",
            estimatedAmount: Math.round(totalB * 0.1),
            actualAmount: 0,
            paymentStatus: "unpaid" as const,
            createdAt: now,
            updatedAt: now,
          },
        ];

        const initialTasks = [
          {
            _id: new ObjectId(),
            eventId,
            ownerId: ownerObjectId,
            title: "Confirm venue contract & permit filings",
            description: "Review capacity limits and sound curfew requirements.",
            dueDate: parsed.data.date,
            priority: "high" as const,
            status: "pending" as const,
            assignedTo: "Lead Planner",
            createdAt: now,
            updatedAt: now,
          },
          {
            _id: new ObjectId(),
            eventId,
            ownerId: ownerObjectId,
            title: "Finalize dietary requirements & menu tasting",
            description: "Address allergen protocols and signature mocktails.",
            dueDate: parsed.data.date,
            priority: "medium" as const,
            status: "pending" as const,
            assignedTo: "Catering Lead",
            createdAt: now,
            updatedAt: now,
          },
        ];

        await Promise.all([
          budgetCol.insertMany(initialBudgetItems),
          taskCol.insertMany(initialTasks),
        ]);
      } catch (seedErr) {
        // Non-blocking error if starter items fail
        console.warn("Could not seed starter items:", seedErr);
      }
    }

    return apiSuccess(serializeDocument(newEvent), 201);
  } catch (error) {
    console.error("POST /api/events error:", error);
    return apiError("Failed to create event", "SERVER_ERROR", 500);
  }
}
