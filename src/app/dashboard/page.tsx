"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {
  Sparkles,
  Wallet,
  Users,
  Clock,
  ArrowRight,
  Plus,
  Calendar,
  MapPin,
  AlertCircle,
  PartyPopper,
  CheckSquare,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EventTypeBadge, EventStatusBadge } from "@/components/ui/Badge";
import type { EventType, EventStatus } from "@/lib/types";

interface DashboardEvent {
  id: string;
  _id?: string;
  title: string;
  type: EventType;
  date: string;
  daysRemaining?: number;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency?: string;
  status: EventStatus;
  theme?: string;
}

interface DashboardTask {
  id: string;
  _id?: string;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  eventTitle?: string;
}

interface DashboardData {
  totalEvents: number;
  upcomingEvents: DashboardEvent[];
  recentEvents: DashboardEvent[];
  totalBudget: number;
  totalEstimatedAmount: number;
  totalActualSpent: number;
  totalGuests: number;
  tasksCompleted: number;
  tasksTotal: number;
  taskCompletionRate: number;
  upcomingDeadlines: DashboardTask[];
}

export default function DashboardPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();

      if (!res.ok) {
        setError(json?.error?.message || "Failed to load dashboard metrics");
        setIsLoading(false);
        return;
      }

      setData(json.data);
    } catch {
      setError("Network error while connecting to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (!isMounted) return;
        if (!res.ok) {
          setError(json?.error?.message || "Failed to load dashboard metrics");
        } else {
          setData(json.data);
        }
      } catch {
        if (isMounted) setError("Network error while connecting to server");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <AppShell activeEventTitle="Dashboard" activeEventLocation="Loading Real Data">
        <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
          <div className="h-24 bg-white rounded-3xl border border-[#eae6df] p-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-[#eae6df]" />
            ))}
          </div>
          <div className="h-96 bg-white rounded-3xl border border-[#eae6df]" />
        </div>
      </AppShell>
    );
  }

  // Error State with Retry
  if (error || !data) {
    return (
      <AppShell activeEventTitle="Dashboard" activeEventLocation="Sync Error">
        <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white border border-[#eae6df] text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[#181c23]">
            Unable to Load Persisted Dashboard Data
          </h2>
          <p className="text-xs text-[#686e77]">
            {error || "An error occurred while connecting to MongoDB Atlas."}
          </p>
          <Button onClick={fetchDashboard} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry Connection
          </Button>
        </div>
      </AppShell>
    );
  }

  const {
    totalEvents,
    upcomingEvents,
    totalBudget,
    totalActualSpent,
    totalGuests,
    tasksCompleted,
    tasksTotal,
    taskCompletionRate,
    upcomingDeadlines,
  } = data;

  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  // Filter events by archetype
  const filteredEvents =
    filterType === "all"
      ? upcomingEvents
      : upcomingEvents.filter((e) => e.type === filterType);

  // Dynamic budget distribution chart data based on real events
  const budgetChartData = upcomingEvents.slice(0, 5).map((e) => ({
    title: e.title.length > 18 ? e.title.slice(0, 18) + "..." : e.title,
    allocated: e.totalBudget,
    guests: e.guestCount,
  }));

  const chartColors = ["#5a4bac", "#466557", "#884a0f", "#7364c7", "#a66227"];

  return (
    <AppShell
      activeEventTitle={nextEvent ? nextEvent.title : "Planora Studio"}
      activeEventLocation={nextEvent ? nextEvent.location : "Active Portfolio"}
      eventId={nextEvent ? nextEvent.id || nextEvent._id : undefined}
    >
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Hero Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#5a4bac] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#466557] animate-pulse" />
              <span>Real-Time MongoDB Cloud Synchronized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#181c23] tracking-tight">
              Executive Event Dashboard{" "}
              {nextEvent ? (
                <span className="font-normal text-[#686e77] text-base sm:text-xl block sm:inline">
                  • Next celebration: &ldquo;{nextEvent.title}&rdquo; (
                  {nextEvent.daysRemaining === 0
                    ? "Today!"
                    : `in ${nextEvent.daysRemaining} days`}
                  )
                </span>
              ) : (
                <span className="font-normal text-[#686e77] text-base sm:text-xl block sm:inline">
                  • Ready to orchestrate milestones
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/events/new">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Create Event</Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="outline" leftIcon={<Sparkles className="w-4 h-4 text-[#5a4bac]" />}>
                AI Wizard
              </Button>
            </Link>
          </div>
        </div>

        {/* EMPTY STATE FOR NEW USERS */}
        {totalEvents === 0 ? (
          <div className="rounded-3xl border border-[#eae6df] bg-white p-8 sm:p-14 text-center space-y-6 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-[#ede9fe] text-[#5a4bac] flex items-center justify-center mx-auto shadow-xs">
              <PartyPopper className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight">
                No Celebrations Planned Yet
              </h2>
              <p className="text-xs sm:text-sm text-[#686e77] mt-2 leading-relaxed">
                Welcome to Planora AI Studio. Start by creating your first celebration or use our guided 5-step
                wizard to auto-generate timelines, vendor budgets, and decor concepts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/events/new" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto" leftIcon={<Plus className="w-4 h-4" />}>
                  Create Your First Event
                </Button>
              </Link>
              <Link href="/onboarding" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto" leftIcon={<Sparkles className="w-4 h-4 text-[#5a4bac]" />}>
                  Launch 5-Step AI Wizard
                </Button>
              </Link>
            </div>

            {/* Feature highlights for new planners */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-[#f5f4f0] text-left">
              <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#eae6df] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#e8f0ec] text-[#466557] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-[#181c23]">
                  Budget Ledgers & Envelopes
                </h4>
                <p className="text-[11px] text-[#797583]">
                  Set master caps in INR, USD, EUR, and track advances versus commitments in real time.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#eae6df] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#ede9fe] text-[#5a4bac] flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-[#181c23]">
                  Timeline Tasks & Curfew Checks
                </h4>
                <p className="text-[11px] text-[#797583]">
                  Interactive checklists with priority sorting, due dates, and stage coordinator assignments.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#eae6df] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#fde8d7] text-[#a66227] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-[#181c23]">
                  Gemini AI Ideas Studio
                </h4>
                <p className="text-[11px] text-[#797583]">
                  Custom theme suggestions, color harmony palettes, and culinary concepts tailored to your aesthetic.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* AI Intelligence Brief Pill */}
            {nextEvent && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#ede9fe] border border-[#dcd6cc] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#5a4bac] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-heading font-bold text-[#5a4bac] uppercase tracking-wider">
                        Planora AI Copilot Intelligence
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#5a4bac] text-[10px] font-semibold">
                        Portfolio Health Active
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#181c23] mt-1 leading-relaxed">
                      Tracking <strong>{totalEvents}</strong> live celebration{totalEvents > 1 ? "s" : ""} in
                      MongoDB with <strong className="text-[#5a4bac]">₹{totalBudget.toLocaleString()}</strong> in
                      planned master capital. Next countdown is{" "}
                      <strong>&ldquo;{nextEvent.title}&rdquo;</strong> in {nextEvent.location}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link href={`/events/${nextEvent.id || nextEvent._id}`}>
                    <Button size="sm">Open Next Workspace</Button>
                  </Link>
                </div>
              </div>
            )}

            {/* 4 REAL KPI STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Budget */}
              <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-heading font-semibold text-[#797583]">Master Budget Capital</span>
                  <div className="w-7 h-7 rounded-lg bg-[#e8f0ec] text-[#466557] flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mb-1">
                  ₹{totalBudget.toLocaleString()}
                </div>
                <p className="text-[11px] text-[#686e77] mb-3">
                  ₹{totalActualSpent.toLocaleString()} disbursed • ₹{(totalBudget - totalActualSpent).toLocaleString()} reserved
                </p>
                <div className="w-full bg-[#f5f4f0] h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-[#466557] h-full rounded-full transition-all"
                    style={{
                      width: totalBudget > 0 ? `${Math.min(100, Math.round((totalActualSpent / totalBudget) * 100))}%` : "0%",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-heading">
                  <span className="text-[#797583]">
                    {totalBudget > 0 ? `${Math.round((totalActualSpent / totalBudget) * 100)}% spent` : "0% spent"}
                  </span>
                  <span className="text-[#466557] font-bold bg-[#e8f0ec] px-2 py-0.5 rounded-full">
                    {totalEvents} Active Event{totalEvents > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Guests */}
              <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-heading font-semibold text-[#797583]">Total Expected Guests</span>
                  <div className="w-7 h-7 rounded-lg bg-[#ede9fe] text-[#5a4bac] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mb-1">
                  {totalGuests.toLocaleString()}
                </div>
                <p className="text-[11px] text-[#686e77] mb-3">
                  Aggregated across all registered celebrations
                </p>
                <div className="w-full bg-[#f5f4f0] h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-[#5a4bac] h-full rounded-full" style={{ width: "100%" }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-heading">
                  <span className="text-[#797583]">RSVP Target</span>
                  <span className="text-[#5a4bac] font-bold bg-[#ede9fe] px-2 py-0.5 rounded-full">
                    {upcomingEvents.length} Upcoming
                  </span>
                </div>
              </div>

              {/* Card 3: Task Checklist Progress */}
              <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-heading font-semibold text-[#797583]">Task Checklist Progress</span>
                  <div className="w-7 h-7 rounded-lg bg-[#fde8d7] text-[#a66227] flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mb-1">
                  {tasksCompleted} / {tasksTotal}
                </div>
                <p className="text-[11px] text-[#686e77] mb-3">
                  {taskCompletionRate}% of coordination tasks finished
                </p>
                <div className="w-full bg-[#f5f4f0] h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-[#a66227] h-full rounded-full transition-all"
                    style={{ width: `${taskCompletionRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-heading">
                  <span className="text-[#797583]">{tasksTotal - tasksCompleted} pending</span>
                  <span className="text-[#a66227] font-bold bg-[#fde8d7] px-2 py-0.5 rounded-full">
                    {taskCompletionRate}% Pace
                  </span>
                </div>
              </div>

              {/* Card 4: Next Target Celebration */}
              <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-heading font-semibold text-[#797583]">Nearest Celebration</span>
                  <div className="w-7 h-7 rounded-lg bg-[#ede9fe] text-[#5a4bac] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mb-1 truncate">
                  {nextEvent ? `${nextEvent.daysRemaining} Days` : "All Done"}
                </div>
                <p className="text-[11px] text-[#686e77] mb-3 truncate">
                  {nextEvent ? nextEvent.title : "No upcoming events"}
                </p>
                <div className="w-full bg-[#f5f4f0] h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-[#5a4bac] h-full rounded-full" style={{ width: "85%" }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-heading">
                  <span className="text-[#797583] truncate">{nextEvent ? nextEvent.date : "-"}</span>
                  {nextEvent && (
                    <Link
                      href={`/events/${nextEvent.id || nextEvent._id}`}
                      className="text-[#5a4bac] font-bold hover:underline"
                    >
                      Workspace →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* EVENT PORTFOLIO GRID & TABS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-[#181c23] tracking-tight">
                    Active Celebrations & Workspaces
                  </h3>
                  <p className="text-xs text-[#797583]">
                    Showing real persisted records saved in MongoDB
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "all", label: "All" },
                    { id: "wedding", label: "Weddings" },
                    { id: "anniversary", label: "Anniversaries" },
                    { id: "birthday", label: "Birthdays" },
                    { id: "community", label: "Community" },
                    { id: "other", label: "Special" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterType(f.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-all cursor-pointer ${
                        filterType === f.id
                          ? "bg-[#5a4bac] text-white shadow-2xs"
                          : "bg-white border border-[#eae6df] text-[#484552] hover:bg-[#faf9f6]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.map((evt) => (
                  <Link
                    key={evt.id || evt._id}
                    href={`/events/${evt.id || evt._id}`}
                    className="p-5 rounded-3xl bg-white border border-[#eae6df] hover:border-[#5a4bac] hover:shadow-md transition-all flex flex-col justify-between group block"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <EventTypeBadge type={evt.type} />
                        <EventStatusBadge status={evt.status} />
                      </div>

                      <div>
                        <h4 className="font-heading font-bold text-base text-[#181c23] group-hover:text-[#5a4bac] transition-colors line-clamp-1">
                          {evt.title}
                        </h4>
                        <p className="text-xs text-[#797583] mt-1 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{evt.location}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#faf9f6] text-xs">
                        <div>
                          <span className="text-[#797583] block text-[11px]">Event Date:</span>
                          <span className="font-heading font-semibold text-[#181c23]">{evt.date}</span>
                        </div>
                        <div>
                          <span className="text-[#797583] block text-[11px]">Guest Target:</span>
                          <span className="font-heading font-semibold text-[#181c23]">{evt.guestCount} Guests</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#f5f4f0] mt-4 flex items-center justify-between text-xs">
                      <span className="font-heading font-bold text-[#466557]">
                        {evt.currency || "₹"}{evt.totalBudget.toLocaleString()} Planned
                      </span>
                      <span className="text-[#5a4bac] font-heading font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}

                {/* Create New Event Card Slot */}
                <Link
                  href="/events/new"
                  className="p-6 rounded-3xl border-2 border-dashed border-[#eae6df] hover:border-[#5a4bac] hover:bg-[#faf9f6] transition-all flex flex-col items-center justify-center text-center gap-3 min-h-[220px] group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ede9fe] text-[#5a4bac] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#181c23] group-hover:text-[#5a4bac] transition-colors">
                      Create New Celebration
                    </h4>
                    <p className="text-xs text-[#797583] mt-0.5 max-w-[200px]">
                      Launch our multi-step creation wizard with full budget & venue parameters.
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* UPCOMING DEADLINES & BUDGET VISUALIZATION GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Deadlines (Col 1 & 2) */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm">Upcoming Task Deadlines</CardTitle>
                    <CardDescription>Chronological action items across your celebrations</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingDeadlines.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#797583]">
                      No urgent deadlines found. All planned checklists are up to date!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDeadlines.map((task) => (
                        <div
                          key={task.id || task._id}
                          className="p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eae6df] flex items-center justify-between text-xs hover:border-[#c9c4d4] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-white border border-[#eae6df] flex items-center justify-center font-heading font-bold text-[#5a4bac]">
                              <Clock className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="font-heading font-bold text-[#181c23]">{task.title}</p>
                              <span className="text-[11px] text-[#797583]">
                                {task.eventTitle} • Due {task.dueDate}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-heading text-[11px] font-semibold capitalize ${
                              task.priority === "urgent"
                                ? "bg-[#ffdad6] text-[#ba1a1a]"
                                : task.priority === "high"
                                ? "bg-[#fde8d7] text-[#884a0f]"
                                : "bg-[#f1f3fe] text-[#484552]"
                            }`}
                          >
                            {task.priority} Priority
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real Event Capital Distribution Chart (Col 3) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Planned Capital by Event</CardTitle>
                  <CardDescription>Top active commitments</CardDescription>
                </CardHeader>
                <CardContent>
                  {budgetChartData.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#797583]">
                      No event budgets to chart.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={budgetChartData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="title" type="category" width={90} tick={{ fontSize: 10 }} />
                            <Tooltip
                              formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Budget"]}
                            />
                            <Bar dataKey="allocated" radius={[0, 8, 8, 0]}>
                              {budgetChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="pt-2 text-xs text-[#797583] text-center border-t border-[#f5f4f0]">
                        Total Portfolio Capital: <strong className="text-[#181c23]">₹{totalBudget.toLocaleString()}</strong>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
