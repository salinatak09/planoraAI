"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  Bell,
  CreditCard,
  Plus,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TopNavBarProps {
  activeEventTitle?: string;
  activeEventLocation?: string;
  onOpenMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function TopNavBar({
  activeEventTitle = "Aarav & Meera Wedding Celebration",
  activeEventLocation = "Jaipur, Dec 2026",
  onOpenMobileMenu,
  isMobileMenuOpen = false,
}: TopNavBarProps) {
  const router = useRouter();
  const [showEventDropdown, setShowEventDropdown] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const sampleEvents = [
    { id: "evt-aarav-meera", title: "Aarav & Meera Wedding Celebration", tag: "Jaipur, Dec 2026" },
    { id: "evt-silver-jubilee", title: "25th Silver Jubilee Rooftop Soirée", tag: "New York, Nov 2026" },
    { id: "evt-harvest-gala", title: "Oakridge Harvest & Lantern Festival", tag: "Oakridge, Nov 2026" },
  ];

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue with redirect regardless
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#eae6df] bg-white px-4 md:px-6 shadow-xs">
      {/* Left: Mobile Toggle & Brand & Event Switcher */}
      <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#484552] hover:bg-[#f5f4f0]"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-[#5a4bac] flex items-center justify-center text-white shadow-xs group-hover:bg-[#7364c7] transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-heading font-extrabold text-base md:text-lg text-[#5a4bac] tracking-tight">
            Planora AI
          </span>
        </Link>

        {/* Desktop Event Switcher */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowEventDropdown(!showEventDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#eae6df] bg-[#faf9f6] hover:bg-[#f1f3fe] text-xs font-heading font-semibold text-[#5a4bac] transition-colors max-w-xs truncate cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#466557] shrink-0" />
            <span className="truncate">{activeEventTitle}</span>
            <span className="text-[10px] text-[#797583] bg-white px-1.5 py-0.5 rounded-full border border-[#eae6df]">
              {activeEventLocation}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#797583] shrink-0" />
          </button>

          {showEventDropdown && (
            <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-[#eae6df] bg-white p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-heading font-semibold text-[#797583] uppercase tracking-wider">
                Switch Celebration
              </div>
              {sampleEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  onClick={() => setShowEventDropdown(false)}
                  className="flex flex-col gap-0.5 px-3 py-2 rounded-xl text-xs hover:bg-[#f5f4f0] transition-colors text-left"
                >
                  <span className="font-semibold text-[#181c23]">{ev.title}</span>
                  <span className="text-[11px] text-[#797583]">{ev.tag}</span>
                </Link>
              ))}
              <div className="pt-1.5 border-t border-[#f5f4f0] mt-1">
                <Link
                  href="/events/new"
                  onClick={() => setShowEventDropdown(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#5a4bac] hover:bg-[#ede9fe] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Celebration</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Input */}
        <div className="hidden xl:flex items-center relative max-w-sm w-full">
          <Search className="w-4 h-4 text-[#797583] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search milestones, vendors, budget..."
            className="w-full h-9 pl-9 pr-4 text-xs rounded-full border border-[#eae6df] bg-[#faf9f6] text-[#181c23] placeholder:text-[#797583] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac] transition-all"
          />
        </div>
      </div>

      {/* Right: Actions Cluster */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <Link href="/events/evt-aarav-meera/assistant">
          <button className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e5deff] hover:bg-[#c9bfff] text-[#473698] text-xs font-heading font-semibold transition-colors shadow-xs active:scale-95">
            <Sparkles className="w-3.5 h-3.5 text-[#5a4bac]" />
            <span>Ask Planora AI</span>
          </button>
        </Link>

        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#484552] hover:bg-[#f5f4f0] hover:text-[#181c23] transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white" />
        </button>

        <Link
          href="/events/evt-aarav-meera/budget"
          className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-[#484552] hover:bg-[#f5f4f0] hover:text-[#181c23] transition-colors"
          title="Billing & Ledger"
        >
          <CreditCard className="w-4 h-4" />
        </Link>

        <Link href="/events/new">
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Event
          </Button>
        </Link>

        <div className="h-5 w-px bg-[#eae6df] hidden sm:block mx-1" />

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 pl-1 group cursor-pointer focus:outline-none"
            aria-label="User profile and options"
          >
            <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#5a4bac] font-heading font-bold text-xs flex items-center justify-center border border-[#c9c4d4] group-hover:ring-2 group-hover:ring-[#5a4bac]/20 transition-all">
              PS
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-heading font-semibold text-[#181c23] leading-none">
                Priya Sharma
              </div>
              <div className="text-[10px] text-[#797583] leading-none mt-1">Lead Planner</div>
            </div>
            <ChevronDown className="w-3 h-3 text-[#797583] hidden sm:block" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#eae6df] bg-white p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-[#f5f4f0] mb-1">
                <p className="text-xs font-heading font-bold text-[#181c23]">Priya Sharma</p>
                <p className="text-[11px] text-[#797583]">priya@planora.ai</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#484552] hover:bg-[#f5f4f0] hover:text-[#181c23] transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#797583]" />
                <span>Studio Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors text-left cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? "Signing out..." : "Log Out"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
