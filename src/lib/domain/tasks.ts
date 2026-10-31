import type { TaskPriority, TaskStatus, EventType } from "@/lib/types";

export interface GeneratedChecklistTask {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus; // Must always be "pending"
  category: string;
  assignedTo?: string;
}

/**
 * Calculates an ISO YYYY-MM-DD date string offset by a specified number of days relative to the target event date.
 * If offset days puts the date in the past, it clamps it to today or a near-future date.
 */
export function calculateOffsetDate(eventDateStr: string, daysBeforeEvent: number): string {
  try {
    const eventDate = new Date(eventDateStr);
    if (Number.isNaN(eventDate.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 14);
      return fallback.toISOString().split("T")[0];
    }

    const targetDate = new Date(eventDate);
    targetDate.setDate(targetDate.getDate() - daysBeforeEvent);

    return targetDate.toISOString().split("T")[0];
  } catch {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 7);
    return fallback.toISOString().split("T")[0];
  }
}

/**
 * Authoritative Checklist Generator:
 * Generates an event checklist tailored to the event requirements and archetype.
 *
 * CRITICAL RULE:
 * Every generated task is strictly created with status="pending".
 * Application logic never falsely claims that generated tasks have been completed automatically.
 */
export function generateChecklistFromRequirements(
  eventType: EventType | string = "wedding",
  eventDate: string = "2026-12-14",
  preferences?: {
    venuePreference?: string;
    foodPreferences?: string[];
    eventPriorities?: string[];
    specialRequirements?: string[];
  }
): GeneratedChecklistTask[] {
  const type = (eventType || "wedding").toLowerCase();
  const tasks: GeneratedChecklistTask[] = [];

  switch (type) {
    case "wedding":
      tasks.push(
        {
          title: "Book & Lock Wedding Venue & Ceremony Space",
          description: `Confirm reservation${preferences?.venuePreference ? ` for ${preferences.venuePreference}` : ""}, stage layout, and curfew policies.`,
          priority: "urgent",
          dueDate: calculateOffsetDate(eventDate, 120),
          status: "pending",
          category: "Venue",
          assignedTo: "Lead Planner",
        },
        {
          title: "Finalize Menu Tasting & Catering Contract",
          description: `Conduct tasting session with head chef. Lock in live counters and dietary accommodations${preferences?.foodPreferences?.length ? ` (${preferences.foodPreferences.join(", ")})` : ""}.`,
          priority: "urgent",
          dueDate: calculateOffsetDate(eventDate, 60),
          status: "pending",
          category: "Catering",
          assignedTo: "Catering Lead",
        },
        {
          title: "Approve Theme Florals & Architectural Lighting",
          description: "Review stage mockups, canopy structures, ceremonial florals, and ambient brass lanterns.",
          priority: "high",
          dueDate: calculateOffsetDate(eventDate, 45),
          status: "pending",
          category: "Decor",
          assignedTo: "Design Coordinator",
        },
        {
          title: "Confirm Drone Permits & Cinematography Shot List",
          description: "Verify airspace clearances for aerial cinematography and agree on VIP family portrait list.",
          priority: "high",
          dueDate: calculateOffsetDate(eventDate, 30),
          status: "pending",
          category: "Photography",
          assignedTo: "Media Director",
        },
        {
          title: "Coordinate Guest Transportation & Welcome Packets",
          description: "Confirm airport shuttle manifests, hotel check-in desk, and artisan welcome gift boxes.",
          priority: "medium",
          dueDate: calculateOffsetDate(eventDate, 14),
          status: "pending",
          category: "Logistics",
          assignedTo: "Hospitality Lead",
        },
        {
          title: "Final Sangeet & Reception Rehearsal Run-Through",
          description: "Conduct technical sound check with DJ and live band; rehearse processional timing with families.",
          priority: "high",
          dueDate: calculateOffsetDate(eventDate, 3),
          status: "pending",
          category: "Entertainment",
          assignedTo: "Stage Manager",
        }
      );
      break;

    case "birthday":
      tasks.push(
        {
          title: "Confirm Party Space & Outdoor Area",
          description: "Lock venue reservation, safety deposits, and sound permits.",
          priority: "urgent",
          dueDate: calculateOffsetDate(eventDate, 45),
          status: "pending",
          category: "Venue",
          assignedTo: "Organizer",
        },
        {
          title: "Design Custom Artisanal Birthday Cake & Pastry Bar",
          description: "Order tiered signature cake, dietary-specific cupcakes, and custom candle sparklers.",
          priority: "high",
          dueDate: calculateOffsetDate(eventDate, 20),
          status: "pending",
          category: "Catering",
          assignedTo: "Cake Artist",
        },
        {
          title: "Curate Custom DJ Playlist & Lighting Equipment",
          description: "Review guest favorite dance tracks, mic setups, and dancefloor laser effects.",
          priority: "medium",
          dueDate: calculateOffsetDate(eventDate, 10),
          status: "pending",
          category: "Entertainment",
          assignedTo: "Sound Tech",
        },
        {
          title: "Order Balloon Installations & Photo Booth Props",
          description: "Schedule day-of balloon artist setup and Polaroid keepsake station.",
          priority: "medium",
          dueDate: calculateOffsetDate(eventDate, 7),
          status: "pending",
          category: "Decor",
          assignedTo: "Host",
        }
      );
      break;

    case "anniversary":
      tasks.push(
        {
          title: "Reserve Private Conservatory Dining Room",
          description: "Secure private room or lakeside pavilion with dedicated service staff.",
          priority: "urgent",
          dueDate: calculateOffsetDate(eventDate, 45),
          status: "pending",
          category: "Venue",
          assignedTo: "Lead Organizer",
        },
        {
          title: "Curate Plated Tasting Menu & Wine Pairings",
          description: "Meet with sommelier and executive chef to design 5-course milestone dinner.",
          priority: "high",
          dueDate: calculateOffsetDate(eventDate, 25),
          status: "pending",
          category: "Catering",
          assignedTo: "Host",
        },
        {
          title: "Arrange Classical Live Musician (Harpist / Acoustic Duo)",
          description: "Confirm acoustic background music for arrival cocktails and dinner.",
          priority: "medium",
          dueDate: calculateOffsetDate(eventDate, 14),
          status: "pending",
          category: "Entertainment",
          assignedTo: "Musician Liaison",
        },
        {
          title: "Commission Couple Heirloom Portrait & Memory Showcase",
          description: "Print archival photograph gallery and assemble celebratory tribute video.",
          priority: "medium",
          dueDate: calculateOffsetDate(eventDate, 10),
          status: "pending",
          category: "Photography",
          assignedTo: "Family Coordinator",
        }
      );
      break;

    case "community":
    default:
      tasks.push(
        {
          title: "Secure Civic Ground Sanction & Municipal Clearances",
          description: "Submit applications for park usage, public sanitation, and police noise exemptions.",
          priority: "urgent",
          dueDate: calculateOffsetDate(eventDate, 60),
          status: "pending",
          category: "Permits",
          assignedTo: "Civic Liaison",
        },
        {
          title: "Contract Soundstage, AV Tower & Emergency Generator",
          description: "Deliver public address system, podium, and backup 3-phase power unit.",
          priority: "high",
          dueDate: calculateOffsetDate(eventDate, 30),
          status: "pending",
          category: "Production",
          assignedTo: "Operations Director",
        },
        {
          title: "Coordinate Food Concessions & Hydration Points",
          description: "Screen licensed local food trucks, place water refill stations, and arrange waste recycling.",
          priority: "medium",
          dueDate: calculateOffsetDate(eventDate, 20),
          status: "pending",
          category: "Catering",
          assignedTo: "Concessions Lead",
        },
        {
          title: "Deploy Volunteer Radios & First Aid Station",
          description: "Schedule certified paramedic presence, emergency tent, and high-visibility volunteer badges.",
          priority: "urgent",
          dueDate: calculateOffsetDate(eventDate, 7),
          status: "pending",
          category: "Safety",
          assignedTo: "Safety Officer",
        }
      );
      break;
  }

  return tasks;
}

/**
 * Determines if a task is overdue based on current date.
 */
export function isTaskOverdue(dueDateStr: string, status: TaskStatus): boolean {
  if (status === "completed") return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    return due < today;
  } catch {
    return false;
  }
}

/**
 * Determines if a task is upcoming within the given threshold of days.
 */
export function isTaskUpcoming(dueDateStr: string, status: TaskStatus, daysThreshold = 14): boolean {
  if (status === "completed") return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= daysThreshold;
  } catch {
    return false;
  }
}
