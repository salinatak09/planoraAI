"use client";

import * as React from "react";
import {
  Sparkles,
  Check,
  AlertTriangle,
  Calendar,
  DollarSign,
  CheckSquare,
  Lightbulb,
  ShieldAlert,
  X,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, TaskPriorityBadge } from "@/components/ui/Badge";
import type { CompleteEventPlan } from "@/lib/ai/schemas";

interface PlanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  plan: CompleteEventPlan | null;
  onPlanApplied: (counts: { budgetItems: number; tasks: number; ideas: number }) => void;
}

export function PlanReviewModal({
  isOpen,
  onClose,
  eventId,
  plan,
  onPlanApplied,
}: PlanReviewModalProps) {
  const [activeTab, setActiveTab] = React.useState<
    "summary" | "budget" | "timeline" | "vendors" | "ideas" | "risks"
  >("summary");

  const [applyOptions, setApplyOptions] = React.useState({
    applySummary: true,
    applyBudget: true,
    applyTasks: true,
    applyIdeas: true,
  });

  const [isApplying, setIsApplying] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successResult, setSuccessResult] = React.useState<{
    budgetItems: number;
    tasks: number;
    ideas: number;
  } | null>(null);

  if (!isOpen || !plan) return null;

  async function handleApply() {
    setIsApplying(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/events/${eventId}/plan/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          applyOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to apply event plan to database");
      }

      setSuccessResult(data.data.appliedCounts);
      onPlanApplied(data.data.appliedCounts);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsApplying(false);
    }
  }

  const currency = plan.metadata.currency || "₹";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#eae6df] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#eae6df] bg-[#faf9f6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5a4bac] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg text-[#181c23]">
                  AI Generated Event Blueprint
                </h3>
                <Badge variant="sage" size="sm">
                  Gemini 3.8
                </Badge>
                <span className="text-[11px] font-medium text-[#797583] bg-[#ede9fe] text-[#5a4bac] px-2 py-0.5 rounded-full">
                  Planning Estimate
                </span>
              </div>
              <p className="text-xs text-[#797583]">
                Review the comprehensive event plan before selectively importing records into your live workspace.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#797583] hover:text-[#181c23] rounded-full hover:bg-[#eae6df] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Infeasibility Banner if Over Budget */}
        {plan.metadata.budgetHealth === "infeasible" && plan.metadata.infeasibilityTradeoffs && (
          <div className="bg-[#fef2f2] border-b border-[#fee2e2] p-4 px-6 flex items-start gap-3 text-xs text-[#991b1b]">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#ef4444]" />
            <div>
              <strong className="font-semibold block mb-0.5">Budget Ceiling Trade-off Notice:</strong>
              <p className="leading-relaxed">{plan.metadata.infeasibilityTradeoffs}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-[#eae6df] px-6 flex gap-2 overflow-x-auto bg-white custom-scrollbar">
          {[
            { id: "summary", label: "Summary & Concept", icon: Sparkles },
            { id: "budget", label: `Budget (${plan.budget.length})`, icon: DollarSign },
            { id: "timeline", label: `Timeline (${plan.timeline.length})`, icon: Calendar },
            { id: "vendors", label: `Vendors (${plan.vendorChecklist.length})`, icon: CheckSquare },
            { id: "ideas", label: `Ideas (${plan.personalizedIdeas.length})`, icon: Lightbulb },
            { id: "risks", label: `Risks & Backups (${plan.risksAndBackups.length})`, icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-heading font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-[#5a4bac] text-[#5a4bac]"
                    : "border-transparent text-[#797583] hover:text-[#181c23]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#faf9f6]/40">
          {successResult ? (
            <div className="p-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#c5e7d6] text-[#466557] mx-auto flex items-center justify-center">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="font-heading font-bold text-xl text-[#181c23]">
                Event Blueprint Successfully Applied!
              </h4>
              <p className="text-xs text-[#797583] leading-relaxed">
                Your event has been synchronized with the AI plan. Check your budget manager, task checklist, and ideas studio to view the imported records.
              </p>
              <div className="bg-white border border-[#eae6df] rounded-2xl p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-[#797583]">Budget Items Imported:</span>
                  <span className="font-semibold text-[#181c23]">{successResult.budgetItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#797583]">Checklist Tasks Created:</span>
                  <span className="font-semibold text-[#181c23]">{successResult.tasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#797583]">Custom Ideas Added:</span>
                  <span className="font-semibold text-[#181c23]">{successResult.ideas}</span>
                </div>
              </div>
              <Button onClick={onClose} className="w-full">
                Return to Workspace
              </Button>
            </div>
          ) : (
            <>
              {/* SUMMARY TAB */}
              {activeTab === "summary" && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-[#eae6df] space-y-3">
                    <span className="text-[11px] font-heading font-semibold text-[#5a4bac] uppercase tracking-wider">
                      Event Title & Concept
                    </span>
                    <h4 className="font-heading font-bold text-lg text-[#181c23]">
                      {plan.eventSummary.title}
                    </h4>
                    <p className="text-xs text-[#484552] leading-relaxed">
                      {plan.eventSummary.concept}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#eae6df] space-y-3">
                    <span className="text-[11px] font-heading font-semibold text-[#5a4bac] uppercase tracking-wider">
                      Theme & Curated Color Palette
                    </span>
                    <p className="text-xs font-semibold text-[#181c23]">{plan.eventSummary.theme}</p>
                    <div className="flex items-center gap-3 pt-1">
                      {plan.eventSummary.colorPalette.map((color, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[11px] font-mono text-[#797583]">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#eae6df] space-y-3">
                    <span className="text-[11px] font-heading font-semibold text-[#5a4bac] uppercase tracking-wider">
                      Planning Assumptions
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#484552]">
                      {plan.eventSummary.planningAssumptions.map((assump, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#5a4bac] font-bold">•</span>
                          <span>{assump}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* BUDGET TAB */}
              {activeTab === "budget" && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-[#eae6df] flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-[#797583] block">Total Event Budget:</span>
                      <span className="font-bold text-base text-[#181c23]">
                        {currency}{plan.metadata.totalBudget.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#797583] block">AI Allocated Total:</span>
                      <span className="font-bold text-base text-[#5a4bac]">
                        {currency}{plan.metadata.totalEstimatedCost.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#797583] block">Safety Contingency:</span>
                      <span className="font-bold text-base text-[#466557]">
                        {currency}{plan.metadata.contingencyReserved.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#797583] block">Status:</span>
                      <Badge
                        variant={plan.metadata.budgetHealth === "infeasible" ? "danger" : "sage"}
                        size="sm"
                      >
                        {plan.metadata.budgetHealth.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.budget.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-2xl border border-[#eae6df] hover:border-[#dcd6cc] transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h5 className="font-heading font-semibold text-xs text-[#181c23]">
                              {item.category}
                            </h5>
                            <Badge
                              variant={
                                item.costConfidence === "high"
                                  ? "sage"
                                  : item.costConfidence === "medium"
                                  ? "warning"
                                  : "danger"
                              }
                              size="sm"
                            >
                              {item.costConfidence} confidence
                            </Badge>
                          </div>
                          <span className="font-bold font-mono text-sm text-[#181c23]">
                            {currency}{item.estimatedAmount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#484552]">{item.rationale}</p>
                        <p className="text-[11px] text-[#797583] italic">
                          Assumption: {item.costAssumptions}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === "timeline" && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#ede9fe]/40 rounded-xl border border-[#dcd6cc] text-xs text-[#5a4bac] flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                      Milestones are scheduled relative to your event date. All imported tasks start in <strong>Pending</strong> status.
                    </span>
                  </div>
                  {plan.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="font-heading font-semibold text-xs text-[#181c23]">
                            {item.taskTitle}
                          </h5>
                          <TaskPriorityBadge priority={item.priority} size="sm" />
                        </div>
                        <span className="text-xs font-mono font-medium text-[#797583]">
                          Target: {item.suggestedDueDate}
                        </span>
                      </div>
                      <p className="text-xs text-[#484552]">{item.description}</p>
                      {item.dependencies.length > 0 && (
                        <div className="text-[11px] text-[#797583] flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          <span>Requires: {item.dependencies.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* VENDORS TAB */}
              {activeTab === "vendors" && (
                <div className="space-y-3">
                  {plan.vendorChecklist.map((vendor, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-semibold text-xs text-[#181c23]">
                            {vendor.vendorCategory}
                          </span>
                          <TaskPriorityBadge priority={vendor.bookingPriority} size="sm" />
                        </div>
                      </div>
                      <p className="text-xs text-[#484552]">{vendor.requirements}</p>
                      <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#eae6df] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#797583]">
                          Key Questions to Ask:
                        </span>
                        <ul className="text-xs text-[#484552] space-y-1">
                          {vendor.questionsToAsk.map((q, qIdx) => (
                            <li key={qIdx} className="flex items-start gap-1.5">
                              <HelpCircle className="w-3 h-3 text-[#5a4bac] shrink-0 mt-0.5" />
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* IDEAS TAB */}
              {activeTab === "ideas" && (
                <div className="space-y-3">
                  {plan.personalizedIdeas.map((idea, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-heading font-semibold text-xs text-[#181c23]">
                          {idea.title}
                        </h5>
                        <span className="text-xs font-mono font-bold text-[#5a4bac]">
                          {currency}{idea.estimatedCost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#484552]">{idea.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {idea.materialsOrPreparationRequired.map((mat, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-[10px] bg-[#faf9f6] border border-[#eae6df] px-2 py-0.5 rounded-md text-[#797583]"
                          >
                            {mat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RISKS TAB */}
              {activeTab === "risks" && (
                <div className="space-y-3">
                  {plan.risksAndBackups.map((risk, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#884a0f] shrink-0 mt-0.5" />
                        <h5 className="font-heading font-semibold text-xs text-[#181c23]">
                          {risk.risk}
                        </h5>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#eae6df]">
                          <span className="text-[10px] font-bold text-[#466557] uppercase tracking-wider block mb-1">
                            Mitigation Measure:
                          </span>
                          <p className="text-[#484552]">{risk.mitigation}</p>
                        </div>
                        <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#eae6df]">
                          <span className="text-[10px] font-bold text-[#5a4bac] uppercase tracking-wider block mb-1">
                            Fallback Backup Option:
                          </span>
                          <p className="text-[#484552]">{risk.backupOption}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer with Selective Import Controls */}
        {!successResult && (
          <div className="p-4 sm:p-6 border-t border-[#eae6df] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Selective Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-heading font-semibold text-[#181c23]">Import to:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyOptions.applySummary}
                  onChange={(e) =>
                    setApplyOptions((prev) => ({ ...prev, applySummary: e.target.checked }))
                  }
                  className="rounded text-[#5a4bac] focus:ring-[#5a4bac]"
                />
                <span className="text-[#484552]">Summary</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyOptions.applyBudget}
                  onChange={(e) =>
                    setApplyOptions((prev) => ({ ...prev, applyBudget: e.target.checked }))
                  }
                  className="rounded text-[#5a4bac] focus:ring-[#5a4bac]"
                />
                <span className="text-[#484552]">Budget ({plan.budget.length})</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyOptions.applyTasks}
                  onChange={(e) =>
                    setApplyOptions((prev) => ({ ...prev, applyTasks: e.target.checked }))
                  }
                  className="rounded text-[#5a4bac] focus:ring-[#5a4bac]"
                />
                <span className="text-[#484552]">Tasks ({plan.timeline.length})</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyOptions.applyIdeas}
                  onChange={(e) =>
                    setApplyOptions((prev) => ({ ...prev, applyIdeas: e.target.checked }))
                  }
                  className="rounded text-[#5a4bac] focus:ring-[#5a4bac]"
                />
                <span className="text-[#484552]">Ideas ({plan.personalizedIdeas.length})</span>
              </label>
            </div>

            {/* Error message */}
            {errorMessage && (
              <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Button variant="ghost" onClick={onClose} disabled={isApplying}>
                Discard
              </Button>
              <Button
                onClick={handleApply}
                loading={isApplying}
                disabled={
                  !applyOptions.applySummary &&
                  !applyOptions.applyBudget &&
                  !applyOptions.applyTasks &&
                  !applyOptions.applyIdeas
                }
                leftIcon={<Check className="w-4 h-4" />}
              >
                Approve & Apply Plan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
