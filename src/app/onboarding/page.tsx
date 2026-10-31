"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  MapPin,
  Users,
  Wallet,
  PartyPopper,
  Heart,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AILoader } from "@/components/ui/AILoader";

export default function OnboardingWizardPage() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationComplete, setGenerationComplete] = React.useState(false);
  const [createdEventId, setCreatedEventId] = React.useState<string | null>(null);

  // Form State
  const [eventType, setEventType] = React.useState("wedding");
  const [title, setTitle] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [date, setDate] = React.useState("");
  const [guests, setGuests] = React.useState(0);
  const [budget, setBudget] = React.useState(0);
  const [currency, setCurrency] = React.useState("₹");
  const [theme, setTheme] = React.useState("");
  const [priority, setPriority] = React.useState("decor");

  const eventTypes = [
    {
      id: "wedding",
      title: "Wedding Gala",
      desc: "Multi-day nuptials, sangeet, and reception banquets",
      icon: Heart,
      accent: "bg-[#ede9fe] text-[#5a4bac]",
    },
    {
      id: "anniversary",
      title: "Anniversary Jubilee",
      desc: "Silver & golden milestones, elegant dinners",
      icon: Sparkles,
      accent: "bg-[#ffdcc4] text-[#884a0f]",
    },
    {
      id: "birthday",
      title: "Birthday Milestone",
      desc: "Intimate soirees, themed 30th/50th gatherings",
      icon: PartyPopper,
      accent: "bg-[#fde8d7] text-[#a66227]",
    },
    {
      id: "community",
      title: "Community Festival",
      desc: "Cultural fairs, seasonal galas, charity banquets",
      icon: Landmark,
      accent: "bg-[#c5e7d6] text-[#466557]",
    },
  ];

  const themes = [
    {
      id: "royal",
      name: "Royal Palace Heritage & Candlelit Amber",
      desc: "Regal arches, marigold garlands, brass lanterns, warm mood lighting",
    },
    {
      id: "glasshouse",
      name: "Botanical Glasshouse & Gold",
      desc: "Lush hanging greenery, transparent conservatories, acoustic strings",
    },
    {
      id: "minimalist",
      name: "Contemporary Ivory Minimalist",
      desc: "Clean geometric staging, monochrome florals, ambient jazz lounge",
    },
    {
      id: "boho",
      name: "Bohemian Woodland Banquet",
      desc: "Fairy-lit canopy, rustic timber tables, organic artisanal dining",
    },
  ];

  async function handleNext() {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 4) {
      setCurrentStep(5);
      setIsGenerating(true);

      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            type: eventType,
            date,
            location,
            guestCount: Number(guests),
            budgetTotal: Number(budget),
            currency,
            theme,
            eventPriorities: [priority],
          }),
        });
        const data = await res.json();
        if (res.ok && (data?.data?._id || data?.data?.id)) {
          setCreatedEventId(data.data._id || data.data.id);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationComplete(true);
        }, 1200);
      }
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-[#181c23]">
      {/* Top Wizard Navigation */}
      <header className="flex justify-between items-center w-full px-6 py-3.5 border-b border-[#eae6df] bg-white sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#5a4bac] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-heading font-extrabold text-base text-[#5a4bac] tracking-tight">
              Planora AI
            </span>
          </Link>
          <div className="h-4 w-px bg-[#eae6df] hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-xs font-heading font-medium text-[#797583]">
            <span className="w-2 h-2 rounded-full bg-[#466557] animate-pulse" />
            <span>Celebration Orchestrator Wizard</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="px-3.5 py-1.5 rounded-full border border-[#eae6df] text-xs font-heading font-semibold text-[#484552] hover:bg-[#f5f4f0] transition-colors">
              Save & Exit to Dashboard
            </button>
          </Link>
        </div>
      </header>

      {/* Step Progression Strip */}
      <div className="bg-white border-b border-[#eae6df] px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {[
            { num: 1, label: "Event Type" },
            { num: 2, label: "Logistics" },
            { num: 3, label: "Budget & Splits" },
            { num: 4, label: "Aesthetic Theme" },
            { num: 5, label: "AI Synthesis" },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-bold transition-all ${
                    currentStep > s.num
                      ? "bg-[#c5e7d6] text-[#466557]"
                      : currentStep === s.num
                      ? "bg-[#5a4bac] text-white shadow-xs"
                      : "bg-[#f1f3fe] text-[#797583]"
                  }`}
                >
                  {currentStep > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span
                  className={`hidden md:inline text-xs font-heading ${
                    currentStep === s.num ? "font-bold text-[#181c23]" : "text-[#797583]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 4 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                    currentStep > idx + 1 ? "bg-[#c5e7d6]" : "bg-[#eae6df]"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Form Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <div className="w-full">
          {/* STEP 1: EVENT TYPE */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-lg mx-auto">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#181c23] tracking-tight">
                  What celebration are we orchestrating?
                </h2>
                <p className="text-xs sm:text-sm text-[#686e77] mt-1.5">
                  Select the core gathering archetype. Our AI adapts timeline rhythms and budget allocations accordingly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventTypes.map((et) => {
                  const Icon = et.icon;
                  const isSelected = eventType === et.id;
                  return (
                    <div
                      key={et.id}
                      onClick={() => setEventType(et.id)}
                      className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#5a4bac] bg-[#ede9fe]/40 ring-2 ring-[#5a4bac]/20 shadow-md"
                          : "border-[#eae6df] bg-white hover:border-[#c9c4d4] hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${et.accent}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-heading font-bold text-base text-[#181c23]">
                          {et.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#686e77] leading-relaxed">
                        {et.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: LOGISTICS */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#181c23] tracking-tight">
                  Logistics & Guest Experience
                </h2>
                <p className="text-xs sm:text-sm text-[#686e77] mt-1.5">
                  Provide baseline coordinates to calculate venue capacity and catering models.
                </p>
              </div>

              <div className="rounded-3xl border border-[#eae6df] bg-white p-6 sm:p-8 space-y-4 shadow-xs">
                <Input
                  label="Celebration Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Aarav & Meera Wedding Celebration"
                  required
                />

                <Input
                  label="Location or Target Venue"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Udaipur Palace Grounds, Rajasthan"
                  leftIcon={<MapPin className="w-4 h-4" />}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Target Celebration Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    leftIcon={<Calendar className="w-4 h-4" />}
                    required
                  />

                  <Input
                    label="Estimated Guest Count"
                    type="number"
                    min="10"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 0)}
                    leftIcon={<Users className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BUDGET & PRIORITIES */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#181c23] tracking-tight">
                  Total Budget & Strategic Focus
                </h2>
                <p className="text-xs sm:text-sm text-[#686e77] mt-1.5">
                  Input your target expenditure. Our algorithms establish automated vendor category envelopes.
                </p>
              </div>

              <div className="rounded-3xl border border-[#eae6df] bg-white p-6 sm:p-8 space-y-5 shadow-xs">
                <div className="flex gap-3">
                  <div className="w-24 shrink-0">
                    <label className="text-xs font-heading font-semibold text-[#181c23] block mb-1.5">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-11 w-full rounded-full border border-[#eae6df] bg-white px-3 text-sm text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="₹">₹ (INR)</option>
                      <option value="$">$ (USD)</option>
                      <option value="€">€ (EUR)</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <Input
                      label="Total Planned Budget"
                      type="number"
                      step="5000"
                      value={budget}
                      onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                      leftIcon={<Wallet className="w-4 h-4" />}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-heading font-semibold text-[#181c23] block mb-2">
                    Primary Splurge Priority
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: "decor", label: "Grand Decor & Lighting" },
                      { id: "culinary", label: "Artisan Culinary Banquet" },
                      { id: "music", label: "Live Sangeet & Sound" },
                      { id: "photo", label: "Cinematography" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-heading font-semibold ${
                          priority === p.id
                            ? "bg-[#5a4bac] text-white border-[#5a4bac] shadow-xs"
                            : "border-[#eae6df] bg-[#faf9f6] text-[#484552] hover:bg-[#f1f3fe]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: VIBE & AESTHETIC THEME */}
          {currentStep === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#181c23] tracking-tight">
                  Select Design Vibe & Theme
                </h2>
                <p className="text-xs sm:text-sm text-[#686e77] mt-1.5">
                  Planora AI uses this aesthetic vector to curate floral palettes, lighting, and decor ideas.
                </p>
              </div>

              <div className="space-y-3">
                {themes.map((th) => {
                  const isSelected = theme === th.name;
                  return (
                    <div
                      key={th.id}
                      onClick={() => setTheme(th.name)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#5a4bac] bg-[#ede9fe]/40 ring-2 ring-[#5a4bac]/20 shadow-xs"
                          : "border-[#eae6df] bg-white hover:border-[#c9c4d4]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-heading font-bold text-sm text-[#181c23]">
                          {th.name}
                        </h4>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#5a4bac] text-white flex items-center justify-center text-xs">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#686e77] mt-1">{th.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: AI SYNTHESIS & REVIEW */}
          {currentStep === 5 && (
            <div className="w-full">
              {isGenerating ? (
                <AILoader
                  title={`Orchestrating ${title}`}
                  subtitle="Harmonizing regional vendor rates in Rajasthan with your theme and budget..."
                  progressPercent={82}
                  currentStepIndex={2}
                />
              ) : generationComplete ? (
                <div className="max-w-2xl mx-auto rounded-3xl border border-[#eae6df] bg-white p-8 md:p-10 shadow-lg text-center space-y-6 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-[#c5e7d6] text-[#466557] mx-auto flex items-center justify-center">
                    <Check className="w-8 h-8 stroke-[2.5]" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight">
                      Celebration Blueprint Synthesized!
                    </h3>
                    <p className="text-xs text-[#686e77] mt-1 max-w-md mx-auto">
                      Planora AI generated your initial budget breakdown, 42 milestone tasks, and custom decor concepts.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-5 rounded-2xl bg-[#faf9f6] border border-[#eae6df] text-left grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#797583]">Event:</span>
                      <p className="font-heading font-bold text-[#181c23]">{title}</p>
                    </div>
                    <div>
                      <span className="text-[#797583]">Budget Envelopes:</span>
                      <p className="font-heading font-bold text-[#466557]">
                        {currency}
                        {budget.toLocaleString()} Allocated
                      </p>
                    </div>
                    <div>
                      <span className="text-[#797583]">Coordinates:</span>
                      <p className="font-heading font-semibold text-[#181c23]">
                        {location} ({guests} guests)
                      </p>
                    </div>
                    <div>
                      <span className="text-[#797583]">Design Concept:</span>
                      <p className="font-heading font-semibold text-[#5a4bac]">{theme}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link
                      href={createdEventId ? `/events/${createdEventId}` : "/dashboard"}
                      className="w-full sm:w-auto"
                    >
                      <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Launch Event Workspace Hub
                      </Button>
                    </Link>
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto">
                        View All Events Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Stepper Footer Controls */}
          {currentStep < 5 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#eae6df] mt-8 max-w-2xl mx-auto">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous Step
              </Button>

              <Button
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {currentStep === 4 ? "Generate AI Blueprint" : "Next Step"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
