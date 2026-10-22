"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Wand2, ArrowLeft, Calendar, MapPin, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { EventType } from "@/lib/types";

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<EventType>("wedding");
  const [date, setDate] = React.useState("2026-12-18");
  const [location, setLocation] = React.useState("");
  const [guestCount, setGuestCount] = React.useState(250);
  const [budgetTotal, setBudgetTotal] = React.useState(3000000);
  const [theme, setTheme] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !location || !theme) {
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/events/evt-aarav-meera");
    }, 700);
  }

  return (
    <AppShell activeEventTitle="Create New Celebration" activeEventLocation="Draft Mode">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-heading font-semibold text-[#686e77] hover:text-[#181c23] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <Link href="/onboarding">
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ede9fe] text-[#5a4bac] text-xs font-heading font-semibold hover:bg-[#e5deff] transition-colors">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Use Guided 5-Step AI Wizard</span>
            </button>
          </Link>
        </div>

        <div className="rounded-3xl border border-[#eae6df] bg-white p-6 sm:p-10 shadow-xs space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight">
              Create New Celebration
            </h1>
            <p className="text-xs text-[#686e77] mt-1">
              Set up core logistical parameters. You can refine timeline intervals and vendor envelopes anytime.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-heading font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Diya & Kabir's Sunset Sangeet & Reception"
              required
            />

            <div>
              <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                Celebration Archetype
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(["wedding", "anniversary", "birthday", "community"] as EventType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2.5 px-3 rounded-2xl border capitalize font-heading font-semibold transition-all cursor-pointer ${
                      type === t
                        ? "bg-[#5a4bac] text-white border-[#5a4bac] shadow-xs"
                        : "border-[#eae6df] bg-[#faf9f6] text-[#484552] hover:bg-[#f1f3fe]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Target Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
                required
              />

              <Input
                label="Location or Venue"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Oberoi Udaivilas, Lake Pichola"
                leftIcon={<MapPin className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Guest Count"
                type="number"
                min="10"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                leftIcon={<Users className="w-4 h-4" />}
                required
              />

              <Input
                label="Total Planned Budget (₹)"
                type="number"
                step="10000"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(parseFloat(e.target.value) || 0)}
                leftIcon={<Wallet className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Design Theme & Aesthetic Notes"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Royal Marigold & Starlit Champagne Pavilions"
              leftIcon={<Sparkles className="w-4 h-4" />}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-heading font-semibold text-[#181c23]">
                Special Instructions (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VIP sound restrictions, international guest transit notes, or heritage decor guidelines..."
                className="w-full text-xs p-3 rounded-2xl border border-[#eae6df] bg-white text-[#181c23] placeholder:text-[#797583] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac] h-24 resize-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eae6df]">
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Celebration & Open Workspace
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
