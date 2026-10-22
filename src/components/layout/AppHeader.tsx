import Link from "next/link";
import { Sparkles, Bell, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Planora
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent Event Planning
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Active Season
          </span>
          <span className="px-2.5 py-1 text-slate-500">2026 Edition</span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-600" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold text-xs dark:bg-purple-900 dark:text-purple-200">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
              Alex Vance
            </div>
            <div className="text-[10px] text-slate-500 leading-none mt-1">Lead Organizer</div>
          </div>
        </div>

        <Button size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
          New Event
        </Button>
      </div>
    </header>
  );
}
