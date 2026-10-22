"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Wallet,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Utensils,
  Music,
  Armchair,
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
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { EventTypeBadge, EventStatusBadge } from "@/components/ui/Badge";
import type { EventType } from "@/lib/types";

export default function DashboardPage() {
  const [filterType, setFilterType] = React.useState<string>("all");
  const [copilotApplied, setCopilotApplied] = React.useState<boolean>(false);

  // Sample portfolio of events
  const [events] = React.useState([
    {
      id: "evt-aarav-meera",
      title: "Aarav & Meera Wedding Celebration",
      type: "wedding" as EventType,
      date: "Dec 14, 2026",
      daysLeft: 142,
      location: "Jaipur Royal Palace, Rajasthan",
      guestCount: 350,
      budgetTotal: 3850000,
      budgetSpent: 2480000,
      theme: "Royal Palace Heritage & Candlelit Amber",
      tasksDone: 28,
      tasksTotal: 42,
      vendorsBooked: 9,
      vendorsTotal: 12,
      status: "confirmed" as const,
    },
    {
      id: "evt-silver-jubilee",
      title: "25th Silver Jubilee Rooftop Soirée",
      type: "anniversary" as EventType,
      date: "Nov 28, 2026",
      daysLeft: 36,
      location: "The High Line Conservatory, New York",
      guestCount: 85,
      budgetTotal: 1800000,
      budgetSpent: 1250000,
      theme: "Mid-Century Starlit Silver",
      tasksDone: 19,
      tasksTotal: 24,
      vendorsBooked: 5,
      vendorsTotal: 6,
      status: "confirmed" as const,
    },
    {
      id: "evt-solstice-birthday",
      title: "Harper's Enchanted 30th Forest Celebration",
      type: "birthday" as EventType,
      date: "Jan 18, 2027",
      daysLeft: 177,
      location: "Redwood Meadow Sanctuary, Big Sur",
      guestCount: 60,
      budgetTotal: 950000,
      budgetSpent: 380000,
      theme: "Woodland Banquet & Acoustic Strings",
      tasksDone: 8,
      tasksTotal: 22,
      vendorsBooked: 3,
      vendorsTotal: 8,
      status: "planning" as const,
    },
    {
      id: "evt-harvest-gala",
      title: "Oakridge Harvest & Lantern Charity Gala",
      type: "community" as EventType,
      date: "Nov 08, 2026",
      daysLeft: 16,
      location: "Oakridge Civic Pavilion",
      guestCount: 500,
      budgetTotal: 1500000,
      budgetSpent: 1320000,
      theme: "Autumn Glow & Folk Ensemble",
      tasksDone: 34,
      tasksTotal: 36,
      vendorsBooked: 11,
      vendorsTotal: 11,
      status: "in_progress" as const,
    },
  ]);

  const filteredEvents =
    filterType === "all" ? events : events.filter((e) => e.type === filterType);

  const budgetChartData = [
    { category: "Venue & Palace", allocated: 1200000, spent: 1000000 },
    { category: "Catering & Banquet", allocated: 1100000, spent: 750000 },
    { category: "Florals & Decor", allocated: 650000, spent: 380000 },
    { category: "Photo & Film", allocated: 500000, spent: 250000 },
    { category: "Music & Artists", allocated: 400000, spent: 100000 },
  ];

  const categoryDistribution = [
    { name: "Venue", value: 32, color: "#5a4bac" },
    { name: "Catering", value: 28, color: "#466557" },
    { name: "Florals", value: 18, color: "#884a0f" },
    { name: "Cinematography", value: 12, color: "#7364c7" },
    { name: "Entertainment", value: 10, color: "#a66227" },
  ];

  return (
    <AppShell
      activeEventTitle="Aarav & Meera Wedding Celebration"
      activeEventLocation="Jaipur, Dec 2026"
      eventId="evt-aarav-meera"
    >
      <div className="space-y-8">
        {/* Hero Greeting & Event Status Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#5a4bac] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#466557]" />
              <span>Jaipur Royal Palace Showcase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#181c23] tracking-tight">
              Good morning, Priya! 🌸{" "}
              <span className="font-normal text-[#686e77] text-lg sm:text-2xl block sm:inline">
                Aarav & Meera’s wedding is in 142 days.
              </span>
            </h1>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/events/evt-aarav-meera/assistant">
              <button className="px-3.5 py-1.5 rounded-full bg-white border border-[#eae6df] hover:bg-[#faf9f6] text-xs font-heading font-semibold text-[#181c23] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer">
                <Armchair className="w-3.5 h-3.5 text-[#5a4bac]" />
                <span>Generate Seating Arrangement</span>
              </button>
            </Link>
            <Link href="/events/evt-aarav-meera/vendors">
              <button className="px-3.5 py-1.5 rounded-full bg-white border border-[#eae6df] hover:bg-[#faf9f6] text-xs font-heading font-semibold text-[#181c23] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer">
                <Utensils className="w-3.5 h-3.5 text-[#884a0f]" />
                <span>Review Catering RFP</span>
              </button>
            </Link>
            <Link href="/events/evt-aarav-meera/ideas">
              <button className="px-3.5 py-1.5 rounded-full bg-white border border-[#eae6df] hover:bg-[#faf9f6] text-xs font-heading font-semibold text-[#181c23] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer">
                <Music className="w-3.5 h-3.5 text-[#466557]" />
                <span>Check Sangeet Playlist Ideas</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Planora AI Copilot Live Recommendation Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#ede9fe] border border-[#dcd6cc] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-[#5a4bac] flex items-center justify-center text-white shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-heading font-bold text-[#5a4bac] uppercase tracking-wider">
                  Planora AI Copilot Recommendation
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#5a4bac] text-[10px] font-semibold">
                  Live Budget Intelligence
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#181c23] mt-1 leading-relaxed">
                <span className="font-bold">AI Market Insight:</span> Floral vendor estimates are 14% below market average in Jaipur.
                Would you like me to reallocate <strong className="text-[#5a4bac] font-bold">₹45,000</strong> to the Photography & Cinematography package?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {copilotApplied ? (
              <span className="px-3.5 py-1.5 rounded-full bg-[#c5e7d6] text-[#466557] font-heading text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reallocated ₹45,000 to Photo</span>
              </span>
            ) : (
              <>
                <button
                  onClick={() => setCopilotApplied(true)}
                  className="px-4 py-2 rounded-full bg-[#5a4bac] text-white hover:bg-[#7364c7] font-heading font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Apply Suggestion
                </button>
                <Link href="/events/evt-aarav-meera/assistant">
                  <button className="px-3.5 py-2 rounded-full bg-white text-[#484552] hover:bg-[#faf9f6] border border-[#eae6df] font-heading font-semibold text-xs transition-colors cursor-pointer">
                    Customize in Chat
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 4 Refined KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Budget */}
          <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs hover:border-[#c9c4d4] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-semibold text-[#797583]">Total Budget</span>
              <div className="w-7 h-7 rounded-lg bg-[#e8f0ec] text-[#466557] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mb-1">
              ₹38,50,000
            </div>
            <p className="text-[11px] text-[#686e77] mb-3">
              ₹24,80,000 allocated • ₹13,70,000 remaining
            </p>
            <div className="w-full bg-[#f5f4f0] h-1.5 rounded-full overflow-hidden mb-2">
              <div className="bg-[#466557] h-full rounded-full" style={{ width: "64%" }} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-heading">
              <span className="text-[#797583]">64% committed</span>
              <span className="text-[#466557] font-bold bg-[#e8f0ec] px-2 py-0.5 rounded-full">
                +4.2% under forecast
              </span>
            </div>
          </div>

          {/* Card 2: RSVPs */}
          <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs hover:border-[#c9c4d4] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-semibold text-[#797583]">Confirmed RSVPs</span>
              <div className="w-7 h-7 rounded-lg bg-[#ede9fe] text-[#5a4bac] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mb-1">
              284 <span className="text-sm font-normal text-[#797583]">/ 350</span>
            </div>
            <p className="text-[11px] text-[#686e77] mb-3">
              48 pending responses • 18 declined
            </p>
            <div className="w-full bg-[#f5f4f0] h-1.5 rounded-full overflow-hidden mb-2">
              <div className="bg-[#5a4bac] h-full rounded-full" style={{ width: "81%" }} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-heading">
              <span className="text-[#797583]">Attendance Rate</span>
              <span className="text-[#5a4bac] font-bold">81% Confirmed</span>
            </div>
          </div>

          {/* Card 3: Tasks Milestones */}
          <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs hover:border-[#c9c4d4] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-semibold text-[#797583]">Milestones Completed</span>
              <div className="w-7 h-7 rounded-lg bg-[#c5e7d6] text-[#466557] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mb-1">
              28 <span className="text-sm font-normal text-[#797583]">/ 42</span>
            </div>
            <p className="text-[11px] text-[#686e77] mb-3">
              14 milestones remaining before Sangeet
            </p>
            <div className="w-full bg-[#f5f4f0] h-1.5 rounded-full overflow-hidden mb-2">
              <div className="bg-[#466557] h-full rounded-full" style={{ width: "67%" }} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-heading">
              <span className="text-[#797583]">Timeline Pace</span>
              <span className="text-[#466557] font-bold">On Schedule</span>
            </div>
          </div>

          {/* Card 4: Vendors Booked */}
          <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs hover:border-[#c9c4d4] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-semibold text-[#797583]">Vendors Secured</span>
              <div className="w-7 h-7 rounded-lg bg-[#fde8d7] text-[#884a0f] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mb-1">
              9 <span className="text-sm font-normal text-[#797583]">/ 12</span>
            </div>
            <p className="text-[11px] text-[#686e77] mb-3">
              3 proposals in review (Sound & Pyrotechnics)
            </p>
            <div className="w-full bg-[#f5f4f0] h-1.5 rounded-full overflow-hidden mb-2">
              <div className="bg-[#884a0f] h-full rounded-full" style={{ width: "75%" }} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-heading">
              <span className="text-[#797583]">Contract Health</span>
              <span className="text-[#884a0f] font-bold">3 Action Required</span>
            </div>
          </div>
        </div>

        {/* Visual Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm">Disbursement Budget Envelope</CardTitle>
                <CardDescription>Allocated capital vs committed vendor advances</CardDescription>
              </div>
              <Link href="/events/evt-aarav-meera/budget" className="text-xs font-heading font-semibold text-[#5a4bac] hover:underline">
                View Full Ledger →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="category" fontSize={11} stroke="#797583" />
                    <YAxis fontSize={11} stroke="#797583" tickFormatter={(v) => `₹${v / 100000}L`} />
                    <Tooltip
                      formatter={(val) => `₹${Number(val).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "#181c23",
                        color: "#fff",
                        borderRadius: "12px",
                        fontSize: "12px",
                        border: "none",
                      }}
                    />
                    <Bar dataKey="allocated" fill="#e5deff" name="Allocated Target" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="spent" fill="#5a4bac" name="Committed Spend" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Category Expenditure Share</CardTitle>
              <CardDescription>Target distribution weighting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-[#484552]">
                {categoryDistribution.map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="truncate">{c.name}: {c.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Events Portfolio Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-heading font-extrabold text-[#181c23]">
                Managed Celebrations Portfolio
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f1f3fe] text-[#5a4bac] font-heading font-bold">
                {filteredEvents.length} Active
              </span>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-white border border-[#eae6df] p-1 rounded-full shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-[#797583] ml-2" />
              {["all", "wedding", "anniversary", "birthday", "community"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs rounded-full font-heading font-semibold capitalize transition-all cursor-pointer ${
                    filterType === type
                      ? "bg-[#5a4bac] text-white shadow-xs"
                      : "text-[#686e77] hover:text-[#181c23]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.map((evt) => {
              const percent = Math.round((evt.budgetSpent / evt.budgetTotal) * 100);

              return (
                <Link key={evt.id} href={`/events/${evt.id}`}>
                  <div className="p-6 rounded-3xl border border-[#eae6df] bg-white hover:border-[#5a4bac] hover:shadow-[0px_8px_30px_-4px_rgba(90,75,172,0.1)] transition-all cursor-pointer space-y-4 group">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <EventTypeBadge type={evt.type} />
                          <EventStatusBadge status={evt.status} />
                          <span className="text-[11px] font-heading font-bold px-2 py-0.5 rounded-full bg-[#faf9f6] text-[#466557] border border-[#eae6df]">
                            {evt.daysLeft} days away
                          </span>
                        </div>
                        <h3 className="font-heading font-extrabold text-base text-[#181c23] group-hover:text-[#5a4bac] transition-colors">
                          {evt.title}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-[#797583] block">Budget</span>
                        <span className="text-sm font-heading font-extrabold text-[#181c23]">
                          ₹{(evt.budgetTotal / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#686e77] flex flex-wrap items-center gap-4">
                      <span>📍 {evt.location}</span>
                      <span>👥 {evt.guestCount} Guests</span>
                      <span>✨ {evt.theme}</span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-[#797583]">
                        <span>Committed: ₹{evt.budgetSpent.toLocaleString()} ({percent}%)</span>
                        <span>Tasks: {evt.tasksDone}/{evt.tasksTotal}</span>
                      </div>
                      <div className="w-full bg-[#f5f4f0] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#5a4bac] h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#f5f4f0] text-xs font-heading font-semibold text-[#5a4bac]">
                      <span>{evt.vendorsBooked}/{evt.vendorsTotal} Vendors Secured</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
