"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function EventOverviewPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  // Mock workspace data for Aarav & Meera Wedding Celebration
  const eventData = {
    id: eventId,
    title: "Aarav & Meera Wedding Celebration",
    type: "wedding" as const,
    status: "confirmed" as const,
    date: "Dec 14, 2026",
    daysRemaining: 142,
    location: "Jaipur Royal Palace & Grounds, Rajasthan",
    guestCount: 350,
    budgetTotal: 3850000,
    budgetSpent: 2480000,
    theme: "Royal Palace Heritage & Candlelit Amber",
  };

  const dayOfTimeline = [
    { time: "16:00", title: "Royal Welcome & Rosewater Spritz", location: "Courtyard of Courtesies", status: "Ready" },
    { time: "17:30", title: "Sunset Sangeet Procession & Dhol Entry", location: "Grand Pavilion", status: "Awaiting Sound Check" },
    { time: "19:30", title: "Heritage Banquet & Culinary Showcase", location: "Marigold Ballroom", status: "Menu Locked" },
    { time: "22:00", title: "Acoustic After-Hours & Lantern Send-Off", location: "Palace Lakefront", status: "Permit Confirmed" },
  ];

  const vendorStatusList = [
    { name: "Wildflower Botanical Studio", cat: "Florals", budget: "₹4,20,000", status: "Booked", progress: "Advance Paid" },
    { name: "Royal Saffron Catering", cat: "Catering", budget: "₹11,50,000", status: "Booked", progress: "Tasting Done" },
    { name: "Stories by Joseph Radhik", cat: "Cinematography", budget: "₹4,80,000", status: "Booked", progress: "Brief Signed" },
    { name: "Jaipur Sound & Laser Collective", cat: "Sound & Stage", budget: "₹2,40,000", status: "Negotiating", progress: "RFP Pending" },
  ];

  return (
    <AppShell
      activeEventTitle={eventData.title}
      activeEventLocation="Jaipur, Dec 2026"
      eventId={eventId}
    >
      <div className="space-y-6">
        <EventWorkspaceHeader
          id={eventData.id}
          title={eventData.title}
          type={eventData.type}
          status={eventData.status}
          date={eventData.date}
          daysRemaining={eventData.daysRemaining}
          location={eventData.location}
          guestCount={eventData.guestCount}
          budgetTotal={eventData.budgetTotal}
        />

        {/* AI Insight Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#ede9fe] border border-[#dcd6cc] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5a4bac] flex items-center justify-center text-white shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-heading font-bold text-[#5a4bac] uppercase tracking-wider">
                Copilot Stage Brief
              </span>
              <p className="text-xs sm:text-sm text-[#181c23] mt-0.5">
                Sound setup for Sangeet is pending clearance for decibel limits after 10:00 PM. We recommend shifting live brass performances before the 9:30 PM banquet.
              </p>
            </div>
          </div>
          <Link href={`/events/${eventId}/assistant`} className="shrink-0">
            <Button size="sm" variant="primary">
              Review with Assistant
            </Button>
          </Link>
        </div>

        {/* 3 Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Budget Breakdown & Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Health Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Financial Health & Disbursement Allocation</CardTitle>
                  <CardDescription>Track committed advances versus total planned capital</CardDescription>
                </div>
                <Link href={`/events/${eventId}/budget`}>
                  <Button size="sm" variant="outline">
                    Open Ledger
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-[#faf9f6] border border-[#eae6df] text-center">
                  <div>
                    <span className="text-[11px] text-[#797583]">Total Budget</span>
                    <p className="text-lg font-heading font-extrabold text-[#181c23]">
                      ₹{eventData.budgetTotal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#797583]">Committed Advances</span>
                    <p className="text-lg font-heading font-extrabold text-[#5a4bac]">
                      ₹{eventData.budgetSpent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#797583]">Reserve Balance</span>
                    <p className="text-lg font-heading font-extrabold text-[#466557]">
                      ₹{(eventData.budgetTotal - eventData.budgetSpent).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-heading font-semibold text-[#181c23]">
                    <span>Expenditure Progress</span>
                    <span>64% of Allocated Fund</span>
                  </div>
                  <div className="w-full bg-[#f5f4f0] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#466557] h-full rounded-full" style={{ width: "64%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Day-of Itinerary Anchor */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Day-Of Celebration Schedule</CardTitle>
                  <CardDescription>Target coordination rundown for coordinators & vendors</CardDescription>
                </div>
                <Link href={`/events/${eventId}/tasks`}>
                  <Button size="sm" variant="outline">
                    View Checklist
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayOfTimeline.map((item, idx) => (
                    <div
                      key={item.time}
                      className="p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eae6df] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full bg-white border border-[#eae6df] font-heading font-bold text-[#5a4bac]">
                          {item.time}
                        </span>
                        <div>
                          <p className="font-heading font-bold text-[#181c23]">{item.title}</p>
                          <span className="text-[11px] text-[#797583]">{item.location}</span>
                        </div>
                      </div>
                      <Badge variant={idx === 1 ? "warning" : "sage"} size="sm">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Col 3: Vendor Directory Snapshot & Quick Links */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Vendor Engagement</CardTitle>
                <Link href={`/events/${eventId}/vendors`} className="text-xs text-[#5a4bac] font-heading font-semibold hover:underline">
                  All (12) →
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendorStatusList.map((v) => (
                  <div
                    key={v.name}
                    className="p-3 rounded-2xl border border-[#eae6df] bg-white flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-[#181c23]">{v.name}</span>
                      <Badge variant={v.status === "Booked" ? "sage" : "peach"} size="sm">
                        {v.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#797583]">
                      <span>{v.cat} • {v.progress}</span>
                      <span className="font-semibold text-[#181c23]">{v.budget}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#ede9fe]/50 to-white border-[#dcd6cc]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#5a4bac]">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Ideas Studio</span>
                </div>
                <CardTitle className="text-sm">Custom Palace Inspiration</CardTitle>
                <CardDescription>Aesthetic concepts generated for this event.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-xl bg-white border border-[#eae6df] text-xs">
                  <span className="font-heading font-bold text-[#181c23]">
                    Marigold Floating Candle Pavilions
                  </span>
                  <p className="text-[11px] text-[#686e77] mt-1">
                    Brass urns placed along the palace reflecting pool illuminated at dusk.
                  </p>
                </div>
                <Link href={`/events/${eventId}/ideas`}>
                  <Button size="sm" variant="soft" className="w-full justify-center">
                    Browse All 14 AI Ideas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
