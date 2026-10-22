"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Sparkles, Send } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  time: string;
  suggestionAction?: {
    label: string;
    description?: string;
  };
}

export default function EventAssistantPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const msgCounter = React.useRef(10);

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "msg-1",
      sender: "assistant",
      text: "Namaste Priya! 🌸 I am Planora AI, your dedicated executive event copilot for Aarav & Meera's wedding. I have access to your Jaipur venue coordinates, ₹38,50,000 budget ledger, and vendor contracts. How can I assist you right now?",
      time: "10:14 AM",
    },
    {
      id: "msg-2",
      sender: "user",
      text: "What is our contingency plan if the Sangeet celebration on the open terrace faces rain or sound restrictions after 10 PM?",
      time: "10:15 AM",
    },
    {
      id: "msg-3",
      sender: "assistant",
      text: "Based on the palace architecture, we have two elegant measures:\n\n1. **Weather Transition:** The inner Sheesh Mahal Ballroom is reserved on hold at zero penalty. It accommodates all 350 guests with ambient chandelier lighting.\n2. **Sound Curfew:** Jaipur heritage regulations require dropping amplified decibels at 22:00. We recommend scheduling the high-energy Dhol and brass procession from 17:30 to 20:00, then moving into the ballroom for acoustic Sufi performances.\n\nWould you like me to update the day-of timeline checklist with this contingency sequence?",
      time: "10:15 AM",
      suggestionAction: {
        label: "Update Day-Of Timeline Schedule",
        description: "Shifts high-volume brass to 17:30 and logs Sheesh Mahal as secondary venue.",
      },
    },
  ]);

  const quickPrompts = [
    "Reallocate ₹50,000 from florals to photography",
    "Draft vendor contract inquiry for Sangeet DJ",
    "Calculate per-guest catering cost breakdown",
    "Review seating balance for 350 guests across 35 tables",
  ];

  function handleSend(promptText?: string) {
    const textToSend = promptText || input;
    if (!textToSend.trim()) return;

    const currentId = msgCounter.current++;
    const userMsg: Message = {
      id: `msg-${currentId}`,
      sender: "user",
      text: textToSend,
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I have analyzed your request against the active Jaipur event parameters. All metrics align with your designated budget and timeline goals.";
      let actionLabel: string | undefined = undefined;

      if (textToSend.toLowerCase().includes("reallocate") || textToSend.toLowerCase().includes("budget")) {
        reply = "I calculated the budget variance: shifting ₹50,000 reduces floral contingency from ₹65,000 to ₹15,000, while boosting Photography to ₹5,30,000 for an additional secondary drone operator. This remains strictly within your ₹38,50,000 total ceiling.";
        actionLabel = "Confirm ₹50,000 Ledger Adjustment";
      } else if (textToSend.toLowerCase().includes("draft") || textToSend.toLowerCase().includes("vendor")) {
        reply = "Here is an inquiry draft for Jaipur Sound Collective:\n\n'Dear Vikram, following our preliminary brief for Aarav & Meera’s Sangeet on Dec 14th, please confirm that your sound array includes decibel limiting for the 22:00 acoustic transition. Kindly confirm availability for load-in at 11:00 AM.'";
        actionLabel = "Copy Email Draft to Clipboard";
      } else if (textToSend.toLowerCase().includes("per-guest") || textToSend.toLowerCase().includes("catering")) {
        reply = "With 350 guests and total committed catering at ₹10,50,000 (including Royal Saffron banquet + welcome sarbat stations), your net per-head expenditure is ₹3,000 per guest. This is 8% below standard 5-star palace catering averages in Rajasthan.";
      }

      const aiId = msgCounter.current++;
      const aiMsg: Message = {
        id: `msg-${aiId}`,
        sender: "assistant",
        text: reply,
        time: "Just now",
        suggestionAction: actionLabel ? { label: actionLabel } : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1100);
  }

  function handleActionClick(actionText: string) {
    alert(`Planora Action Executed: "${actionText}". Blueprint updated.`);
  }

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

        {/* Chat Canvas */}
        <div className="rounded-3xl border border-[#eae6df] bg-white shadow-xs overflow-hidden flex flex-col h-[640px]">
          {/* Header */}
          <div className="p-4 border-b border-[#eae6df] bg-[#faf9f6] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#5a4bac] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-[#181c23]">
                  Planora AI Copilot Assistant
                </h3>
                <p className="text-[11px] text-[#797583]">
                  Grounded in event parameters, Rajasthan vendor rates, and budget ledger
                </p>
              </div>
            </div>

            <Badge variant="sage" size="sm">
              Live Copilot
            </Badge>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[#faf9f6]/40">
            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              return (
                <div
                  key={msg.id}
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
                    {isAssistant ? <Sparkles className="w-4 h-4" /> : "PS"}
                  </div>

                  <div className="space-y-2">
                    <div
                      className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? "bg-white border border-[#eae6df] text-[#181c23] shadow-xs"
                          : "bg-[#5a4bac] text-white"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>

                    {msg.suggestionAction && (
                      <div className="p-3 rounded-2xl bg-[#ede9fe] border border-[#dcd6cc] flex items-center justify-between gap-3 text-xs">
                        <span className="font-heading font-semibold text-[#5a4bac]">
                          {msg.suggestionAction.label}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleActionClick(msg.suggestionAction!.label)}
                        >
                          Execute
                        </Button>
                      </div>
                    )}

                    <span
                      className={`text-[10px] text-[#797583] block ${
                        isAssistant ? "text-left" : "text-right"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#5a4bac] font-heading font-semibold p-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Planora AI is analyzing coordinates and drafting response...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-4 py-2 border-t border-[#f5f4f0] bg-white flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="px-3 py-1.5 rounded-full bg-[#faf9f6] border border-[#eae6df] hover:bg-[#ede9fe] hover:border-[#dcd6cc] text-[11px] font-heading font-semibold text-[#484552] transition-colors whitespace-nowrap cursor-pointer"
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
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Planora AI to adjust budgets, generate contingency schedules, or draft vendor contracts..."
              className="flex-1 h-11 rounded-full border border-[#eae6df] bg-[#faf9f6] px-4 text-xs text-[#181c23] placeholder:text-[#797583] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac]"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="shrink-0"
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
