import { z } from "zod";
import { getGeminiClient, getGeminiModelName } from "./gemini";
import {
  getEventById,
  getEventBudgetItems,
  getEventTasksList,
  getEventVendorsWithDetails,
  updateEventRecord,
  createTaskRecord,
  bulkCreateTasks,
  createBudgetItemRecord,
  appendConversationMessage,
  updateMessageActionStatus,
} from "@/lib/db/services";
import { actionProposalSchema } from "@/lib/validation/schemas";
import type { ActionProposal, ConversationMessageModel, EventType } from "@/lib/types";
import { roundCurrency } from "@/lib/domain/budget";
import { isTaskOverdue } from "@/lib/domain/tasks";

export interface EventAssistantContext {
  eventId: string;
  title: string;
  type: EventType;
  date: string;
  daysRemaining: number;
  city: string;
  location: string;
  guestCount: number;
  currency: string;
  totalBudget: number;
  committedEstimated: number;
  actualSpent: number;
  remainingBalance: number;
  budgetCategories: Array<{ category: string; estimated: number; actual: number }>;
  taskSummary: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    upcomingNext7Days: Array<{
      id: string;
      title: string;
      dueDate: string;
      priority: string;
      status: string;
    }>;
  };
  vendorSummary: {
    total: number;
    booked: number;
    shortlisted: number;
    vendors: Array<{
      name: string;
      category: string;
      status: string;
      quotedAmount: number;
      estimatedAmount: number;
    }>;
  };
}

export const assistantChatResponseSchema = z.object({
  reply: z.string().min(1),
  suggestedPrompts: z.array(z.string()).min(1).max(5).default([
    "What should I finish this week?",
    "Suggest a vegetarian menu for 100 guests",
    "Reduce my budget by ₹30,000",
  ]),
  actionProposal: actionProposalSchema.nullable().optional(),
});

export type AssistantChatResponse = z.infer<typeof assistantChatResponseSchema>;

/**
 * Builds authorized, bounded context for the assistant without leaking whole database.
 */
export async function buildEventAssistantContext(
  eventId: string,
  ownerId: string
): Promise<EventAssistantContext> {
  const event = await getEventById(eventId, ownerId);
  const [budgetItems, tasks, eventVendors] = await Promise.all([
    getEventBudgetItems(eventId, ownerId),
    getEventTasksList(eventId, ownerId),
    getEventVendorsWithDetails(eventId, ownerId),
  ]);

  const now = new Date();
  const eventDateObj = new Date(event.date);
  const diffTime = eventDateObj.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const totalEstimated = roundCurrency(budgetItems.reduce((acc, item) => acc + item.estimatedAmount, 0));
  const totalActual = roundCurrency(budgetItems.reduce((acc, item) => acc + item.actualAmount, 0));
  const remainingBalance = roundCurrency(event.totalBudget - totalActual);

  const budgetCategories = budgetItems.slice(0, 10).map((b) => ({
    category: b.category,
    estimated: b.estimatedAmount,
    actual: b.actualAmount,
  }));

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const overdueTasks = pendingTasks.filter((t) => isTaskOverdue(t.dueDate, t.status));

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysStr = sevenDaysFromNow.toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const upcomingNext7Days = pendingTasks
    .filter((t) => t.dueDate >= todayStr && t.dueDate <= sevenDaysStr)
    .slice(0, 5)
    .map((t) => ({
      id: t._id?.toString() || "",
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
    }));

  const bookedVendors = eventVendors.filter(
    (ev) => ev.bookingStatus === "booked" || ev.bookingStatus === "completed"
  );
  const shortlistedVendors = eventVendors.filter(
    (ev) => ev.bookingStatus === "shortlisted" || ev.bookingStatus === "contacted"
  );

  const vendorList = eventVendors.slice(0, 8).map((ev) => ({
    name: ev.vendor?.name || "Vendor Partner",
    category: ev.vendor?.category || "Services",
    status: ev.bookingStatus,
    quotedAmount: ev.quotedAmount,
    estimatedAmount: Number(ev.estimatedAmount || 0),
  }));

  return {
    eventId,
    title: event.title,
    type: event.type,
    date: event.date,
    daysRemaining,
    city: event.preferences?.city || event.location || "Jaipur",
    location: event.location || "",
    guestCount: event.guestCount || 100,
    currency: event.currency || "₹",
    totalBudget: event.totalBudget,
    committedEstimated: totalEstimated,
    actualSpent: totalActual,
    remainingBalance,
    budgetCategories,
    taskSummary: {
      total: tasks.length,
      pending: pendingTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      upcomingNext7Days,
    },
    vendorSummary: {
      total: eventVendors.length,
      booked: bookedVendors.length,
      shortlisted: shortlistedVendors.length,
      vendors: vendorList,
    },
  };
}

/**
 * Generates contextual assistant response using Gemini API with controlled proposal workflow.
 */
export async function generateAssistantChatResponse(params: {
  eventContext: EventAssistantContext;
  recentHistory: ConversationMessageModel[];
  userMessage: string;
  timeoutMs?: number;
}): Promise<AssistantChatResponse> {
  const { eventContext, recentHistory, userMessage, timeoutMs = 60000 } = params;
  const client = getGeminiClient();
  const modelName = getGeminiModelName();

  const systemInstruction = `You are Planora AI, an executive, culturally-grounded, proactive AI event planning copilot.
You have real-time access to the user's authorized event parameters.

CURRENT AUTHORIZED EVENT CONTEXT:
- Title: "${eventContext.title}" (${eventContext.type})
- Date: ${eventContext.date} (${eventContext.daysRemaining} days remaining)
- Location: ${eventContext.city}, ${eventContext.location}
- Guests: ${eventContext.guestCount} pax
- Currency: ${eventContext.currency}
- Total Authorized Budget: ${eventContext.currency}${eventContext.totalBudget.toLocaleString()}
- Committed Estimated: ${eventContext.currency}${eventContext.committedEstimated.toLocaleString()}
- Actual Spent: ${eventContext.currency}${eventContext.actualSpent.toLocaleString()}
- Remaining Balance: ${eventContext.currency}${eventContext.remainingBalance.toLocaleString()}
- Budget Categories: ${JSON.stringify(eventContext.budgetCategories)}
- Tasks Overview: ${eventContext.taskSummary.total} total (${eventContext.taskSummary.pending} pending, ${eventContext.taskSummary.completed} completed, ${eventContext.taskSummary.overdue} overdue)
- Upcoming Deadlines (Next 7 Days): ${JSON.stringify(eventContext.taskSummary.upcomingNext7Days)}
- Vendors: ${eventContext.vendorSummary.total} registered (${eventContext.vendorSummary.booked} booked, ${eventContext.vendorSummary.shortlisted} shortlisted)
- Vendor Quotations: ${JSON.stringify(eventContext.vendorSummary.vendors)}

COMMUNICATION GUIDELINES:
1. Friendly, concise, executive, and practical.
2. Ground all facts in the active event context above. Never invent facts about the user's event.
3. Language support: You fluently understand English and Hindi/Hinglish (e.g. Shaadi, Sangeet, Mehendi, Pooja, Lakhs, Crores, Haldi, Mandap, Chaat, etc.). When addressed in Hindi or Hinglish, reply with warmth and respect using appropriate Hinglish or English as desired.
4. CONTROLLED PROPOSAL-AND-CONFIRMATION WORKFLOW (CRITICAL):
   - For simple informational questions (such as "Suggest a vegetarian menu for 100 guests", "What should I finish this week?", "Suggest a backup plan for rain", "Help me compare these vendor quotations"):
     Answer directly, thoroughly, and helpfully in "reply". "actionProposal" MUST be null.
   - For data-changing requests (such as "Reduce my budget by ₹30,000", "Increase budget by ₹50,000", "Add a task to call the florist", "Create a checklist for the final seven days", "Add a contingency reserve"):
     * In "reply", explain clearly what change you are proposing and ask the user to confirm the preview.
     * NEVER claim the change has already taken effect in the database! (e.g. Say "I have prepared a proposal to reduce your budget by ₹30,000. Please review the preview below and confirm." NEVER say "I have reduced your budget.")
     * Attach a structured "actionProposal" object matching this format:
       {
         "type": "REDUCE_BUDGET" | "INCREASE_BUDGET" | "CREATE_TASK" | "CREATE_CHECKLIST" | "ADD_BUDGET_ITEM",
         "description": "Short explanation of proposed change",
         "preview": {
           "title": "Action title",
           "before": "Current value (optional)",
           "after": "Proposed new value (optional)",
           "details": {} or [] (optional details)
         },
         "payload": {
           // For REDUCE_BUDGET or INCREASE_BUDGET: { "amount": number }
           // For CREATE_TASK: { "title": string, "dueDate": "YYYY-MM-DD", "priority": "low"|"medium"|"high"|"urgent", "description": string }
           // For CREATE_CHECKLIST: { "tasks": [{ "title": string, "dueDate": "YYYY-MM-DD", "priority": "high"|"urgent"|"medium", "description": string }] }
           // For ADD_BUDGET_ITEM: { "category": string, "description": string, "estimatedAmount": number }
         },
         "status": "pending"
       }
5. Always provide 2 to 4 contextual "suggestedPrompts" anticipating the user's next step.
6. Return ONLY valid JSON matching the schema. No markdown outside JSON.`;

  // Format bounded history
  const historyTurns = recentHistory.slice(-6).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const contents = [
    ...historyTurns,
    {
      role: "user",
      parts: [{ text: userMessage.slice(0, 1000) }],
    },
  ];

  const generatePromise = client.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
  });

  const timeoutPromise = new Promise<{ text?: string }>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Chat assistant request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  let response: { text?: string };
  try {
    response = await Promise.race([generatePromise, timeoutPromise]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new Error("AI copilot quota reached. Please retry in a few moments.");
    }
    if (msg.includes("timed out")) {
      throw new Error("AI copilot request timed out. Please try asking again.");
    }
    throw new Error(`AI assistant error: ${msg}`);
  }

  const responseText = response.text || "";
  try {
    const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const rawJson = JSON.parse(cleaned);
    const parsed = assistantChatResponseSchema.safeParse(rawJson);
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // Graceful fallback below
  }

  // Graceful fallback for non-JSON conversational replies
  return {
    reply: responseText.trim() || `Namaste! I am here to help you plan ${eventContext.title}. How would you like to adjust your budget, timeline, or vendors?`,
    suggestedPrompts: [
      "What should I finish this week?",
      "Suggest a vegetarian menu for 100 guests",
      "Reduce my budget by ₹30,000",
      "Suggest a backup plan for rain",
    ],
    actionProposal: null,
  };
}

export interface ActionResult {
  success: boolean;
  message: string;
  actionType: string;
  data?: Record<string, unknown>;
}

/**
 * Validates and executes an authorized data mutation proposed by the assistant after explicit user confirmation.
 * Never claims a mutation succeeded unless database write has succeeded.
 */
export async function executeAssistantAction(params: {
  eventId: string;
  ownerId: string;
  action: ActionProposal;
  messageId?: string;
}): Promise<ActionResult> {
  const { eventId, ownerId, action, messageId } = params;
  const event = await getEventById(eventId, ownerId);
  const currency = event.currency || "₹";

  switch (action.type) {
    case "REDUCE_BUDGET": {
      const reductionAmount = roundCurrency(Number(action.payload.amount || 0));
      if (reductionAmount <= 0) {
        throw new Error("Invalid budget reduction amount. Must be greater than zero.");
      }
      if (reductionAmount >= event.totalBudget) {
        throw new Error(
          `Cannot reduce budget by ${currency}${reductionAmount.toLocaleString()}. Current total budget is ${currency}${event.totalBudget.toLocaleString()}.`
        );
      }

      const newTotalBudget = roundCurrency(event.totalBudget - reductionAmount);
      await updateEventRecord(eventId, ownerId, { totalBudget: newTotalBudget });

      const confirmationContent = `✅ Budget reduction applied: Total event budget was reduced by ${currency}${reductionAmount.toLocaleString()} (from ${currency}${event.totalBudget.toLocaleString()} to ${currency}${newTotalBudget.toLocaleString()}).`;

      await appendConversationMessage(eventId, ownerId, "assistant", confirmationContent);
      if (messageId) {
        await updateMessageActionStatus(eventId, ownerId, messageId, "applied");
      }

      return {
        success: true,
        message: confirmationContent,
        actionType: action.type,
        data: {
          previousTotalBudget: event.totalBudget,
          newTotalBudget,
          reducedBy: reductionAmount,
        },
      };
    }

    case "INCREASE_BUDGET": {
      const increaseAmount = roundCurrency(Number(action.payload.amount || 0));
      if (increaseAmount <= 0) {
        throw new Error("Invalid budget increase amount. Must be greater than zero.");
      }

      const newTotalBudget = roundCurrency(event.totalBudget + increaseAmount);
      await updateEventRecord(eventId, ownerId, { totalBudget: newTotalBudget });

      const confirmationContent = `✅ Budget increase applied: Total event budget was increased by ${currency}${increaseAmount.toLocaleString()} (from ${currency}${event.totalBudget.toLocaleString()} to ${currency}${newTotalBudget.toLocaleString()}).`;

      await appendConversationMessage(eventId, ownerId, "assistant", confirmationContent);
      if (messageId) {
        await updateMessageActionStatus(eventId, ownerId, messageId, "applied");
      }

      return {
        success: true,
        message: confirmationContent,
        actionType: action.type,
        data: {
          previousTotalBudget: event.totalBudget,
          newTotalBudget,
          increasedBy: increaseAmount,
        },
      };
    }

    case "CREATE_TASK": {
      const title = String(action.payload.title || "").trim();
      if (!title || title.length < 2) {
        throw new Error("Task title must be at least 2 characters.");
      }
      const dueDate = String(action.payload.dueDate || event.date);
      const priority = (["low", "medium", "high", "urgent"].includes(String(action.payload.priority))
        ? action.payload.priority
        : "medium") as "low" | "medium" | "high" | "urgent";
      const description = String(action.payload.description || "Created via Planora AI Copilot").trim();

      const createdTask = await createTaskRecord(eventId, ownerId, {
        title,
        dueDate,
        priority,
        status: "pending",
        description,
      });

      const confirmationContent = `✅ Task created: "${title}" scheduled for ${dueDate} with ${priority} priority. Added to your task checklist in Pending status.`;

      await appendConversationMessage(eventId, ownerId, "assistant", confirmationContent);
      if (messageId) {
        await updateMessageActionStatus(eventId, ownerId, messageId, "applied");
      }

      return {
        success: true,
        message: confirmationContent,
        actionType: action.type,
        data: { createdTask },
      };
    }

    case "CREATE_CHECKLIST": {
      const rawTasks = Array.isArray(action.payload.tasks) ? action.payload.tasks : [];
      if (rawTasks.length === 0) {
        throw new Error("Checklist must contain at least one task.");
      }

      const tasksToInsert = rawTasks.map((t: Record<string, unknown>) => ({
        title: String(t.title || "Milestone Task").trim(),
        description: String(t.description || "Created via Planora AI checklist assistant").trim(),
        dueDate: String(t.dueDate || event.date),
        priority: (["low", "medium", "high", "urgent"].includes(String(t.priority))
          ? t.priority
          : "high") as "low" | "medium" | "high" | "urgent",
        status: "pending" as const,
      }));

      const createdTasks = await bulkCreateTasks(eventId, ownerId, tasksToInsert);
      const count = createdTasks.length;
      const confirmationContent = `✅ Checklist imported: Added ${count} milestone tasks for your countdown into your checklist with Pending status.`;

      await appendConversationMessage(eventId, ownerId, "assistant", confirmationContent);
      if (messageId) {
        await updateMessageActionStatus(eventId, ownerId, messageId, "applied");
      }

      return {
        success: true,
        message: confirmationContent,
        actionType: action.type,
        data: { count },
      };
    }

    case "ADD_BUDGET_ITEM": {
      const category = String(action.payload.category || "General Contingency").trim();
      const description = String(action.payload.description || "Added via Copilot Assistant").trim();
      const estimatedAmount = roundCurrency(Math.max(0, Number(action.payload.estimatedAmount || 0)));

      if (estimatedAmount <= 0) {
        throw new Error("Estimated allocation must be greater than zero.");
      }

      const createdItem = await createBudgetItemRecord(eventId, ownerId, {
        category,
        description,
        estimatedAmount,
        actualAmount: 0,
        paymentStatus: "unpaid",
      });

      const confirmationContent = `✅ Budget item created: Added "${category}" with planned allocation of ${currency}${estimatedAmount.toLocaleString()} to your budget manager.`;

      await appendConversationMessage(eventId, ownerId, "assistant", confirmationContent);
      if (messageId) {
        await updateMessageActionStatus(eventId, ownerId, messageId, "applied");
      }

      return {
        success: true,
        message: confirmationContent,
        actionType: action.type,
        data: { createdItem },
      };
    }

    default:
      throw new Error(`Unsupported action type: ${(action as ActionProposal).type}`);
  }
}
