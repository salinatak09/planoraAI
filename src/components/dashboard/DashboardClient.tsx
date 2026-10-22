"use client";

import * as React from "react";
import {
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  Plus,
  ArrowRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  PartyPopper,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge, EventTypeBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils/currency";
import { formatEventDate, getDaysRemaining } from "@/lib/utils/date";
import type { EventDocument, AIIdea, EventType } from "@/lib/types";

interface DashboardClientProps {
  initialEvents: EventDocument[];
}

export function DashboardClient({ initialEvents }: DashboardClientProps) {
  const [events, setEvents] = React.useState<EventDocument[]>(initialEvents);
  const [filterType, setFilterType] = React.useState<string>("all");
  const [selectedEvent, setSelectedEvent] = React.useState<EventDocument>(initialEvents[0] || null);

  // AI Idea Generation State
  const [aiFocusArea, setAiFocusArea] = React.useState<string>("all");
  const [aiCustomPrompt, setAiCustomPrompt] = React.useState<string>("");
  const [isGeneratingIdeas, setIsGeneratingIdeas] = React.useState<boolean>(false);
  const [generatedIdeas, setGeneratedIdeas] = React.useState<AIIdea[]>(
    initialEvents[0]?.aiIdeas || []
  );
  const [aiError, setAiError] = React.useState<string | null>(null);

  // New Event Modal State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [newEvent, setNewEvent] = React.useState({
    title: "",
    type: "wedding" as EventType,
    date: "2026-11-20",
    location: "",
    guestCount: 100,
    budgetTotal: 15000,
    theme: "",
    notes: "",
  });

  // Calculate aggregates
  const totalBudget = events.reduce((sum, e) => sum + e.budgetTotal, 0);
  const totalSpent = events.reduce((sum, e) => sum + e.budgetSpent, 0);
  const totalGuests = events.reduce((sum, e) => sum + e.guestCount, 0);

  const filteredEvents =
    filterType === "all" ? events : events.filter((e) => e.type === filterType);

  // Recharts data
  const budgetChartData = events.map((e) => ({
    name: e.title.length > 18 ? e.title.substring(0, 16) + "..." : e.title,
    Budget: e.budgetTotal,
    Spent: e.budgetSpent,
  }));

  const typeDistributionData = [
    { name: "Wedding", value: events.filter((e) => e.type === "wedding").length, color: "#8b5cf6" },
    { name: "Birthday", value: events.filter((e) => e.type === "birthday").length, color: "#f59e0b" },
    { name: "Anniversary", value: events.filter((e) => e.type === "anniversary").length, color: "#f43f5e" },
    { name: "Community", value: events.filter((e) => e.type === "community").length, color: "#10b981" },
  ].filter((item) => item.value > 0);

  // Handle AI Idea generation via server route
  async function handleGenerateIdeas() {
    if (!selectedEvent) return;
    setIsGeneratingIdeas(true);
    setAiError(null);

    try {
      const response = await fetch("/api/ai/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: selectedEvent.type,
          theme: selectedEvent.theme,
          guestCount: selectedEvent.guestCount,
          budget: selectedEvent.budgetTotal,
          focusArea: aiFocusArea,
          customPrompt: aiCustomPrompt || undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message || "Generation request failed");
      }

      setGeneratedIdeas(json.data.ideas);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate ideas";
      setAiError(msg);
    } finally {
      setIsGeneratingIdeas(false);
    }
  }

  // Handle Create Event
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Validation failed on creation");
      }

      setEvents((prev) => [json.data, ...prev]);
      setSelectedEvent(json.data);
      setShowCreateModal(false);
      setNewEvent({
        title: "",
        type: "wedding",
        date: "2026-11-20",
        location: "",
        guestCount: 100,
        budgetTotal: 15000,
        theme: "",
        notes: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create event";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Top Welcome & KPI row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Executive Event Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empower celebrations with AI-orchestrated budgets, timelines, and tailored concepts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Event
          </Button>
        </div>
      </div>

      {/* Metric KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Active Celebrations</CardDescription>
              <PartyPopper className="h-4 w-4 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{events.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Weddings, birthdays, & milestones
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Budget Managed</CardDescription>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{formatCurrency(totalBudget)}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-emerald-600 font-medium">
              {formatCurrency(totalSpent)} committed
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total RSVP Guests</CardDescription>
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{totalGuests.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">Across all organized venues</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>GenAI Engine Status</CardDescription>
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Gemini 2.5</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-indigo-600 font-medium">Official SDK Connected</span>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Budget Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Budget Allocation vs. Spend</CardTitle>
            <CardDescription>
              Real-time expenditure tracking powered by server-validated calculations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    formatter={(val) => (typeof val === "number" ? formatCurrency(val) : val)}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="Budget" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Portfolio Mix</CardTitle>
            <CardDescription>Distribution across celebrations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {typeDistributionData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}: {item.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Columns: Events Grid & AI Creative Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Events Hub */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Events</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredEvents.length}
              </span>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
              {["all", "wedding", "anniversary", "birthday", "community"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer capitalize ${
                    filterType === type
                      ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <EmptyState
              title="No events found"
              description="No celebrations match this filter. Create one to get started."
              actionLabel="Create Event"
              onAction={() => setShowCreateModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvents.map((evt) => {
                const isSelected = selectedEvent?.id === evt.id;
                const days = getDaysRemaining(evt.date);
                const percentBudget = Math.round((evt.budgetSpent / evt.budgetTotal) * 100);

                return (
                  <Card
                    key={evt.id}
                    onClick={() => {
                      setSelectedEvent(evt);
                      setGeneratedIdeas(evt.aiIdeas || []);
                    }}
                    className={`cursor-pointer transition-all hover:border-purple-300 dark:hover:border-purple-700 ${
                      isSelected ? "ring-2 ring-purple-500 border-purple-500 bg-purple-50/20" : ""
                    }`}
                  >
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <EventTypeBadge type={evt.type} />
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatEventDate(evt.date)}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {days > 0 ? `${days} days left` : "Today"}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {evt.title}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-slate-500">Budget</div>
                          <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
                            {formatCurrency(evt.budgetTotal)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{evt.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{evt.guestCount} guests</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span className="italic">&ldquo;{evt.theme}&rdquo;</span>
                        </div>
                      </div>

                      {/* Budget progress bar */}
                      <div className="mt-1">
                        <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-500">
                          <span>
                            Spent: {formatCurrency(evt.budgetSpent)} ({percentBudget}%)
                          </span>
                          <span>
                            Remaining: {formatCurrency(evt.budgetTotal - evt.budgetSpent)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, percentBudget)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center gap-3 text-slate-500">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {evt.tasks.filter((t) => t.status === "completed").length}/{evt.tasks.length} tasks
                          </span>
                          <span>•</span>
                          <span>{evt.vendors.length} vendors</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-600 font-semibold group">
                          <span>Select for AI Studio</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Creative Studio */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Creative Studio
            </h2>
            <Badge variant="wedding" size="sm">
              Gemini Powered
            </Badge>
          </div>

          <Card className="bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900 border-purple-200 dark:border-purple-900/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Target: {selectedEvent ? selectedEvent.title : "Select an event"}
              </CardTitle>
              <CardDescription>
                Harness Gemini to generate custom decor, activities, menu pairings, and logistics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Idea Focus Area
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {["all", "decor", "activity", "menu", "theme", "logistics"].map((area) => (
                    <button
                      key={area}
                      onClick={() => setAiFocusArea(area)}
                      className={`py-1.5 px-2 rounded-lg border text-center capitalize transition-colors cursor-pointer ${
                        aiFocusArea === area
                          ? "bg-purple-600 border-purple-600 text-white font-medium"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Custom Planner Instructions (Optional)
                </label>
                <textarea
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="e.g. Focus on eco-friendly decor, acoustic live music, or outdoor sunset lighting..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
                />
              </div>

              {aiError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <Button
                onClick={handleGenerateIdeas}
                isLoading={isGeneratingIdeas}
                className="w-full"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isGeneratingIdeas ? "Consulting Gemini..." : "Generate AI Concepts"}
              </Button>
            </CardContent>
          </Card>

          {/* Render Generated AI Ideas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Tailored Concepts ({generatedIdeas.length})</span>
              {generatedIdeas.length > 0 && <span className="text-purple-600">Active</span>}
            </div>

            {generatedIdeas.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                <Lightbulb className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                Click &quot;Generate AI Concepts&quot; to brainstorm ideas with Gemini.
              </div>
            ) : (
              generatedIdeas.map((idea) => (
                <Card key={idea.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {idea.title}
                      </h4>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
                        {idea.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {idea.description}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                      <span className="text-slate-500 font-medium">
                        Est: {idea.estimatedCostRange || "Flexible"}
                      </span>
                      <div className="flex gap-1">
                        {idea.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Celebration
                </h3>
                <p className="text-xs text-slate-500">
                  Configure high-level parameters validated through Zod runtime schemas.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <Input
                label="Event Title"
                placeholder="e.g. Liam & Chloe's Vineyard Nuptials"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Celebration Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, type: e.target.value as EventType })
                    }
                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="community">Community</option>
                  </select>
                </div>

                <Input
                  label="Date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Location / Venue"
                placeholder="e.g. Sonoma Valley Grounds, CA"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Guest Count"
                  type="number"
                  min="1"
                  value={newEvent.guestCount}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, guestCount: parseInt(e.target.value) || 0 })
                  }
                  required
                />
                <Input
                  label="Total Budget ($)"
                  type="number"
                  min="0"
                  value={newEvent.budgetTotal}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, budgetTotal: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <Input
                label="Aesthetic Theme"
                placeholder="e.g. Rustic Tuscan Wine Country Elegance"
                value={newEvent.theme}
                onChange={(e) => setNewEvent({ ...newEvent, theme: e.target.value })}
                required
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save & Launch Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
