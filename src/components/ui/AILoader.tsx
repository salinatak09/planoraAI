"use client";

import * as React from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";

interface AILoaderProps {
  title?: string;
  subtitle?: string;
  progressPercent?: number;
  currentStepIndex?: number;
}

const DEFAULT_STEPS = [
  "Analyzing event parameters & aesthetic theme",
  "Structuring budget distributions across categories",
  "Curating high-affinity vendors & contract milestones",
  "Drafting hour-by-hour celebration itinerary",
];

export function AILoader({
  title = "Orchestrating Your Event Blueprint",
  subtitle = "Planora AI is harmonizing budget algorithms, vendor networks, and creative concepts.",
  progressPercent = 75,
  currentStepIndex = 2,
}: AILoaderProps) {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-[#eae6df] bg-white p-8 md:p-12 shadow-[0px_10px_35px_-4px_rgba(45,49,57,0.06)] relative overflow-hidden text-center">
      {/* Top Shimmer Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#f5f4f0] overflow-hidden">
        <div
          className="h-full shimmer-bg transition-all duration-500 rounded-r-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Breathing Ethereal AI Rings */}
      <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[#7364c7]/20 orbit-spin scale-110" />
        <div
          className="absolute inset-1 rounded-full border border-dashed border-[#466557]/30 orbit-spin"
          style={{ animationDirection: "reverse", animationDuration: "18s" }}
        />
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7364c7] via-[#c9bfff] to-[#c5e7d6] flex items-center justify-center breathe-ring shadow-lg">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-inner">
            <Sparkles className="w-6 h-6 text-[#5a4bac]" />
          </div>
        </div>
      </div>

      <h3 className="text-xl md:text-2xl font-heading font-bold text-[#181c23] tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-[#686e77] max-w-md mx-auto mb-8 leading-relaxed">
        {subtitle}
      </p>

      {/* Orchestration Checklist */}
      <div className="max-w-md mx-auto space-y-2.5 text-left bg-[#faf9f6] p-5 rounded-2xl border border-[#eae6df]">
        {DEFAULT_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 text-xs transition-opacity ${
                isDone
                  ? "text-[#466557] font-medium"
                  : isCurrent
                  ? "text-[#5a4bac] font-semibold"
                  : "text-[#797583] opacity-60"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                  isDone
                    ? "bg-[#c5e7d6] text-[#466557]"
                    : isCurrent
                    ? "bg-[#ede9fe] text-[#5a4bac] ring-2 ring-[#7364c7]/30"
                    : "bg-[#eae6df] text-[#797583]"
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="truncate">{step}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#797583]">
        <span className="w-2 h-2 rounded-full bg-[#466557] animate-pulse" />
        <span>Gemini 2.5 Generative Intelligence Active</span>
      </div>
    </div>
  );
}
