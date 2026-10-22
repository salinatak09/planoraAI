"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Sparkles, Bookmark } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { AIIdea } from "@/lib/types";

const INITIAL_IDEAS: AIIdea[] = [
  {
    id: "idea-1",
    title: "Marigold & Brass Floating Candle Pavilions",
    description: "Cast antique brass urli bowls filled with fresh marigold blossoms and floating beeswax votives surrounding the palace reflection pool at golden hour.",
    category: "decor",
    estimatedCostRange: "₹45,000 - ₹65,000",
    tags: ["lighting", "palace-heritage", "evening"],
    createdAt: "2026-10-22T10:00:00.000Z",
  },
  {
    id: "idea-2",
    title: "Live Sitar & Cello Sunset Transition",
    description: "A customized acoustic crossover duo serenading guests as twilight descends, transitioning energy gracefully from arrival tea to evening Sangeet festivities.",
    category: "activity",
    estimatedCostRange: "₹60,000 - ₹85,000",
    tags: ["music", "fusion", "golden-hour"],
    createdAt: "2026-10-22T10:00:00.000Z",
  },
  {
    id: "idea-3",
    title: "Artisanal Royal Shahi Sarbat Bar",
    description: "Bespoke mocktail cart featuring iced hibiscus rosewater, saffron-infused almond thandai, and smoked clove lime spritzers served in etched silver tumblers.",
    category: "menu",
    estimatedCostRange: "₹50,000 - ₹75,000",
    tags: ["welcome", "mocktails", "heritage"],
    createdAt: "2026-10-22T10:00:00.000Z",
  },
  {
    id: "idea-4",
    title: "Handcrafted Blue Pottery Keepsake Station",
    description: "Custom glazed Jaipur miniature ceramic jewelry trays featuring couple's custom royal monogram for each guest to take home as a lasting heirloom favor.",
    category: "logistics",
    estimatedCostRange: "₹70,000 - ₹95,000",
    tags: ["keepsakes", "artisan", "sustainable"],
    createdAt: "2026-10-22T10:00:00.000Z",
  },
  {
    id: "idea-5",
    title: "Fragrance Bar & Custom Attar Blending",
    description: "Master perfumer creating custom botanical scent roll-ons for guests using traditional sandalwood, rose, and vetiver oils under a canopied tent.",
    category: "activity",
    estimatedCostRange: "₹55,000 - ₹80,000",
    tags: ["interactive", "sensory", "luxury"],
    createdAt: "2026-10-22T10:00:00.000Z",
  },
  {
    id: "idea-6",
    title: "Sheesh Mahal Mirror-Mosaic Photo Backdrop",
    description: "Intricately convex mirrored archway reflecting candlelight and the night sky, creating ethereal portraits without intrusive modern photo booth tech.",
    category: "decor",
    estimatedCostRange: "₹65,000 - ₹90,000",
    tags: ["decor", "photowall", "heritage"],
    createdAt: "2026-10-22T10:00:00.000Z",
  },
];

export default function EventIdeasPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set(["idea-1", "idea-3"]));
  const [ideas, setIdeas] = React.useState<AIIdea[]>(INITIAL_IDEAS);
  const ideaCounter = React.useRef(20);

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleGenerateNew() {
    setIsGenerating(true);
    setTimeout(() => {
      const id1 = ideaCounter.current++;
      const id2 = ideaCounter.current++;
      const generated: AIIdea[] = [
        {
          id: `idea-${id1}`,
          title: "Starlit Lantern Canopy over Banquet Tables",
          description: "Overhead canopies adorned with hundreds of delicate warm lanterns creating an illusion of open desert starlight over the dinner pavilions.",
          category: "decor",
          estimatedCostRange: "₹80,000 - ₹1,10,000",
          tags: ["ambience", "starlight", "banquet"],
          createdAt: "2026-10-22T12:00:00.000Z",
        },
        {
          id: `idea-${id2}`,
          title: "Customized Spice & Tea Pairing Journey",
          description: "Dessert station pairing traditional Rajasthani ghewar and malpua with single-estate Darjeeling teas and saffron cardamom brews.",
          category: "menu",
          estimatedCostRange: "₹40,000 - ₹60,000",
          tags: ["dessert", "tea-pairing", "culinary"],
          createdAt: "2026-10-22T12:00:00.000Z",
        },
      ];
      setIdeas((prev) => [...generated, ...prev]);
      setIsGenerating(false);
      setCustomPrompt("");
    }, 1200);
  }

  const filteredIdeas =
    filterCategory === "all" ? ideas : ideas.filter((i) => i.category === filterCategory);

  return (
    <AppShell
      activeEventTitle="Aarav & Meera Wedding Celebration"
      activeEventLocation="Jaipur, Dec 2026"
      eventId={eventId}
    >
      <div className="space-y-6">
        <EventWorkspaceHeader
          id={eventId}
          title="Aarav & Meera Wedding Celebration"
          type="wedding"
          status="confirmed"
          date="Dec 14, 2026"
          daysRemaining={142}
          location="Jaipur Royal Palace, Rajasthan"
          guestCount={350}
          budgetTotal={3850000}
        />

        {/* AI Creative Studio Generator Box */}
        <div className="rounded-3xl border border-[#dcd6cc] bg-gradient-to-br from-[#ede9fe]/40 via-white to-[#c5e7d6]/20 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5a4bac] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-extrabold text-[#181c23]">
                  Gemini Creative Inspiration Studio
                </h2>
                <p className="text-xs text-[#686e77]">
                  Theme Context: <strong className="text-[#5a4bac]">Royal Palace Heritage & Candlelit Amber</strong>
                </p>
              </div>
            </div>

            <Badge variant="sage" size="sm">
              {savedIds.size} Concepts Saved to Blueprint
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Brainstorm sustainable welcome gifts or outdoor acoustic music transitions..."
              className="flex-1 h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23] placeholder:text-[#797583] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac]"
            />
            <Button
              onClick={handleGenerateNew}
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {isGenerating ? "Consulting Gemini..." : "Generate AI Concepts"}
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[#797583] font-heading font-semibold mr-1">Concept Category:</span>
          {["all", "decor", "activity", "menu", "logistics"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full font-heading font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? "bg-[#5a4bac] text-white shadow-xs"
                  : "bg-white border border-[#eae6df] text-[#686e77] hover:text-[#181c23]"
              }`}
            >
              {cat === "all" ? "All Inspirations" : cat}
            </button>
          ))}
        </div>

        {/* Concepts Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea) => {
            const isSaved = savedIds.has(idea.id);

            return (
              <div
                key={idea.id}
                className="p-6 rounded-3xl border border-[#eae6df] bg-white shadow-2xs hover:border-[#5a4bac] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#5a4bac]">
                      {idea.category}
                    </span>
                    <button
                      onClick={() => toggleSave(idea.id)}
                      className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                        isSaved
                          ? "bg-[#5a4bac] text-white border-[#5a4bac]"
                          : "border-[#eae6df] text-[#797583] hover:text-[#5a4bac] hover:bg-[#faf9f6]"
                      }`}
                      title={isSaved ? "Saved to Blueprint" : "Save to Blueprint"}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-[#181c23] leading-snug">
                    {idea.title}
                  </h3>

                  <p className="text-xs text-[#686e77] leading-relaxed">
                    {idea.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f5f4f0] space-y-2">
                  <div className="flex items-center justify-between text-xs font-heading">
                    <span className="text-[#797583]">Estimated Cost:</span>
                    <span className="font-bold text-[#466557]">{idea.estimatedCostRange}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {idea.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#faf9f6] text-[#797583] border border-[#eae6df]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
