"use client";

import {useState, useEffect, useRef, useCallback} from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Send,
  Wand2,
  AlertCircle,
  RotateCcw,
  Check,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AILoader } from "@/components/ui/AILoader";
import { PlanReviewModal } from "@/components/ai/PlanReviewModal";
import type { CompleteEventPlan } from "@/lib/ai/schemas";
import type { ActionProposal } from "@/lib/types";
import type { EventAssistantContext } from "@/lib/ai/assistant";

interface ChatMessage {
  _id?: string;
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  actionProposal?: ActionProposal;
  suggestedPrompts?: string[];
  createdAt?: string | Date;
}

export default function EventAssistantPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [eventContext, setEventContext] = useState<EventAssistantContext | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "What should I finish this week?",
    "Suggest a vegetarian menu for 100 guests",
    "Reduce my budget by ₹30,000",
    "Suggest a backup plan for rain",
    "Help me compare these vendor quotations",
    "Create a checklist for the final seven days",
  ]);

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  // AI Plan Generator State
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<CompleteEventPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planGenerationError, setPlanGenerationError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tempIdCounter = useRef(100);

  // Scroll to bottom when messages update
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Load chat history and event context
  const loadChatData = useCallback(async () => {
    setSendError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/chat`);
      const data = await res.json();

      if (res.ok && data.success) {
        setMessages(data.data.messages || []);
        if (data.data.eventContext) {
          setEventContext(data.data.eventContext);
        }
        if (data.data.suggestedPrompts && data.data.suggestedPrompts.length > 0) {
          setSuggestedPrompts(data.data.suggestedPrompts);
        }
      } else {
        // Fallback for demo ID
        const fallbackMsg: ChatMessage = {
          id: "demo-welcome",
          role: "assistant",
          content:
            "Namaste! 🌸 I am Planora AI, your executive event planning copilot. I am grounded in your Jaipur royal celebration parameters, budget ledger, and upcoming deadlines. How can I assist you right now?",
          suggestedPrompts: [
            "What should I finish this week?",
            "Suggest a vegetarian menu for 100 guests",
            "Reduce my budget by ₹30,000",
            "Suggest a backup plan for rain",
            "Help me compare these vendor quotations",
            "Create a checklist for the final seven days",
          ],
        };
        setMessages([fallbackMsg]);
      }
    } catch {
      // Graceful offline/demo fallback
      setMessages([
        {
          id: "demo-welcome",
          role: "assistant",
          content:
            "Namaste! 🌸 I am Planora AI, your executive event copilot. Grounded in Gemini generative intelligence, I can analyze your event parameters, calculate budget distributions, orchestrate timelines, and prepare controlled proposals. How can I assist you right now?",
        },
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [eventId]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch(`/api/events/${eventId}/chat`);
        const data = await res.json();
        if (!ignore && res.ok && data.success) {
          setMessages(data.data.messages || []);
          if (data.data.eventContext) {
            setEventContext(data.data.eventContext);
          }
          if (data.data.suggestedPrompts && data.data.suggestedPrompts.length > 0) {
            setSuggestedPrompts(data.data.suggestedPrompts);
          }
        }
      } catch {
        // fallback
      } finally {
        if (!ignore) setIsLoadingHistory(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [eventId]);

  // Send message
  async function handleSend(promptText?: string) {
    const textToSend = (promptText || input).trim();
    if (!textToSend || isTyping) return;

    // Check if user clicked full plan generator trigger
    if (
      textToSend.toLowerCase().includes("generate end-to-end") ||
      textToSend.toLowerCase().includes("generate complete plan")
    ) {
      handleGenerateFullPlan();
      setInput("");
      return;
    }

    setSendError(null);
    setLastFailedPrompt(null);
    setInput("");

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${tempIdCounter.current++}`,
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`/api/events/${eventId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to receive response from copilot");
      }

      const { assistantMessage, eventContext: updatedContext } = data.data;

      // Update messages with authoritative saved assistant message
      setMessages((prev) => [...prev, assistantMessage]);

      if (updatedContext) {
        setEventContext(updatedContext);
      }

      if (assistantMessage.suggestedPrompts && assistantMessage.suggestedPrompts.length > 0) {
        setSuggestedPrompts(assistantMessage.suggestedPrompts);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error contacting assistant";
      setSendError(errorMsg);
      setLastFailedPrompt(textToSend);
    } finally {
      setIsTyping(false);
    }
  }

  // Confirm and Execute an AI-proposed Action
  async function handleConfirmAction(action: ActionProposal, messageId?: string) {
    const actionKey = action.id || messageId || action.type;
    setExecutingActionId(actionKey);

    try {
      const res = await fetch(`/api/events/${eventId}/chat/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionProposal: action,
          messageId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to apply proposed action");
      }

      // Mark action proposal as applied in local state
      setMessages((prev) =>
        prev.map((msg) => {
          if ((msg._id || msg.id) === messageId && msg.actionProposal) {
            return {
              ...msg,
              actionProposal: {
                ...msg.actionProposal,
                status: "applied",
              },
            };
          }
          return msg;
        })
      );

      // Append confirmation message if returned
      if (data.data?.result?.message) {
        const confirmMsg: ChatMessage = {
          id: `applied-${tempIdCounter.current++}`,
          role: "assistant",
          content: data.data.result.message,
        };
        setMessages((prev) => [...prev, confirmMsg]);
      }

      // Synchronize live context metrics
      if (data.data?.eventContext) {
        setEventContext(data.data.eventContext);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error executing action");
    } finally {
      setExecutingActionId(null);
    }
  }

  // Dismiss an action proposal
  function handleDismissAction(messageId?: string) {
    if (!messageId) return;
    setMessages((prev) =>
      prev.map((msg) => {
        if ((msg._id || msg.id) === messageId && msg.actionProposal) {
          return {
            ...msg,
            actionProposal: {
              ...msg.actionProposal,
              status: "rejected",
            },
          };
        }
        return msg;
      })
    );
  }

  // Full Plan Generator Handler
  async function handleGenerateFullPlan() {
    setIsGeneratingPlan(true);
    setPlanGenerationError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/plan/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to generate AI event plan");
      }

      setGeneratedPlan(data.data.plan);
      setIsPlanModalOpen(true);
    } catch (err: unknown) {
      setPlanGenerationError(
        err instanceof Error ? err.message : "An unexpected error occurred while generating the plan"
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  function handlePlanApplied(counts: { budgetItems: number; tasks: number; ideas: number }) {
    const confirmationMsg: ChatMessage = {
      id: `plan-applied-${tempIdCounter.current++}`,
      role: "assistant",
      content: `🎉 Complete Blueprint Applied! I have successfully imported ${counts.budgetItems} budget allocations, ${counts.tasks} timeline milestones, and ${counts.ideas} creative concepts into your event workspace. You can now track them across the Budget, Tasks, and Ideas tabs.`,
    };
    setMessages((prev) => [...prev, confirmationMsg]);
    loadChatData();
  }

  const currency = eventContext?.currency || "₹";

  return (
    <AppShell
      activeEventTitle={eventContext?.title || "Aarav & Meera Wedding Celebration"}
      activeEventLocation={eventContext?.city ? `${eventContext.city}, Dec 2026` : "Jaipur, Dec 2026"}
      eventId={eventId}
    >
      <div className="space-y-6">
        <EventWorkspaceHeader
          id={eventId}
          title={eventContext?.title || ""}
          type={eventContext?.type || "wedding"}
          status="confirmed"
          date={eventContext?.date || ""}
          daysRemaining={eventContext?.daysRemaining ?? 0}
          location={eventContext?.location || ""}
          guestCount={eventContext?.guestCount ?? 0}
          budgetTotal={eventContext?.totalBudget ?? 0}
          currency={currency}
        />

        {/* AI Plan Generation Action Banner */}
        <div className="bg-gradient-to-r from-[#5a4bac] to-[#7364c7] rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c5e7d6] animate-pulse" />
              <h3 className="font-heading font-bold text-base md:text-lg">
                Gemini 3.8 Planning Copilot Active
              </h3>
            </div>
            <p className="text-xs text-white/80 max-w-xl leading-relaxed">
              Have conversational questions or want to adjust parameters? Ask questions below, or synthesize a complete end-to-end blueprint with budget allocations, scheduled timeline, vendor checklist, and risk mitigations.
            </p>
          </div>
          <Button
            onClick={handleGenerateFullPlan}
            isLoading={isGeneratingPlan}
            className="bg-white text-[#5a4bac] hover:bg-[#faf9f6] shrink-0 font-bold shadow-sm cursor-pointer"
            leftIcon={<Wand2 className="w-4 h-4 text-[#5a4bac]" />}
          >
            Generate Complete AI Blueprint
          </Button>
        </div>

        {/* Live Context KPI Metrics Bar */}
        {eventContext && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-[#eae6df] shadow-2xs text-xs">
            <div>
              <span className="text-[#797583] block text-[11px] font-heading">Total Budget</span>
              <span className="font-bold text-[#181c23] text-sm">
                {currency}{eventContext.totalBudget.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#797583] block text-[11px] font-heading">Actual Spent</span>
              <span className="font-bold text-[#5a4bac] text-sm">
                {currency}{eventContext.actualSpent.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#797583] block text-[11px] font-heading">Remaining Balance</span>
              <span className="font-bold text-[#466557] text-sm">
                {currency}{eventContext.remainingBalance.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#797583] block text-[11px] font-heading">Tasks Status</span>
              <span className="font-bold text-[#181c23] text-sm">
                {eventContext.taskSummary.pending} pending ({eventContext.taskSummary.overdue} overdue)
              </span>
            </div>
          </div>
        )}

        {/* Error notification if plan generation fails */}
        {planGenerationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{planGenerationError}</span>
          </div>
        )}

        {/* Chat Canvas */}
        <div className="rounded-3xl border border-[#eae6df] bg-white shadow-xs overflow-hidden flex flex-col h-[640px]">
          {/* Header */}
          <div className="p-4 border-b border-[#eae6df] bg-[#faf9f6] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#5a4bac] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-[#181c23] flex items-center gap-2">
                  Planora AI Conversational Copilot
                  <Badge variant="sage" size="sm">
                    English & Hindi
                  </Badge>
                </h3>
                <p className="text-[11px] text-[#797583]">
                  Grounded in authorized MongoDB ledger, tasks, and verified vendor quotes
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadChatData}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh Context
            </Button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[#faf9f6]/40">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full text-xs text-[#797583] gap-2">
                <Sparkles className="w-4 h-4 text-[#5a4bac] animate-spin" />
                <span>Loading conversation history and event context...</span>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isAssistant = msg.role === "assistant";
                const messageId = msg._id || msg.id || `msg-${index}`;
                const hasProposal = Boolean(msg.actionProposal);
                const proposal = msg.actionProposal;

                return (
                  <div
                    key={messageId}
                    className={`flex gap-3 max-w-2xl ${
                      isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isAssistant
                          ? "bg-[#5a4bac] text-white shadow-2xs"
                          : "bg-[#466557] text-white"
                      }`}
                    >
                      {isAssistant ? <Sparkles className="w-4 h-4" /> : "ME"}
                    </div>

                    <div className="space-y-2.5 max-w-xl">
                      {/* Message Bubble */}
                      <div
                        className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                          isAssistant
                            ? "bg-white border border-[#eae6df] text-[#181c23] shadow-xs"
                            : "bg-[#5a4bac] text-white"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>

                      {/* Controlled Action Proposal Preview Card */}
                      {hasProposal && proposal && (
                        <div className="rounded-2xl border border-[#dcd6cc] bg-gradient-to-br from-[#faf9f6] via-white to-[#ede9fe]/30 p-4 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-lg bg-[#ede9fe] text-[#5a4bac]">
                                {proposal.type === "REDUCE_BUDGET" ? (
                                  <TrendingDown className="w-4 h-4" />
                                ) : proposal.type === "INCREASE_BUDGET" ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : proposal.type === "CREATE_CHECKLIST" ? (
                                  <Layers className="w-4 h-4" />
                                ) : (
                                  <Calendar className="w-4 h-4" />
                                )}
                              </span>
                              <span className="text-[11px] font-heading font-bold text-[#5a4bac] uppercase tracking-wider">
                                Action Proposal: {proposal.type.replace(/_/g, " ")}
                              </span>
                            </div>

                            <Badge
                              variant={
                                proposal.status === "applied"
                                  ? "sage"
                                  : proposal.status === "rejected"
                                  ? "peach"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {proposal.status === "applied"
                                ? "Applied to Workspace"
                                : proposal.status === "rejected"
                                ? "Dismissed"
                                : "Awaiting Confirmation"}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <h5 className="font-heading font-semibold text-xs text-[#181c23]">
                              {proposal.preview.title}
                            </h5>
                            <p className="text-xs text-[#484552]">{proposal.description}</p>
                          </div>

                          {/* Before vs After Metric Comparison */}
                          {(proposal.preview.before !== undefined || proposal.preview.after !== undefined) && (
                            <div className="p-3 bg-white rounded-xl border border-[#eae6df] flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[#797583] block text-[10px]">Current Total</span>
                                <span className="font-semibold text-[#181c23]">
                                  {typeof proposal.preview.before === "number"
                                    ? `${currency}${proposal.preview.before.toLocaleString()}`
                                    : proposal.preview.before}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-[#797583]" />
                              <div>
                                <span className="text-[#797583] block text-[10px]">Proposed New Total</span>
                                <span className="font-bold text-[#5a4bac]">
                                  {typeof proposal.preview.after === "number"
                                    ? `${currency}${proposal.preview.after.toLocaleString()}`
                                    : proposal.preview.after}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Checklist preview if present */}
                          {proposal.type === "CREATE_CHECKLIST" && Array.isArray(proposal.payload.tasks) && (
                            <div className="bg-white p-3 rounded-xl border border-[#eae6df] space-y-1 text-xs">
                              <span className="text-[10px] font-bold text-[#797583] uppercase tracking-wider block">
                                Countdown Milestones:
                              </span>
                              <ul className="space-y-1">
                                {(proposal.payload.tasks as Array<{ title: string; dueDate?: string }>).map((t, tIdx) => (
                                  <li key={tIdx} className="flex items-center justify-between text-[#484552]">
                                    <span className="truncate">• {t.title}</span>
                                    <span className="text-[10px] font-mono text-[#797583] shrink-0 ml-2">
                                      {t.dueDate}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Controlled Approval Action Buttons */}
                          {proposal.status === "pending" && (
                            <div className="pt-1 flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismissAction(messageId)}
                              >
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                isLoading={executingActionId === messageId}
                                onClick={() => handleConfirmAction(proposal, messageId)}
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                              >
                                Confirm & Apply Mutation
                              </Button>
                            </div>
                          )}

                          {proposal.status === "applied" && (
                            <div className="text-[11px] text-[#466557] font-semibold flex items-center gap-1.5 pt-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#466557]" />
                              <span>Mutation confirmed and recorded in MongoDB.</span>
                            </div>
                          )}
                        </div>
                      )}

                      <span
                        className={`text-[10px] text-[#797583] block ${
                          isAssistant ? "text-left" : "text-right"
                        }`}
                      >
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#5a4bac] font-heading font-semibold p-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Planora AI is analyzing coordinates and calculating proposal...</span>
              </div>
            )}

            {/* Inline Error & Retry Notification */}
            {sendError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{sendError}</span>
                </div>
                {lastFailedPrompt && (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => handleSend(lastFailedPrompt)}
                    leftIcon={<RotateCcw className="w-3 h-3" />}
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Contextual Prompt Pills */}
          <div className="px-4 py-2 border-t border-[#f5f4f0] bg-white flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span className="text-[10px] font-heading font-bold text-[#797583] uppercase tracking-wider shrink-0">
              Suggested:
            </span>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={isTyping}
                className="px-3 py-1.5 rounded-full bg-[#faf9f6] border border-[#eae6df] hover:bg-[#ede9fe] hover:border-[#dcd6cc] text-[11px] font-heading font-semibold text-[#484552] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-[#eae6df] bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask anything, e.g. 'Reduce my budget by ₹30,000', 'Suggest rain backup', '7-day checklist'..."
              className="flex-1 h-11 rounded-full border border-[#eae6df] bg-[#faf9f6] px-4 text-xs text-[#181c23] placeholder:text-[#797583] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac]"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="shrink-0"
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Generation Overlay Loader */}
      {isGeneratingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <AILoader
            title="Synthesizing Complete Event Blueprint"
            subtitle="Planora AI & Gemini are calculating optimal budget splits, verifying date constraints, and compiling vendor roadmaps."
            progressPercent={65}
            currentStepIndex={1}
          />
        </div>
      )}

      {/* Plan Review & Approval Modal */}
      <PlanReviewModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        eventId={eventId}
        plan={generatedPlan}
        onPlanApplied={handlePlanApplied}
      />
    </AppShell>
  );
}
