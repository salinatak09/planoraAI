"use client";

import * as React from "react";
import {
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  ShieldAlert,
  RotateCcw,
  Check,
  X,
  History,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ChangeProposal } from "@/lib/types";

interface ChangeImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  initialEvent: {
    title: string;
    guestCount: number;
    totalBudget: number;
    currency: string;
    date: string;
    location: string;
    theme: string;
    version?: number;
  };
  onChangesApplied?: (newVersion: number) => void;
}

export function ChangeImpactModal({
  isOpen,
  onClose,
  eventId,
  initialEvent,
  onChangesApplied,
}: ChangeImpactModalProps) {
  // Proposed Changes Input State
  const [guestCount, setGuestCount] = React.useState<number>(initialEvent.guestCount);
  const [totalBudget, setTotalBudget] = React.useState<number>(initialEvent.totalBudget);
  const [eventDate, setEventDate] = React.useState<string>(initialEvent.date);
  const [location, setLocation] = React.useState<string>(initialEvent.location);
  const [theme, setTheme] = React.useState<string>(initialEvent.theme);

  // Proposal State
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [proposal, setProposal] = React.useState<ChangeProposal | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);

  // Apply Adjustment Options
  const [applyBudgetAdjustments, setApplyBudgetAdjustments] = React.useState(true);
  const [applyTaskReschedules, setApplyTaskReschedules] = React.useState(true);
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = React.useState(false);
  const [applyError, setApplyError] = React.useState<string | null>(null);
  const [isAppliedSuccess, setIsAppliedSuccess] = React.useState(false);
  const [appliedSummary, setAppliedSummary] = React.useState<string | null>(null);

  // History Tab / View
  const [viewMode, setViewMode] = React.useState<"analyze" | "history">("analyze");
  const [historyLogs, setHistoryLogs] = React.useState<Array<{
    version: number;
    timestamp: string;
    summary: string;
    appliedModifications?: {
      budgetAdjusted: boolean;
      tasksRescheduledCount: number;
      vendorsRequiringConfirmationCount: number;
    };
  }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  // Synchronize when initialEvent version/key changes without cascading renders
  const [prevSyncKey, setPrevSyncKey] = React.useState(`${initialEvent.date}-${initialEvent.guestCount}-${initialEvent.totalBudget}`);
  const currentSyncKey = `${initialEvent.date}-${initialEvent.guestCount}-${initialEvent.totalBudget}`;

  if (prevSyncKey !== currentSyncKey) {
    setPrevSyncKey(currentSyncKey);
    setGuestCount(initialEvent.guestCount);
    setTotalBudget(initialEvent.totalBudget);
    setEventDate(initialEvent.date);
    setLocation(initialEvent.location);
    setTheme(initialEvent.theme);
    setProposal(null);
    setAnalysisError(null);
    setApplyError(null);
    setIsAppliedSuccess(false);
  }

  // Load audit trail history
  async function loadHistory() {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/events/${eventId}/impact/history`);
      const data = await res.json();
      if (res.ok && data.success) {
        setHistoryLogs(data.data.changeLogs || []);
      }
    } catch {
      // background
    } finally {
      setIsLoadingHistory(false);
    }
  }

  // Analyze Change Impact
  async function handleAnalyze() {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setApplyError(null);
    setProposal(null);

    try {
      const payload: Record<string, unknown> = {};
      if (guestCount !== initialEvent.guestCount) payload.guestCount = guestCount;
      if (totalBudget !== initialEvent.totalBudget) payload.totalBudget = totalBudget;
      if (eventDate !== initialEvent.date) payload.date = eventDate;
      if (location !== initialEvent.location) payload.location = location;
      if (theme !== initialEvent.theme) payload.theme = theme;

      const res = await fetch(`/api/events/${eventId}/impact/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to analyze change impact");
      }

      const receivedProposal: ChangeProposal = data.data.proposal;
      setProposal(receivedProposal);

      // Initialize selected task IDs for rescheduling
      const allTaskIds = new Set(
        receivedProposal.timelineImpact.affectedTasks.map((t) => t.taskId)
      );
      setSelectedTaskIds(allTaskIds);
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : "Error analyzing changes");
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Apply Changes with Optimistic Concurrency Protection
  async function handleApply() {
    if (!proposal) return;
    setIsApplying(true);
    setApplyError(null);

    try {
      const payload = {
        proposalId: proposal.proposalId,
        baseVersion: proposal.baseVersion,
        changes: {
          guestCount: guestCount !== initialEvent.guestCount ? guestCount : undefined,
          totalBudget: totalBudget !== initialEvent.totalBudget ? totalBudget : undefined,
          date: eventDate !== initialEvent.date ? eventDate : undefined,
          location: location !== initialEvent.location ? location : undefined,
          theme: theme !== initialEvent.theme ? theme : undefined,
        },
        acceptedAdjustments: {
          applyBudgetAdjustments,
          applyTaskReschedules,
          selectedTaskIds: Array.from(selectedTaskIds),
        },
      };

      const res = await fetch(`/api/events/${eventId}/impact/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409) {
          throw new Error(
            data?.error?.message ||
              "Event version conflict: The plan was edited elsewhere. Please re-analyze impact."
          );
        }
        throw new Error(data?.error?.message || "Failed to apply replanning changes");
      }

      setIsAppliedSuccess(true);
      setAppliedSummary(data.data.appliedSummary?.summaryText || "Replanning applied successfully.");
      if (onChangesApplied) {
        onChangesApplied(data.data.newVersion);
      }
    } catch (err: unknown) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply changes");
    } finally {
      setIsApplying(false);
    }
  }

  function toggleTaskId(id: string) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (!isOpen) return null;

  const currency = initialEvent.currency || "₹";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#eae6df] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#eae6df] bg-[#faf9f6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5a4bac] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg text-[#181c23]">
                  AI Change Impact & Replanning
                </h3>
                <Badge variant="sage" size="sm">
                  v{initialEvent.version ?? 1}
                </Badge>
              </div>
              <p className="text-xs text-[#797583]">
                Evaluate the ripple effects of budget, guest, date, or location adjustments before updating the live workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (viewMode === "analyze") {
                  setViewMode("history");
                  loadHistory();
                } else {
                  setViewMode("analyze");
                }
              }}
              className="px-3 py-1.5 rounded-full border border-[#eae6df] text-xs font-heading font-semibold text-[#484552] hover:bg-[#eae6df] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              {viewMode === "analyze" ? "Change Audit Trail" : "Replanning Tool"}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#797583] hover:text-[#181c23] rounded-full hover:bg-[#eae6df] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#faf9f6]/30">
          {viewMode === "history" ? (
            /* CHANGE AUDIT TRAIL VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-sm text-[#181c23]">
                  Event Version Audit Trail
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={loadHistory}
                  leftIcon={<RotateCcw className="w-3 h-3" />}
                >
                  Refresh History
                </Button>
              </div>

              {isLoadingHistory ? (
                <div className="p-8 text-center text-xs text-[#797583]">Loading audit records...</div>
              ) : historyLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#797583] bg-white rounded-2xl border border-[#eae6df]">
                  No replanning changes recorded yet for this event.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-[#eae6df] shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-[#5a4bac]">
                          Version {log.version}
                        </span>
                        <span className="text-[#797583] text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-semibold text-[#181c23]">{log.summary}</p>
                      {log.appliedModifications && (
                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[#797583]">
                          {log.appliedModifications.budgetAdjusted && (
                            <span className="bg-[#ede9fe] text-[#5a4bac] px-2 py-0.5 rounded-md">
                              Budget Categories Reallocated
                            </span>
                          )}
                          {log.appliedModifications.tasksRescheduledCount > 0 && (
                            <span className="bg-[#c5e7d6] text-[#466557] px-2 py-0.5 rounded-md">
                              {log.appliedModifications.tasksRescheduledCount} Tasks Rescheduled
                            </span>
                          )}
                          {log.appliedModifications.vendorsRequiringConfirmationCount > 0 && (
                            <span className="bg-[#fee2e2] text-[#991b1b] px-2 py-0.5 rounded-md">
                              {log.appliedModifications.vendorsRequiringConfirmationCount} Vendors Flagged for Confirmation
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isAppliedSuccess ? (
            /* SUCCESS STATE */
            <div className="p-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#c5e7d6] text-[#466557] mx-auto flex items-center justify-center">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="font-heading font-bold text-xl text-[#181c23]">
                Changes Confirmed & Applied!
              </h4>
              <p className="text-xs text-[#797583] leading-relaxed">
                {appliedSummary}
              </p>
              <Button onClick={onClose} className="w-full">
                Return to Workspace
              </Button>
            </div>
          ) : (
            <>
              {/* STAGE 1: CONFIGURE PROPOSED MODIFICATIONS */}
              <div className="bg-white p-5 rounded-2xl border border-[#eae6df] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-[#181c23]">
                    1. Proposed Event Modifications
                  </h4>
                  <span className="text-[11px] text-[#797583]">
                    Change parameters to preview cross-cutting impact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  {/* Guest Count */}
                  <div className="space-y-1">
                    <label className="font-heading font-semibold text-[#181c23] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#5a4bac]" />
                      Guest Count
                    </label>
                    <input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full h-10 rounded-xl border border-[#eae6df] bg-[#faf9f6] px-3 font-semibold text-[#181c23]"
                    />
                    <span className="text-[10px] text-[#797583]">
                      Current: {initialEvent.guestCount} guests
                    </span>
                  </div>

                  {/* Total Budget */}
                  <div className="space-y-1">
                    <label className="font-heading font-semibold text-[#181c23] flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#5a4bac]" />
                      Total Budget ({currency})
                    </label>
                    <input
                      type="number"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-10 rounded-xl border border-[#eae6df] bg-[#faf9f6] px-3 font-semibold text-[#181c23]"
                    />
                    <span className="text-[10px] text-[#797583]">
                      Current: {currency}{initialEvent.totalBudget.toLocaleString()}
                    </span>
                  </div>

                  {/* Event Date */}
                  <div className="space-y-1">
                    <label className="font-heading font-semibold text-[#181c23] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5a4bac]" />
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#eae6df] bg-[#faf9f6] px-3 font-semibold text-[#181c23]"
                    />
                    <span className="text-[10px] text-[#797583]">
                      Current: {initialEvent.date}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-heading font-semibold text-[#181c23]">
                      Location & Venue
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#eae6df] bg-[#faf9f6] px-3 text-[#181c23]"
                    />
                  </div>

                  {/* Theme */}
                  <div className="space-y-1">
                    <label className="font-heading font-semibold text-[#181c23]">
                      Aesthetic Theme
                    </label>
                    <input
                      type="text"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#eae6df] bg-[#faf9f6] px-3 text-[#181c23]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#f5f4f0]">
                  <span className="text-[11px] text-[#797583]">
                    {guestCount === initialEvent.guestCount &&
                    totalBudget === initialEvent.totalBudget &&
                    eventDate === initialEvent.date &&
                    location === initialEvent.location &&
                    theme === initialEvent.theme
                      ? "No modifications made yet"
                      : "Modifications ready for AI impact assessment"}
                  </span>
                  <Button
                    onClick={handleAnalyze}
                    isLoading={isAnalyzing}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Analyze Change Impact
                  </Button>
                </div>
              </div>

              {analysisError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* STAGE 2: STRUCTURED PROPOSAL & IMPACT PREVIEW */}
              {proposal && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Summary Callout Banner */}
                  <div className="bg-gradient-to-r from-[#5a4bac] to-[#7364c7] text-white p-5 rounded-2xl shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#c5e7d6]">
                        Executive AI Replanning Synthesis
                      </span>
                      <Badge variant="sage" size="sm">
                        Base Version {proposal.baseVersion}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-white/95">
                      {proposal.aiAnalysis.summary}
                    </p>
                  </div>

                  {/* Financial Feasibility & Metrics Before/After */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-1">
                      <span className="text-[#797583] block text-[11px]">Guest Count</span>
                      <div className="flex items-center gap-2 font-bold text-[#181c23]">
                        <span>{initialEvent.guestCount}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#797583]" />
                        <span className="text-[#5a4bac]">{guestCount}</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-1">
                      <span className="text-[#797583] block text-[11px]">Authorized Budget</span>
                      <div className="flex items-center gap-2 font-bold text-[#181c23]">
                        <span>{currency}{initialEvent.totalBudget.toLocaleString()}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#797583]" />
                        <span className="text-[#5a4bac]">{currency}{totalBudget.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-1">
                      <span className="text-[#797583] block text-[11px]">Projected Cost</span>
                      <div className="font-bold text-[#181c23] text-sm">
                        {currency}{proposal.financialImpact.projectedTotalCost.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-1">
                      <span className="text-[#797583] block text-[11px]">Feasibility Status</span>
                      <Badge
                        variant={proposal.financialImpact.isBudgetFeasible ? "sage" : "danger"}
                        size="sm"
                      >
                        {proposal.financialImpact.isBudgetFeasible ? "Balanced" : "Deficit Warning"}
                      </Badge>
                    </div>
                  </div>

                  {/* Deficit Alert if Applicable */}
                  {!proposal.financialImpact.isBudgetFeasible && proposal.financialImpact.deficitAmount && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-red-800">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold block">Financial Feasibility Deficit:</strong>
                        <span>
                          The proposed total budget is insufficient by {currency}
                          {proposal.financialImpact.deficitAmount.toLocaleString()} to cover either money already spent or commitments with the expanded scope. Review the trade-offs below.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Affected Budget Categories Table */}
                  {proposal.financialImpact.affectedBudgetCategories.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-[#eae6df] space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-heading font-bold text-xs text-[#181c23] flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#5a4bac]" />
                          Budget Categories Affected
                        </h5>
                        <label className="flex items-center gap-1.5 text-xs text-[#484552] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applyBudgetAdjustments}
                            onChange={(e) => setApplyBudgetAdjustments(e.target.checked)}
                            className="rounded text-[#5a4bac] focus:ring-[#5a4bac]"
                          />
                          <span>Apply Suggested Category Adjustments</span>
                        </label>
                      </div>

                      <div className="divide-y divide-[#f5f4f0] text-xs">
                        {proposal.financialImpact.affectedBudgetCategories.map((cat, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#181c23]">{cat.category}</span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    cat.isVerified
                                      ? "bg-[#c5e7d6] text-[#466557]"
                                      : "bg-[#ede9fe] text-[#5a4bac]"
                                  }`}
                                >
                                  {cat.isVerified ? "Verified Contract Fact" : "AI Benchmark Estimate"}
                                </span>
                              </div>
                              <p className="text-[#797583] text-[11px]">{cat.rationale}</p>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-mono font-semibold text-[#181c23]">
                                {currency}{cat.currentEstimated.toLocaleString()}
                                <ArrowRight className="inline w-3 h-3 mx-1 text-[#797583]" />
                                <span className="text-[#5a4bac]">
                                  {currency}{cat.suggestedNewEstimated.toLocaleString()}
                                </span>
                              </div>
                              <span
                                className={`text-[11px] font-bold ${
                                  cat.difference > 0 ? "text-red-600" : "text-[#466557]"
                                }`}
                              >
                                {cat.difference > 0 ? "+" : ""}
                                {currency}{cat.difference.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks Needing Rescheduling */}
                  {proposal.timelineImpact.affectedTasks.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-[#eae6df] space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-heading font-bold text-xs text-[#181c23] flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#5a4bac]" />
                          Tasks Recommended for Rescheduling ({proposal.timelineImpact.affectedTasks.length})
                        </h5>
                        <label className="flex items-center gap-1.5 text-xs text-[#484552] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applyTaskReschedules}
                            onChange={(e) => setApplyTaskReschedules(e.target.checked)}
                            className="rounded text-[#5a4bac] focus:ring-[#5a4bac]"
                          />
                          <span>Reschedule Selected Tasks</span>
                        </label>
                      </div>

                      <div className="divide-y divide-[#f5f4f0] text-xs max-h-48 overflow-y-auto custom-scrollbar">
                        {proposal.timelineImpact.affectedTasks.map((task) => (
                          <div key={task.taskId} className="py-2 flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={selectedTaskIds.has(task.taskId)}
                                onChange={() => toggleTaskId(task.taskId)}
                                disabled={!applyTaskReschedules}
                                className="rounded text-[#5a4bac] focus:ring-[#5a4bac]"
                              />
                              <span className="font-medium text-[#181c23] truncate">
                                {task.taskTitle}
                              </span>
                            </label>

                            <div className="flex items-center gap-2 font-mono text-[11px] text-[#797583] shrink-0">
                              <span>{task.currentDueDate}</span>
                              <ArrowRight className="w-3 h-3 text-[#797583]" />
                              <span className="text-[#5a4bac] font-semibold">{task.suggestedNewDueDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vendor Bookings Requiring Confirmation */}
                  {proposal.vendorImpact.vendorsRequiringConfirmation.length > 0 && (
                    <div className="bg-[#fffbeb] border border-[#fef3c7] p-5 rounded-2xl space-y-2.5 text-xs text-[#92400e]">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#b45309]" />
                        <strong className="font-heading font-bold">
                          Vendor Reconfirmations Required ({proposal.vendorImpact.vendorsRequiringConfirmation.length})
                        </strong>
                      </div>
                      <p className="text-[11px] text-[#78350f] leading-relaxed">
                        Moving the event date impacts your contracted bookings. Planora AI never automatically cancels external bookings. Reach out directly to verify calendar availability:
                      </p>
                      <ul className="space-y-1.5 pt-1">
                        {proposal.vendorImpact.vendorsRequiringConfirmation.map((v, i) => (
                          <li key={i} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#fde68a]">
                            <Info className="w-3.5 h-3.5 text-[#b45309] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-[#181c23]">{v.vendorName} ({v.category})</span>: {v.notes}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Strategic Trade-offs & Practical Alternatives */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Trade-offs */}
                    <div className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-2">
                      <span className="text-[10px] font-bold text-[#5a4bac] uppercase tracking-wider block">
                        Trade-offs & Sacrifices
                      </span>
                      <ul className="space-y-1.5 text-[#484552]">
                        {proposal.aiAnalysis.tradeoffs.map((t, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#5a4bac] font-bold">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Alternatives */}
                    <div className="bg-white p-4 rounded-2xl border border-[#eae6df] space-y-2">
                      <span className="text-[10px] font-bold text-[#466557] uppercase tracking-wider block">
                        Creative Alternatives Suggested
                      </span>
                      <div className="space-y-2">
                        {proposal.aiAnalysis.alternatives.map((alt, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-[#faf9f6] border border-[#eae6df] space-y-0.5">
                            <div className="flex items-center justify-between font-semibold text-[#181c23]">
                              <span>{alt.title}</span>
                              <span className="text-[10px] text-[#466557] font-bold font-mono">
                                {alt.estimatedSavingsOrCost}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#797583]">{alt.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {applyError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{applyError}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {viewMode === "analyze" && !isAppliedSuccess && (
          <div className="p-4 sm:p-6 border-t border-[#eae6df] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[#797583]">
              {proposal
                ? `Proposal verified against event version ${proposal.baseVersion}.`
                : "Configure changes and click Analyze."}
            </span>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button variant="ghost" onClick={onClose} disabled={isApplying}>
                Discard
              </Button>
              {proposal && (
                <Button
                  onClick={handleApply}
                  isLoading={isApplying}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Confirm & Apply Replanning Changes
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
