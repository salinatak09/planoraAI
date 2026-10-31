"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Wallet,
  CheckSquare,
  Store,
  Lightbulb,
  Bot,
  LayoutDashboard,
  Share2,
  FileDown,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EventTypeBadge, EventStatusBadge } from "@/components/ui/Badge";
import type { EventType, EventStatus } from "@/lib/types";

interface EventWorkspaceHeaderProps {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  date: string;
  daysRemaining: number;
  location: string;
  guestCount: number;
  budgetTotal: number;
  currency?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReplanning?: () => void;
}

export function EventWorkspaceHeader({
  id,
  title,
  type,
  status,
  date,
  daysRemaining,
  location,
  guestCount,
  budgetTotal,
  currency = "₹",
  onEdit,
  onDelete,
  onReplanning,
}: EventWorkspaceHeaderProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: `/events/${id}`, icon: LayoutDashboard, exact: true },
    { label: "Budget Ledger", href: `/events/${id}/budget`, icon: Wallet },
    { label: "Timeline & Tasks", href: `/events/${id}/tasks`, icon: CheckSquare },
    { label: "Vendor Directory", href: `/events/${id}/vendors`, icon: Store },
    { label: "AI Ideas Studio", href: `/events/${id}/ideas`, icon: Lightbulb, badge: "PRO" },
    { label: "Assistant Chat", href: `/events/${id}/assistant`, icon: Bot },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Top Details & Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#eae6df]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <EventTypeBadge type={type} />
            <EventStatusBadge status={status} />
            <span className="text-[11px] font-heading font-bold px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#5a4bac] border border-[#dcd6cc]">
              {daysRemaining} Days Until Event
            </span>
            <span className="text-xs text-[#797583] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {date}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#181c23] tracking-tight">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#686e77] mt-1.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#797583]" />
              {location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#797583]" />
              {guestCount} RSVP Target
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-[#466557]" />
              {currency}{budgetTotal.toLocaleString()} Allocated Budget
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onReplanning && (
            <button
              onClick={onReplanning}
              className="px-3.5 py-2 rounded-full border border-[#dcd6cc] bg-gradient-to-r from-[#ede9fe] to-white text-xs font-heading font-semibold text-[#5a4bac] hover:bg-[#ede9fe] transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="AI Change Impact & Replanning"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5a4bac]" />
              <span>Plan Changes</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-2 rounded-full border border-[#eae6df] bg-white text-xs font-heading font-semibold text-[#181c23] hover:bg-[#faf9f6] transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Edit Event Details"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#5a4bac]" />
              <span className="hidden sm:inline">Edit Details</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2.5 rounded-full border border-[#ffdad6] bg-white text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors shadow-2xs cursor-pointer"
              title="Delete Celebration"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => alert("Event blueprint export prepared for client distribution (PDF).")}
            className="p-2.5 rounded-full border border-[#eae6df] bg-white text-[#484552] hover:bg-[#faf9f6] transition-colors shadow-2xs cursor-pointer"
            title="Export Blueprint"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert("Client collaboration link copied to clipboard.")}
            className="p-2.5 rounded-full border border-[#eae6df] bg-white text-[#484552] hover:bg-[#faf9f6] transition-colors shadow-2xs cursor-pointer"
            title="Share Access"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <Link href={`/events/${id}/assistant`}>
            <Button size="sm" variant="soft" leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#5a4bac]" />}>
              Ask AI Copilot
            </Button>
          </Link>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar border-b border-[#eae6df]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-heading font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-[#5a4bac] text-[#5a4bac] bg-white shadow-2xs"
                  : "border-transparent text-[#686e77] hover:text-[#181c23] hover:bg-white/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] bg-[#c8ead9] text-[#2f4d40] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
