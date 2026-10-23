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

    const newEvent: EventModel = {
      _id: new ObjectId(),
      ownerId: ownerObjectId,
      title: parsed.data.title,
      type: parsed.data.type,
      date: parsed.data.date,
      timezone: "Asia/Kolkata",
      location: parsed.data.location,
      guestCount: parsed.data.guestCount,
      currency: "₹",
      totalBudget: parsed.data.budgetTotal,
      theme: parsed.data.theme,
      preferences: {},
      status: "planning",
      createdAt: now,
      updatedAt: now,
    };

    if (process.env.MONGODB_URI) {
      const collection = await getEventsCollection();
      await collection.insertOne(newEvent);
    }

    return apiSuccess(serializeDocument(newEvent), 201);
  } catch (error) {
    console.error("POST /api/events error:", error);
    return apiError("Failed to create event", "SERVER_ERROR", 500);
  }
}
