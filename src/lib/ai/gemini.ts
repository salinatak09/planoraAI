import { GoogleGenAI } from "@google/genai";
import type { AIIdea } from "@/lib/types";
import {
  planGenerationInputSchema,
  completeEventPlanSchema,
  type PlanGenerationInput,
  type CompleteEventPlan,
} from "./schemas";
import { roundCurrency } from "@/lib/domain/budget";

/**
 * Currently active and supported Gemini model configured through GEMINI_MODEL.
 * Never hardcodes outdated models; defaults to modern Gemini 3.8 Flash if not set.
 */
export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
}

export interface GenAIContentRequest {
  model: string;
  contents: unknown;
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface GenAIClientLike {
  models: {
    generateContent: (args: GenAIContentRequest) => Promise<{ text?: string | undefined }>;
  };
}

let activeGenAIClient: GoogleGenAI | null = null;
let mockGenAIClient: GenAIClientLike | null = null;

/**
 * Injects a mock client for automated unit and integration tests.
 * Prevents automated test runs from making live external network calls.
 */
export function setMockGenAIClient(mock: GenAIClientLike | null): void {
  mockGenAIClient = mock;
}

export function resetGenAIClient(): void {
  activeGenAIClient = null;
  mockGenAIClient = null;
}

/**
 * Initializes and retrieves the server-side Google GenAI client using GEMINI_API_KEY.
 * The key remains strictly server-side and is never exposed to browser bundles.
 */
export function getGeminiClient(): GenAIClientLike {
  if (mockGenAIClient) {
    return mockGenAIClient;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "AIzaSy..." || apiKey === "") {
    throw new Error("Missing or unconfigured GEMINI_API_KEY environment variable on server");
  }

  if (!activeGenAIClient) {
    activeGenAIClient = new GoogleGenAI({ apiKey });
  }

  return activeGenAIClient as unknown as GenAIClientLike;
}

/**
 * Basic in-memory rate limiter per user/IP to prevent quota exhaustion
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkPlanGenerationRateLimit(identifier: string, limit = 10, windowMs = 60000): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * Enforces authoritative semantic constraints in trusted application code:
 * 1. Budget: recalculates totals, verifies within totalBudget, adds contingency reserve,
 *    and formulates feasibility trade-offs if budget is exceeded.
 * 2. Timeline: rejects/clamps past dates for future events, handles short preparation periods,
 *    and prevents claiming tasks/vendors are already booked.
 * 3. Currency: respects user currency and tags all items as planning estimates.
 */
export function enforceSemanticPlanConstraints(
  rawPlan: Record<string, unknown>,
  input: PlanGenerationInput
): CompleteEventPlan {
  const totalBudget = roundCurrency(input.totalBudget);
  const currency = input.currency || "₹";

  // 1. Process & sanitize budget line items
  const rawBudget = Array.isArray(rawPlan.budget) ? rawPlan.budget : [];
  let sumAllocated = 0;
  let hasContingency = false;

  const processedBudget = rawBudget.map((item: Record<string, unknown>) => {
    const rawAmt = Number(item.estimatedAmount || 0);
    const estimatedAmount = roundCurrency(Math.max(0, rawAmt));
    sumAllocated = roundCurrency(sumAllocated + estimatedAmount);

    const category = String(item.category || "General").trim();
    if (category.toLowerCase().includes("contingency") || category.toLowerCase().includes("reserve")) {
      hasContingency = true;
    }

    return {
      category,
      estimatedAmount,
      rationale: String(item.rationale || `Planning envelope allocation for ${category}`),
      costConfidence: (["low", "medium", "high"].includes(String(item.costConfidence))
        ? item.costConfidence
        : "medium") as "low" | "medium" | "high",
      costAssumptions: String(item.costAssumptions || "Preliminary planning benchmark; actual vendor quotes may vary"),
    };
  });

  // Calculate contingency and budget health
  let contingencyReserved = 0;
  let budgetHealth: "balanced" | "over_budget" | "under_budget" | "infeasible" = "balanced";
  let infeasibilityTradeoffs: string | undefined = undefined;

  if (sumAllocated > totalBudget) {
    budgetHealth = "infeasible";
    const overrun = roundCurrency(sumAllocated - totalBudget);
    infeasibilityTradeoffs = `The requested scope and ${input.guestCount} guest requirements require an estimated ${currency}${sumAllocated.toLocaleString()}, which exceeds the authorized budget ceiling of ${currency}${totalBudget.toLocaleString()} by ${currency}${overrun.toLocaleString()}. Recommended adjustments: prioritize key elements (such as ${input.userPriorities?.slice(0, 2).join(", ") || "venue and catering"}) and scale back secondary decor or guest numbers to reconcile with the financial cap.`;
  } else {
    const remaining = roundCurrency(totalBudget - sumAllocated);
    if (!hasContingency && remaining > 0) {
      // Allocate remaining room or reasonable 5-10% buffer into explicit contingency
      contingencyReserved = remaining;
      processedBudget.push({
        category: "Contingency Safety Reserve",
        estimatedAmount: contingencyReserved,
        rationale: "Unallocated safety buffer reserved for unexpected overtime or weather contingencies",
        costConfidence: "high",
        costAssumptions: "Reserved buffer capital; held as unallocated planning funds",
      });
      sumAllocated = totalBudget;
      budgetHealth = "balanced";
    } else if (remaining === 0) {
      budgetHealth = "balanced";
    } else {
      budgetHealth = "under_budget";
      contingencyReserved = remaining;
    }
  }

  // 2. Process & sanitize timeline items
  const todayStr = new Date().toISOString().split("T")[0];
  const eventDateStr = String(input.eventDate || todayStr).split("T")[0];
  const isFutureEvent = eventDateStr >= todayStr;

  const nowUTC = new Date(`${todayStr}T00:00:00.000Z`);
  const eventUTC = new Date(`${eventDateStr}T00:00:00.000Z`);
  const prepDays = Math.ceil((eventUTC.getTime() - nowUTC.getTime()) / (1000 * 60 * 60 * 24));
  const rawTimeline = Array.isArray(rawPlan.timeline) ? rawPlan.timeline : [];

  const processedTimeline = rawTimeline.map((item: Record<string, unknown>, idx: number) => {
    let taskDateStr = String(item.suggestedDueDate || "").split("T")[0];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(taskDateStr)) {
      const fallbackDate = new Date(eventUTC);
      fallbackDate.setDate(fallbackDate.getDate() - Math.max(1, (idx + 1) * 3));
      taskDateStr = fallbackDate.toISOString().split("T")[0];
    }

    // Rule: Task cannot be after event date
    if (taskDateStr > eventDateStr) {
      taskDateStr = eventDateStr;
    }

    // Rule: For future events, task cannot be in the past
    if (isFutureEvent && taskDateStr < todayStr) {
      taskDateStr = todayStr;
    }

    // Rule: Handle events with very short preparation periods (<= 7 days)
    let priority = (["low", "medium", "high", "urgent"].includes(String(item.priority))
      ? item.priority
      : "medium") as "low" | "medium" | "high" | "urgent";

    if (prepDays <= 7 && priority === "medium") {
      priority = "high";
    }

    // Rule: Sanitize task title so it doesn't falsely claim to have already booked vendors or sent invitations
    let title = String(item.taskTitle || item.title || "Planning Milestone").trim();
    title = title
      .replace(/^booked\b/i, "Book")
      .replace(/^sent\b/i, "Send")
      .replace(/^confirmed\b/i, "Confirm")
      .replace(/^paid\b/i, "Pay");

    const rawDesc = String(item.description || "").trim();
    const description = rawDesc.length >= 5 ? rawDesc : "Milestone deliverable and preparation";

    return {
      taskTitle: title,
      description,
      suggestedDueDate: taskDateStr,
      priority,
      dependencies: Array.isArray(item.dependencies) ? item.dependencies.map(String) : [],
    };
  });

  // 3. Process Event Summary
  const rawSummary = (rawPlan.eventSummary && typeof rawPlan.eventSummary === "object")
    ? (rawPlan.eventSummary as Record<string, unknown>)
    : {};

  const processedSummary = {
    title: String(rawSummary.title || `${input.theme} ${input.eventType}`).trim(),
    concept: String(rawSummary.concept || `A bespoke ${input.eventType} celebration in ${input.city} accommodating ${input.guestCount} guests.`).trim(),
    theme: String(rawSummary.theme || input.theme).trim(),
    colorPalette: Array.isArray(rawSummary.colorPalette) && rawSummary.colorPalette.length >= 2
      ? rawSummary.colorPalette.map(String)
      : ["#5a4bac", "#466557", "#884a0f", "#eae6df"],
    planningAssumptions: Array.isArray(rawSummary.planningAssumptions) && rawSummary.planningAssumptions.length > 0
      ? rawSummary.planningAssumptions.map(String)
      : [`Planning designed for ${input.guestCount} guests in ${input.city}`, `Authorized total budget of ${currency}${totalBudget.toLocaleString()}`],
  };

  // 4. Process Vendor Checklist
  const rawVendors = Array.isArray(rawPlan.vendorChecklist) ? rawPlan.vendorChecklist : [];
  const processedVendors = rawVendors.map((v: Record<string, unknown>) => ({
    vendorCategory: String(v.vendorCategory || "General Vendor").trim(),
    requirements: String(v.requirements || "Standard professional service requirements").trim(),
    questionsToAsk: Array.isArray(v.questionsToAsk) && v.questionsToAsk.length > 0
      ? v.questionsToAsk.map(String)
      : ["What is your overtime policy and cancellation clause?", "Do you have backup equipment on site?"],
    bookingPriority: (["urgent", "high", "medium", "low"].includes(String(v.bookingPriority))
      ? v.bookingPriority
      : "high") as "urgent" | "high" | "medium" | "low",
  }));

  // 5. Process Personalized Ideas
  const rawIdeas = Array.isArray(rawPlan.personalizedIdeas) ? rawPlan.personalizedIdeas : [];
  const processedIdeas = rawIdeas.map((idea: Record<string, unknown>) => ({
    title: String(idea.title || "Custom Experiential Feature").trim(),
    description: String(idea.description || "Bespoke experiential concept").trim(),
    estimatedCost: roundCurrency(Math.max(0, Number(idea.estimatedCost || 0))),
    materialsOrPreparationRequired: Array.isArray(idea.materialsOrPreparationRequired) && idea.materialsOrPreparationRequired.length > 0
      ? idea.materialsOrPreparationRequired.map(String)
      : ["Advance coordinator briefing", "Vendor coordination"],
  }));

  // 6. Process Risks and Backups
  const rawRisks = Array.isArray(rawPlan.risksAndBackups) ? rawPlan.risksAndBackups : [];
  const processedRisks = rawRisks.map((r: Record<string, unknown>) => ({
    risk: String(r.risk || "Adverse weather or timeline delays").trim(),
    mitigation: String(r.mitigation || "Pre-arrange covered spaces and buffer periods").trim(),
    backupOption: String(r.backupOption || "Indoor backup pavilion reserved").trim(),
  }));

  const result = {
    eventSummary: processedSummary,
    budget: processedBudget,
    timeline: processedTimeline,
    vendorChecklist: processedVendors,
    personalizedIdeas: processedIdeas,
    risksAndBackups: processedRisks,
    metadata: {
      currency,
      totalBudget,
      totalEstimatedCost: sumAllocated,
      contingencyReserved,
      budgetHealth,
      infeasibilityTradeoffs,
      isPlanningEstimate: true as const,
      generatedAt: new Date().toISOString(),
    },
  };

  // Run Zod schema validation
  return completeEventPlanSchema.parse(result);
}

/**
 * Builds the structured system prompt for Gemini with explicit JSON-schema instructions
 */
function buildSystemInstruction(currency: string): string {
  return `You are Planora AI, an elite, professional software-driven master event architect.
Generate a comprehensive, tailored, and financially realistic event plan in structured JSON format.

CRITICAL FINANCIAL & PLANNING RULES:
1. Currency: Strictly use "${currency}".
2. Budget Realism: Do NOT invent verified market quotes. All numbers are preliminary planning estimates.
3. Budget Ceiling: Keep all category allocations realistic and balanced within the client's total budget. Reserve contingency when appropriate.
4. If the requirements are economically infeasible for the guest count and city, clearly identify the trade-offs.
5. Timeline: Schedule all tasks relative to the event date. NEVER claim that contracts are already booked or invitations have already been sent.
6. Return ONLY valid JSON adhering strictly to the requested schema. No markdown backticks, no explanatory conversational prose.`;
}

/**
 * Builds user prompt reflecting all event parameters
 */
function buildUserPrompt(input: PlanGenerationInput): string {
  return `Please generate an end-to-end master event plan for the following validated requirements:

Event Type: ${input.eventType}
Event Date: ${input.eventDate} (${input.timezone})
City & Location: ${input.city}${input.location ? ` - ${input.location}` : ""}
Guest Count: ${input.guestCount} guests
Total Budget: ${input.currency}${input.totalBudget.toLocaleString()}
Theme & Aesthetics: ${input.theme}${input.stylePreferences ? ` (Style notes: ${input.stylePreferences})` : ""}
Food & Dietary: ${input.foodPreferences.length ? input.foodPreferences.join(", ") : "Standard curated menu"}${input.dietaryRequirements.length ? ` | Dietary constraints: ${input.dietaryRequirements.join(", ")}` : ""}
Setting: ${input.indoorOutdoor}
Accessibility: ${input.accessibilityNeeds.length ? input.accessibilityNeeds.join(", ") : "Standard accessibility"}
User Priorities: ${input.userPriorities.length ? input.userPriorities.join(", ") : "Seamless guest experience"}
${input.constraints ? `Special Constraints: ${input.constraints}` : ""}

REQUIRED OUTPUT JSON STRUCTURE:
{
  "eventSummary": {
    "title": "Creative Event Title",
    "concept": "Narrative concept paragraph",
    "theme": "${input.theme}",
    "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
    "planningAssumptions": ["Assumption 1", "Assumption 2"]
  },
  "budget": [
    {
      "category": "Category Name",
      "estimatedAmount": 120000,
      "rationale": "Cost justification",
      "costConfidence": "high" | "medium" | "low",
      "costAssumptions": "Planning assumptions"
    }
  ],
  "timeline": [
    {
      "taskTitle": "Actionable task",
      "description": "Task details",
      "suggestedDueDate": "YYYY-MM-DD",
      "priority": "urgent" | "high" | "medium" | "low",
      "dependencies": []
    }
  ],
  "vendorChecklist": [
    {
      "vendorCategory": "Category",
      "requirements": "Key requirements",
      "questionsToAsk": ["Question 1", "Question 2"],
      "bookingPriority": "urgent" | "high" | "medium" | "low"
    }
  ],
  "personalizedIdeas": [
    {
      "title": "Experiential idea",
      "description": "Details",
      "estimatedCost": 25000,
      "materialsOrPreparationRequired": ["Item 1"]
    }
  ],
  "risksAndBackups": [
    {
      "risk": "Risk scenario",
      "mitigation": "Mitigation step",
      "backupOption": "Fallback plan"
    }
  ]
}`;
}

export interface GeneratePlanOptions {
  timeoutMs?: number;
}

/**
 * Generates an end-to-end event plan using the Gemini API and official @google/genai SDK,
 * followed by authoritative semantic constraint enforcement in application code.
 */
export async function generateCompleteEventPlan(
  rawInput: unknown,
  options: GeneratePlanOptions = {}
): Promise<CompleteEventPlan> {
  const input = planGenerationInputSchema.parse(rawInput);
  const client = getGeminiClient();
  const modelName = getGeminiModelName();
  const timeoutMs = options.timeoutMs || 150000;

  const systemInstruction = buildSystemInstruction(input.currency);
  const prompt = buildUserPrompt(input);

  // Timeout wrapper with AbortController pattern
  const generatePromise = client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
  });

  const timeoutPromise = new Promise<{ text?: string }>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  let response: { text?: string };
  try {
    response = await Promise.race([generatePromise, timeoutPromise]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
      throw new Error("AI service quota reached. Please try again in a few moments.");
    }
    if (message.includes("timed out")) {
      throw new Error("AI generation request timed out. Please try again.");
    }
    if (message.includes("API key not valid") || message.includes("401") || message.includes("UNAUTHENTICATED")) {
      throw new Error("AI authentication failed. Please verify server configuration.");
    }

    throw new Error(`AI generation service error: ${message}`);
  }

  const responseText = response.text || "";
  if (!responseText.trim()) {
    throw new Error("Empty response received from AI model");
  }

  let rawJson: Record<string, unknown>;
  try {
    const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    rawJson = JSON.parse(cleaned);
  } catch {
    throw new Error("AI response was not valid JSON. Please retry generation.");
  }

  // Authoritatively enforce semantic budget, timeline, and security constraints in application code
  return enforceSemanticPlanConstraints(rawJson, input);
}

export interface GenerateIdeasParams {
  eventType: string;
  theme: string;
  guestCount: number;
  budget: number;
  focusArea?: "all" | "theme" | "decor" | "activity" | "menu" | "logistics";
  customPrompt?: string;
}

/**
 * Generates contextual event ideas using Gemini 3.8 Flash / official SDK.
 * Used for focused brainstorm queries in the Ideas studio.
 */
export async function generateEventIdeas(
  params: GenerateIdeasParams
): Promise<AIIdea[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === "AIzaSy..." || apiKey === "") {
    return generateFallbackIdeas(params);
  }

  const ai = getGeminiClient();
  const modelName = getGeminiModelName();

  const systemInstruction = `You are Planora AI, an elite, creative event planner and designer.
Generate thoughtful, actionable, and tasteful ideas for the user's event.
Return ONLY valid JSON matching this format:
[
  {
    "title": "Creative headline",
    "description": "2-3 concise sentences explaining the concept and execution.",
    "category": "theme" | "decor" | "activity" | "menu" | "logistics",
    "estimatedCostRange": "$300 - $600",
    "tags": ["interactive", "floral", "evening"]
  }
]
No extra markdown, no code block backticks if possible, just raw JSON array.`;

  const prompt = `Plan a ${params.eventType} with the theme "${params.theme}".
Guest Count: ${params.guestCount} guests
Target Budget: $${params.budget.toLocaleString()}
Focus Area: ${params.focusArea || "all"}
${params.customPrompt ? `Special Note: ${params.customPrompt}` : ""}

Please generate 4 to 6 creative, high-impact ideas.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "";
    const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => ({
        id: `idea-${Date.now()}-${index}`,
        title: item.title || "Custom Event Concept",
        description: item.description || "",
        category: item.category || "decor",
        estimatedCostRange: item.estimatedCostRange || "Planning estimate",
        tags: Array.isArray(item.tags) ? item.tags : [],
        createdAt: new Date().toISOString(),
      }));
    }

    return generateFallbackIdeas(params);
  } catch (error) {
    console.error("Gemini API generation error in generateEventIdeas:", error);
    return generateFallbackIdeas(params);
  }
}

function generateFallbackIdeas(params: GenerateIdeasParams): AIIdea[] {
  const timestamp = new Date().toISOString();
  return [
    {
      id: `fallback-${Date.now()}-1`,
      title: `${params.theme} Welcome Experience`,
      description: `Greet your ${params.guestCount} guests with signature mocktails or welcome beverages infused with botanicals matching the ${params.theme} aesthetic.`,
      category: "menu",
      estimatedCostRange: "Planning estimate",
      tags: ["welcome", "refreshments", params.eventType],
      createdAt: timestamp,
    },
    {
      id: `fallback-${Date.now()}-2`,
      title: "Interactive Memory & Photo Wall",
      description: `Create a custom backdrop featuring polaroid cameras, handwritten message tags, and ambient lighting tailored to your celebration.`,
      category: "decor",
      estimatedCostRange: "Planning estimate",
      tags: ["interactive", "photos", "decor"],
      createdAt: timestamp,
    },
    {
      id: `fallback-${Date.now()}-3`,
      title: "Curated Acoustic Sunset Set",
      description: `Feature a live acoustic duo or custom ambient playlist designed to transition guests seamlessly from arrival to dinner.`,
      category: "activity",
      estimatedCostRange: "Planning estimate",
      tags: ["music", "ambience", "live"],
      createdAt: timestamp,
    },
    {
      id: `fallback-${Date.now()}-4`,
      title: "Sustainable Keepsake Station",
      description: `Provide locally-crafted miniature succulent pots or artisan confection boxes as mindful take-home favors.`,
      category: "logistics",
      estimatedCostRange: "Planning estimate",
      tags: ["favors", "sustainable", "takeaway"],
      createdAt: timestamp,
    },
  ];
}
