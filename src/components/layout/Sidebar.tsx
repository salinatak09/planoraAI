import Link from "next/link";
import {
  CalendarDays,
  Sparkles,
  CheckSquare,
  Users2,
  DollarSign,
  Clock,
  Settings,
  HelpCircle,
} from "lucide-react";

export function Sidebar() {
  const mainNavItems = [
    { label: "Events Hub", href: "/", icon: CalendarDays, active: true },
    { label: "AI Creative Studio", href: "#ai-studio", icon: Sparkles },
    { label: "Timeline & Agenda", href: "#timeline", icon: Clock },
    { label: "Tasks & Milestones", href: "#tasks", icon: CheckSquare },
    { label: "Vendor Directory", href: "#vendors", icon: Users2 },
    { label: "Budget & Cashflow", href: "#budget", icon: DollarSign },
  ];

  const secondaryNavItems = [
    { label: "Preferences", href: "#settings", icon: Settings },
    { label: "Documentation", href: "#docs", icon: HelpCircle },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white/50 backdrop-blur-sm p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Planning Suite
        </div>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          System & Help
        </div>
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="mt-4 rounded-lg bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-purple-500/10 p-3 border border-purple-200/50 dark:border-purple-800/30">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-800 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini GenAI
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Official @google/genai SDK integration active.
          </p>
        </div>
      </div>
    </aside>
  );
}
