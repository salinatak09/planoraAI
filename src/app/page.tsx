import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { EventDocument } from "@/lib/types";

// Seeded initial event data showcasing core functionality
const initialEvents: EventDocument[] = [
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
        createdAt: "2026-10-22T12:00:00.000Z",
      },
      {
        id: "idea-2",
        title: "Botanical Glasshouse Seed Packet Favors",
        description: "Handcrafted wild blossom seed packets doubling as customized guest name placement cards.",
        category: "decor",
        estimatedCostRange: "$250 - $400",
        tags: ["sustainable", "favors", "botanical"],
        createdAt: "2026-10-22T12:05:00.000Z",
      },
    ],
    createdAt: "2026-10-22T10:00:00.000Z",
    updatedAt: "2026-10-22T10:00:00.000Z",
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
    createdAt: "2026-10-22T11:00:00.000Z",
    updatedAt: "2026-10-22T11:00:00.000Z",
  },
  {
    id: "evt-solstice-birthday",
    userId: "usr_planora_demo_01",
    title: "Harper's Enchanted 30th Forest Celebration",
    type: "birthday",
    date: "2026-11-28",
    location: "Redwood Meadow Sanctuary, Big Sur",
    guestCount: 50,
    budgetTotal: 12000,
    budgetSpent: 8900,
    theme: "Enchanted Bohemian Forest & Woodland Banquet",
    status: "planning",
    tasks: [],
    timeline: [],
    vendors: [],
    aiIdeas: [],
    createdAt: "2026-10-22T11:30:00.000Z",
    updatedAt: "2026-10-22T11:30:00.000Z",
  },
  {
    id: "evt-civic-harvest",
    userId: "usr_planora_demo_01",
    title: "Oakridge Annual Harvest & Lantern Festival",
    type: "community",
    date: "2026-11-08",
    location: "Oakridge Town Square & Park",
    guestCount: 650,
    budgetTotal: 18000,
    budgetSpent: 11400,
    theme: "Autumn Glow, Folk Music & Artisanal Market",
    status: "confirmed",
    tasks: [],
    timeline: [],
    vendors: [],
    aiIdeas: [],
    createdAt: "2026-10-22T11:45:00.000Z",
    updatedAt: "2026-10-22T11:45:00.000Z",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
      <AppHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <DashboardClient initialEvents={initialEvents} />
        </main>
      </div>
    </div>
  );
}
