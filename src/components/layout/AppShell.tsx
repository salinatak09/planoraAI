"use client";

import * as React from "react";
import { TopNavBar } from "./TopNavBar";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children: React.ReactNode;
  activeEventTitle?: string;
  activeEventLocation?: string;
  eventId?: string;
}

export function AppShell({
  children,
  activeEventTitle,
  activeEventLocation,
  eventId,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <TopNavBar
        activeEventTitle={activeEventTitle}
        activeEventLocation={activeEventLocation}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex flex-1 min-w-0">
        <AppSidebar
          eventId={eventId}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
