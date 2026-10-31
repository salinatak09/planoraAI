"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  Wallet,
  CheckSquare,
  Store,
  Lightbulb,
  Bot,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { getCurrLoggedInUser } from "@/lib/utils/user";

interface AppSidebarProps {
  eventId?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AppSidebar({
  eventId,
  isMobileOpen = false,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [agency, setAgency] = useState("Luxe Heritage Celebrations");
  const [error, setError] = useState("");

  async function fetchCurrUser(){
    const user = await getCurrLoggedInUser();
    if(user.error){
      setError(user.error);
    }
    setName(user.name);
    setRole(user.role);
    setAgency(user.agency);
  }

  useEffect(() => {
    fetchCurrUser();
  }, []);

  const mainLinks = eventId ? [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Events Overview",
      href: `/events/${eventId}`,
      icon: Calendar,
      isActive: pathname === `/events/${eventId}`,
    },
    {
      label: "Budget Planner",
      href: `/events/${eventId}/budget`,
      icon: Wallet,
      isActive: pathname.includes("/budget"),
    },
    {
      label: "Timeline & Checklist",
      href: `/events/${eventId}/tasks`,
      icon: CheckSquare,
      isActive: pathname.includes("/tasks"),
    },
    {
      label: "Vendor Hub",
      href: `/events/${eventId}/vendors`,
      icon: Store,
      isActive: pathname.includes("/vendors"),
    },
    {
      label: "AI Ideas Studio",
      href: `/events/${eventId}/ideas`,
      icon: Lightbulb,
      isActive: pathname.includes("/ideas"),
      badge: "PRO",
    },
  ]: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    }
  ];

  const secondaryLinks = [
    {
      label: "AI Assistant Chat",
      href: `/events/${eventId}/assistant`,
      icon: Bot,
      isActive: pathname.includes("/assistant"),
    },
    {
      label: "Settings & Team",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-5 bg-[#ffffff] border-r border-[#eae6df]">
      <div className="space-y-5">
        {/* Workspace Brand Block */}
        <div className="flex lg:hidden items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-xl bg-[#5a4bac] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm text-[#5a4bac] leading-none">
              Planora Studio
            </h2>
            <p className="text-[11px] text-[#797583] mt-1 font-medium">Enterprise Planner</p>
          </div>
        </div>

        {/* Quick CTA */}
        <Link href="/events/new" onClick={onCloseMobile} className="block">
          <Button
            size="md"
            className="w-full justify-center shadow-xs"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Event
          </Button>
        </Link>

        {/* Navigation Group */}
        <nav className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-heading font-semibold uppercase tracking-wider text-[#797583]">
            Planning Hub
          </div>
          {mainLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-heading font-medium transition-all duration-150 ${
                  item.isActive
                    ? "bg-[#e5deff] text-[#473698] font-semibold shadow-2xs"
                    : "text-[#484552] hover:bg-[#f1f3fe] hover:text-[#181c23]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    item.isActive ? "text-[#5a4bac]" : "text-[#797583]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {/* {item.badge && (
                  <span className="ml-auto text-[10px] bg-[#c8ead9] text-[#2f4d40] px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )} */}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation & Micro Profile */}
      <div className="pt-4 border-t border-[#eae6df] space-y-3">
        <div className="space-y-1">
          {secondaryLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-heading font-medium transition-colors ${
                  item.isActive
                    ? "bg-[#e5deff] text-[#473698] font-semibold"
                    : "text-[#484552] hover:bg-[#f1f3fe] hover:text-[#181c23]"
                }`}
              >
                <Icon className="w-4 h-4 text-[#797583] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Micro Profile Card */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className="flex-1 p-2.5 rounded-2xl bg-[#faf9f6] border border-[#eae6df] flex items-center gap-3 hover:bg-[#f1f3fe] transition-colors group min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#5a4bac] font-heading font-bold text-xs flex items-center justify-center border border-[#c9c4d4] shrink-0">
              {name?.trim().split(/\s+/).filter(Boolean).map(n => n[0].toUpperCase()).filter((_, i, arr) => i === 0 || i === arr.length - 1).join("") || ""}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-heading font-semibold text-[#181c23] truncate group-hover:text-[#5a4bac] transition-colors">
                {name}
              </p>
              <p className="text-[10px] text-[#797583] truncate">{role} • {agency}</p>
            </div>
          </Link>
          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } finally {
                router.push("/login");
                router.refresh();
              }
            }}
            title="Log Out"
            className="w-10 h-10 rounded-2xl bg-[#faf9f6] border border-[#eae6df] flex items-center justify-center text-[#797583] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-72 h-[calc(100vh-4rem)] sticky top-16 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
