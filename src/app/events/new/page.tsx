"use client";

import {useState, ComponentType} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Wallet,
  PartyPopper,
  Heart,
  Landmark,
  Compass,
  Check,
  Palette,
  AlertCircle,
  Building,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { EventType } from "@/lib/types";

export default function NewEventWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Form State
  // Step 1: Core Archetype & Basics
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("wedding");
  const [date, setDate] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // Step 2: Location & Venue Preference
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [venuePreference, setVenuePreference] = useState("Historic Heritage Palace");
  const [indoorOutdoor, setIndoorOutdoor] = useState<"indoor" | "outdoor" | "mixed">("mixed");
  const [guestCount, setGuestCount] = useState<number>(250);

  // Step 3: Financials & Currency
  const [budgetTotal, setBudgetTotal] = useState<number>(350000);
  const [currency, setCurrency] = useState("₹");
  const [eventPriorities, setEventPriorities] = useState<string[]>([
    "Catering & Culinary",
    "Decor & Ambiance",
  ]);

  // Step 4: Aesthetics & Culinary
  const [theme, setTheme] = useState("");
  const [colorPreferences, setColorPreferences] = useState<string[]>([
    "Burgundy & Gold",
    "Ivory & Warm Amber",
  ]);
  const [foodPreferences, setFoodPreferences] = useState<string[]>([
    "Traditional Royal Banquet",
    "Live Artisanal Counters",
  ]);

  // Step 5: Accessibility & Logistics
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>([
    "Step-Free Wheelchair Access",
    "Assisted Buggy Transfer",
  ]);
  const [notes, setNotes] = useState("");

  // Archetype Cards
  const eventTypes: { id: EventType; title: string; desc: string; icon: ComponentType<{ className?: string }> }[] = [
    {
      id: "wedding",
      title: "Wedding Gala",
      desc: "Multi-day ceremonies, sangeet banquets, and grand receptions",
      icon: Heart,
    },
    {
      id: "anniversary",
      title: "Anniversary Jubilee",
      desc: "Silver & golden milestones, private dinners, and renewed vows",
      icon: Sparkles,
    },
    {
      id: "birthday",
      title: "Birthday Milestone",
      desc: "Curated 30th/50th galas, intimate sunset soirées, and celebrations",
      icon: PartyPopper,
    },
    {
      id: "community",
      title: "Community Festival",
      desc: "Charity galas, cultural showcases, and seasonal gatherings",
      icon: Landmark,
    },
    {
      id: "other",
      title: "Special Celebration",
      desc: "Corporate product launches, art previews, and bespoke events",
      icon: Compass,
    },
  ];

  // Helper for multi-tag toggling
  function toggleArrayItem(item: string, current: string[], setter: (val: string[]) => void) {
    if (current.includes(item)) {
      setter(current.filter((x) => x !== item));
    } else {
      setter([...current, item]);
    }
  }

  // Client-side validation for step transitions
  function canProceedToNext(): boolean {
    if (currentStep === 1) {
      return title.trim().length >= 3 && Boolean(date);
    }
    if (currentStep === 2) {
      return location.trim().length >= 2 && guestCount >= 1;
    }
    if (currentStep === 3) {
      return budgetTotal >= 0;
    }
    if (currentStep === 4) {
      return theme.trim().length >= 2;
    }
    return true;
  }

  function handleNext() {
    setServerError(null);
    if (!canProceedToNext()) {
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    setServerError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      title,
      type,
      date,
      timezone,
      location: location || `${city} Venue`,
      city,
      venuePreference,
      indoorOutdoor,
      guestCount: Number(guestCount),
      budgetTotal: Number(budgetTotal),
      currency,
      theme,
      colorPreferences,
      foodPreferences,
      eventPriorities,
      accessibilityNeeds,
      notes,
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(
          data?.error?.message ||
            (data?.error?.details ? data.error.details.map((d: { message: string }) => d.message).join(", ") : "Failed to create event")
        );
        setIsSubmitting(false);
        return;
      }

      const createdId = data?.data?._id || data?.data?.id;
      router.push(`/events/${createdId}`);
      router.refresh();
    } catch {
      setServerError("Network error while connecting to MongoDB. Please try again.");
      setIsSubmitting(false);
    }
  }

  const stepsMeta = [
    { num: 1, title: "Concept & Date", desc: "Archetype & Title" },
    { num: 2, title: "Destination & Venue", desc: "City & Capacity" },
    { num: 3, title: "Financial Scope", desc: "Budget & Currency" },
    { num: 4, title: "Aesthetics & Taste", desc: "Theme & Palette" },
    { num: 5, title: "Logistics & Review", desc: "Accessibility & Launch" },
  ];

  return (
    <AppShell activeEventTitle="Event Creation Studio" activeEventLocation="Multi-Step Wizard">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-heading font-semibold text-[#686e77] hover:text-[#181c23] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#797583]">Step {currentStep} of 5</span>
          </div>
        </div>

        {/* Wizard Progress Indicator Bar */}
        <div className="bg-white rounded-3xl border border-[#eae6df] p-4 sm:p-6 shadow-xs">
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {stepsMeta.map((s) => {
              const isPast = s.num < currentStep;
              const isCurrent = s.num === currentStep;

              return (
                <div
                  key={s.num}
                  onClick={() => {
                    if (s.num < currentStep) setCurrentStep(s.num);
                  }}
                  className={`flex flex-col gap-1.5 cursor-pointer transition-all ${
                    isCurrent ? "opacity-100" : isPast ? "opacity-80 hover:opacity-100" : "opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-heading font-bold transition-all ${
                        isPast
                          ? "bg-[#466557] text-white"
                          : isCurrent
                          ? "bg-[#5a4bac] text-white ring-4 ring-[#e5deff]"
                          : "bg-[#eae6df] text-[#686e77]"
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span className="hidden md:inline font-heading font-bold text-xs text-[#181c23] truncate">
                      {s.title}
                    </span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isPast ? "bg-[#466557]" : isCurrent ? "bg-[#5a4bac]" : "bg-[#f5f4f0]"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="p-4 rounded-2xl bg-[#ffdad6]/60 border border-[#ba1a1a]/20 flex items-start gap-3 text-xs text-[#93000a] animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ba1a1a]" />
            <div className="leading-relaxed font-medium">{serverError}</div>
          </div>
        )}

        {/* Main Step Card Container */}
        <div className="rounded-3xl border border-[#eae6df] bg-white p-6 sm:p-10 shadow-xs space-y-6">
          {/* STEP 1: Archetype & Core Basics */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#5a4bac]">
                  Step 1 of 5 • Core Identity
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mt-1">
                  What celebration are we orchestrating?
                </h2>
                <p className="text-xs text-[#686e77] mt-1">
                  Select your celebration archetype and establish title, date, and operating timezone.
                </p>
              </div>

              {/* Archetype Selector */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2.5">
                  Celebration Archetype
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {eventTypes.map((et) => {
                    const Icon = et.icon;
                    const isSelected = type === et.id;
                    return (
                      <button
                        key={et.id}
                        type="button"
                        onClick={() => setType(et.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "bg-[#f8f6ff] border-[#5a4bac] shadow-xs ring-2 ring-[#7364c7]/20"
                            : "bg-[#faf9f6] border-[#eae6df] hover:bg-[#f1f3fe] hover:border-[#dcd6cc]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isSelected ? "bg-[#5a4bac] text-white" : "bg-white text-[#5a4bac] border border-[#eae6df]"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#5a4bac] text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-heading font-bold text-xs text-[#181c23]">{et.title}</p>
                          <p className="text-[11px] text-[#797583] mt-0.5 leading-snug">{et.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Title */}
              <Input
                label="Event Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Diya & Kabir's Sunset Sangeet & Reception"
                required
                helperText="Give your celebration a distinctive, descriptive name."
              />

              {/* Date & Timezone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Celebration Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-semibold text-[#181c23]">
                    Regional Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST • GMT +5:30)</option>
                    <option value="America/New_York">America/New York (EST/EDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST • GMT +4:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT • GMT +8:00)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Destination, Venue & Capacity */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#5a4bac]">
                  Step 2 of 5 • Location & Setting
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mt-1">
                  Where will this milestone take place?
                </h2>
                <p className="text-xs text-[#686e77] mt-1">
                  Pinpoint destination grounds, indoor/outdoor preferences, and target attendee count.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Host City / Region"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Udaipur, Rajasthan"
                  leftIcon={<MapPin className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Venue / Property Name"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Jagmandir Island Palace & Heritage Courtyard"
                  leftIcon={<Building className="w-4 h-4" />}
                  required
                  helperText="Exact estate or preliminary venue shortlist."
                />
              </div>

              {/* Venue Style Preference */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                  Venue Archetype Preference
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    "Historic Heritage Palace",
                    "Luxury Beachfront Resort",
                    "Botanical Glasshouse",
                    "Private Vineyard Estate",
                  ].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVenuePreference(v)}
                      className={`p-3 rounded-2xl border text-xs text-center font-heading font-medium transition-all cursor-pointer ${
                        venuePreference === v
                          ? "bg-[#5a4bac] text-white border-[#5a4bac] shadow-xs"
                          : "bg-[#faf9f6] border-[#eae6df] text-[#484552] hover:bg-[#f1f3fe]"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Space Dynamics: Indoor / Outdoor / Mixed */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                  Space Layout Setting
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "indoor", label: "Indoor Only", desc: "Climate-controlled ballroom / gallery" },
                    { id: "outdoor", label: "Open-Air Lawn", desc: "Alfresco under starlit canopies" },
                    { id: "mixed", label: "Hybrid / Mixed", desc: "Indoor dining + outdoor lawns" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIndoorOutdoor(item.id as "indoor" | "outdoor" | "mixed")}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        indoorOutdoor === item.id
                          ? "bg-[#ede9fe] border-[#5a4bac] ring-2 ring-[#7364c7]/20"
                          : "bg-[#faf9f6] border-[#eae6df] hover:bg-[#f1f3fe]"
                      }`}
                    >
                      <p className="font-heading font-bold text-xs text-[#181c23]">{item.label}</p>
                      <p className="text-[11px] text-[#797583] mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <Input
                  label="Target Guest Count (RSVP)"
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                  leftIcon={<Users className="w-4 h-4" />}
                  min={1}
                  max={50000}
                  required
                  helperText="Initial capacity estimation for catering and seating floor plans."
                />
              </div>
            </div>
          )}

          {/* STEP 3: Financial Capital & Currency */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#5a4bac]">
                  Step 3 of 5 • Financial Budgeting
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mt-1">
                  Plan your overall budget envelope
                </h2>
                <p className="text-xs text-[#686e77] mt-1">
                  Establish master planned capital and mark key disbursement priorities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-semibold text-[#181c23]">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac]"
                  >
                    <option value="₹">₹ INR (Indian Rupee)</option>
                    <option value="$">$ USD (US Dollar)</option>
                    <option value="€">€ EUR (Euro)</option>
                    <option value="£">£ GBP (British Pound)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Master Planned Budget"
                    type="number"
                    value={budgetTotal}
                    onChange={(e) => setBudgetTotal(Math.max(0, Number(e.target.value)))}
                    leftIcon={<Wallet className="w-4 h-4" />}
                    min={0}
                    required
                    helperText={`Total capital allocated across all vendor ledgers (${currency}${Number(budgetTotal).toLocaleString()})`}
                  />
                </div>
              </div>

              {/* Quick Budget Presets */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                  Quick Benchmark Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: "Boutique Intimate", amount: 1500000 },
                    { label: "Signature Luxe", amount: 3500000 },
                    { label: "Grand Destination", amount: 7500000 },
                    { label: "Imperial Royal", amount: 15000000 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setBudgetTotal(p.amount)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        budgetTotal === p.amount
                          ? "bg-[#5a4bac] text-white border-[#5a4bac] shadow-xs"
                          : "bg-[#faf9f6] border-[#eae6df] text-[#484552] hover:bg-[#f1f3fe]"
                      }`}
                    >
                      <p className="font-heading font-bold text-xs">{p.label}</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{currency}{p.amount.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Priorities */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                  Strategic Splurge Priorities (Select top focal points)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Venue & Royal Ambience",
                    "Catering & Culinary",
                    "Decor & Ambiance",
                    "Cinematography & Photo",
                    "Live Sound & Concert Lighting",
                    "Guest Hospitality & Suites",
                  ].map((priority) => {
                    const isSelected = eventPriorities.includes(priority);
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => toggleArrayItem(priority, eventPriorities, setEventPriorities)}
                        className={`px-3.5 py-2 rounded-full text-xs font-heading font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#466557] text-white border-[#466557]"
                            : "bg-[#faf9f6] text-[#484552] border-[#eae6df] hover:bg-[#f1f3fe]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {priority}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Aesthetics & Taste */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#5a4bac]">
                  Step 4 of 5 • Aesthetics & Sensory Style
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mt-1">
                  Curate the atmosphere, colors, and culinary profile
                </h2>
                <p className="text-xs text-[#686e77] mt-1">
                  These inputs directly seed Gemini AI recommendations for styling briefs and vendor specs.
                </p>
              </div>

              {/* Theme Input */}
              <Input
                label="Theme & Design Concept"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Royal Palace Heritage & Candlelit Amber"
                leftIcon={<Palette className="w-4 h-4" />}
                required
                helperText="Primary visual motif driving decor, florals, and stage presentation."
              />

              {/* Color Palette Multi-Select */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                  Color Harmony & Palettes
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Burgundy & Gold",
                    "Ivory & Warm Amber",
                    "Emerald Green & Brass",
                    "Champagne & Terracotta",
                    "Dusty Rose & Sage",
                    "Midnight Blue & Silver",
                  ].map((color) => {
                    const isSelected = colorPreferences.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleArrayItem(color, colorPreferences, setColorPreferences)}
                        className={`px-3.5 py-2 rounded-full text-xs font-heading font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#5a4bac] text-white border-[#5a4bac]"
                            : "bg-[#faf9f6] text-[#484552] border-[#eae6df] hover:bg-[#f1f3fe]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Food & Beverage Preferences */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                  Culinary Direction & Menu Features
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Traditional Royal Banquet",
                    "Pan-Asian Street Grills",
                    "Live Artisanal Counters",
                    "Organic Farm-to-Table",
                    "Signature Craft Mocktails & Mixology",
                    "Vegetarian / Jain Curated Menu",
                  ].map((food) => {
                    const isSelected = foodPreferences.includes(food);
                    return (
                      <button
                        key={food}
                        type="button"
                        onClick={() => toggleArrayItem(food, foodPreferences, setFoodPreferences)}
                        className={`px-3.5 py-2 rounded-full text-xs font-heading font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#466557] text-white border-[#466557]"
                            : "bg-[#faf9f6] text-[#484552] border-[#eae6df] hover:bg-[#f1f3fe]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {food}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Accessibility, Logistics & Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#5a4bac]">
                  Step 5 of 5 • Logistics & Final Confirmation
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#181c23] tracking-tight mt-1">
                  Accessibility needs and review summary
                </h2>
                <p className="text-xs text-[#686e77] mt-1">
                  Ensure all guests and elders enjoy seamless accessibility and review celebration specs before creation.
                </p>
              </div>

              {/* Accessibility Selection */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                  Accessibility & Comfort Requirements
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Step-Free Wheelchair Access",
                    "Assisted Buggy Transfer",
                    "Quiet Sensory & Rest Lounge",
                    "Priority Front Seating for Elders",
                    "Sign Language / Audio Induction Loop",
                  ].map((acc) => {
                    const isSelected = accessibilityNeeds.includes(acc);
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => toggleArrayItem(acc, accessibilityNeeds, setAccessibilityNeeds)}
                        className={`px-3.5 py-2 rounded-full text-xs font-heading font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#5a4bac] text-white border-[#5a4bac]"
                            : "bg-[#faf9f6] text-[#484552] border-[#eae6df] hover:bg-[#f1f3fe]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {acc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-xs font-heading font-semibold text-[#181c23] block mb-1.5">
                  Special Directives & Planner Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP arrivals through North Gate. Live dhol procession starts precisely at sunset..."
                  rows={3}
                  className="w-full rounded-2xl border border-[#eae6df] bg-white p-3.5 text-xs text-[#181c23] placeholder:text-[#797583] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac]"
                />
              </div>

              {/* Review Summary Card */}
              <div className="rounded-2xl bg-[#faf9f6] border border-[#eae6df] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#eae6df] pb-3">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#181c23]">{title}</h4>
                    <p className="text-xs text-[#797583] capitalize">
                      {type} Celebration • {location || city}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#ede9fe] text-[#5a4bac] font-heading font-bold text-xs">
                    {currency}{Number(budgetTotal).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#797583] block">Date:</span>
                    <span className="font-heading font-semibold text-[#181c23]">{date}</span>
                  </div>
                  <div>
                    <span className="text-[#797583] block">Guest Target:</span>
                    <span className="font-heading font-semibold text-[#181c23]">{guestCount} Guests</span>
                  </div>
                  <div>
                    <span className="text-[#797583] block">Space Setting:</span>
                    <span className="font-heading font-semibold text-[#181c23] capitalize">{indoorOutdoor}</span>
                  </div>
                  <div>
                    <span className="text-[#797583] block">Timezone:</span>
                    <span className="font-heading font-semibold text-[#181c23]">{timezone.split("/")[1] || timezone}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs border-t border-[#f5f4f0]">
                  <span className="text-[#797583]">Design Theme: </span>
                  <span className="font-heading font-semibold text-[#5a4bac]">{theme}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Footer Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-[#eae6df]">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous Step
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceedToNext()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next: {stepsMeta[currentStep]?.title || "Continue"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                isLoading={isSubmitting}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Save Event to MongoDB & Launch
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
