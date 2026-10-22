import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createEventSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiValidationError, apiError } from "@/lib/utils/response";
import { getEventsCollection } from "@/lib/db/collections";
import type { EventDocument } from "@/lib/types";

// In-memory fallback repository for quick local verification when MongoDB credentials are not yet supplied
const inMemoryEvents: EventDocument[] = [
  {
    id: "evt-aurora-wedding",
    userId: "usr_planora_demo_01",
    title: "Evelyn & Julian’s Botanical Glasshouse Wedding",
    type: "wedding",
    date: "2026-11-14",
    location: "Kew Gardens Conservatory, London",
    guestCount: 140,
    budgetTotal: 45000,
    budgetSpent: 31200,
    theme: "Botanical Glasshouse & Candlelit Gold",
    notes: "Ceremony begins at sunset. Focus on sustainable florals and live jazz trio.",
    status: "planning",
    tasks: [
      {
        id: "task-1",
        title: "Finalize menu tasting with artisan caterer",
        priority: "urgent",
        status: "in_progress",
        estimatedCost: 1200,
      },
      {
        id: "task-2",
        title: "Confirm floral arches and candle installations",
        priority: "high",
        status: "pending",
        estimatedCost: 3500,
      },
    ],
    timeline: [
      { id: "tl-1", time: "16:00", title: "Guest Arrival & Welcome Spritz", completed: false },
      { id: "tl-2", time: "16:45", title: "Glasshouse Ceremony", completed: false },
      { id: "tl-3", time: "18:00", title: "Golden Hour Cocktails & Canapés", completed: false },
    ],
    vendors: [
      {
        id: "v-1",
        name: "Wildflower Botanical Studio",
        category: "florals",
        estimatedCost: 4500,
        actualCost: 4200,
        status: "booked",
      },
      {
        id: "v-2",
        name: "Artisan Velvet Catering Co.",
        category: "catering",
        estimatedCost: 18500,
        actualCost: 18000,
        status: "booked",
      },
    ],
    aiIdeas: [
      {
        id: "idea-1",
        title: "Acoustic Sunset Transition",
        description: "Live cello & acoustic guitar transition during golden hour before dinner seating.",
        category: "activity",
        estimatedCostRange: "$600 - $900",
        tags: ["music", "romantic", "golden-hour"],
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "evt-beacon-anniversary",
    userId: "usr_planora_demo_01",
    title: "25th Silver Jubilee Rooftop Soirée",
    type: "anniversary",
    date: "2026-12-05",
    location: "The Standard High Line, New York",
    guestCount: 85,
    budgetTotal: 22000,
    budgetSpent: 14500,
    theme: "Mid-Century Modern & Starlit Silver",
    notes: "Strict RSVP deadline on Nov 10th. Surprise slideshow at 8:30 PM.",
    status: "confirmed",
    tasks: [
      {
        id: "task-3",
        title: "Book rooftop audio/visual projector",
        priority: "medium",
        status: "completed",
        estimatedCost: 800,
      },
    ],
    timeline: [
      { id: "tl-4", time: "19:00", title: "Champagne Reception", completed: true },
      { id: "tl-5", time: "20:30", title: "Toast & Anniversary Retrospective", completed: false },
    ],
    vendors: [
      {
        id: "v-3",
        name: "Skyline Audio & Visuals",
        category: "other",
        estimatedCost: 1200,
        actualCost: 1200,
        status: "booked",
      },
    ],
    aiIdeas: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    // If MongoDB URI is configured, query the scoped collection
    if (process.env.MONGODB_URI) {
      const collection = await getEventsCollection();
      const events = await collection
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray();
      return apiSuccess(events);
    }

    // Development fallback scoped to the authenticated user ID
    const userEvents = inMemoryEvents.filter((e) => e.userId === user.userId);
    return apiSuccess(userEvents);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return apiError("Failed to fetch events", "DATABASE_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();

    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const timestamp = new Date().toISOString();
    const newEvent: EventDocument = {
      id: `evt-${Date.now()}`,
      userId: user.userId, // Strictly set from server session, never trusting client
      title: parsed.data.title,
      type: parsed.data.type,
      date: parsed.data.date,
      location: parsed.data.location,
      guestCount: parsed.data.guestCount,
      budgetTotal: parsed.data.budgetTotal,
      budgetSpent: 0, // Server calculated
      theme: parsed.data.theme,
      notes: parsed.data.notes,
      status: "planning",
      tasks: [],
      timeline: [],
      vendors: [],
      aiIdeas: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (process.env.MONGODB_URI) {
      const collection = await getEventsCollection();
      await collection.insertOne(newEvent);
    } else {
      inMemoryEvents.unshift(newEvent);
    }

    return apiSuccess(newEvent, 201);
  } catch (error) {
    console.error("POST /api/events error:", error);
    return apiError("Failed to create event", "SERVER_ERROR", 500);
  }
}
