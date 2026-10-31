import { z } from "zod";
import { getGeminiClient, getGeminiModelName } from "./gemini";
import type { FinancialImpactResult, TimelineImpactResult } from "@/lib/domain/change-impact";
import type { EventModel } from "@/lib/types";

export const aiChangeAnalysisSchema = z.object({
  summary: z.string().min(10),
  tradeoffs: z.array(z.string()).min(1),
  alternatives: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        estimatedSavingsOrCost: z.string(),
      })
    )
    .min(1),
  risks: z
    .array(
      z.object({
        risk: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        mitigation: z.string(),
      })
    )
    .min(1),
});

export type AIChangeAnalysis = z.infer<typeof aiChangeAnalysisSchema>;

export interface GenerateChangeAnalysisParams {
  currentEvent: EventModel;
  changes: {
    guestCount?: { before: number; after: number };
    totalBudget?: { before: number; after: number };
    date?: { before: string; after: string; daysShifted: number };
    location?: { before: string; after: string };
    theme?: { before: string; after: string };
    vendorStatusChanges?: Array<{
      vendorName: string;
      category: string;
      beforeStatus: string;
      afterStatus: string;
    }>;
  };
  financialImpact: FinancialImpactResult;
  timelineImpact: TimelineImpactResult;
  timeoutMs?: number;
}

/**
 * Generates an AI-grounded change impact analysis, trade-off explanation, and replanning alternatives using Gemini 3.8.
 */
export async function generateAIChangeAnalysis(
  params: GenerateChangeAnalysisParams
): Promise<AIChangeAnalysis> {
  const { currentEvent, changes, financialImpact, timelineImpact, timeoutMs = 25000 } = params;
  const client = getGeminiClient();
  const modelName = getGeminiModelName();

  const systemInstruction = `You are Planora AI, an expert event replanning architect.
Your job is to analyze proposed changes to an existing event, explain realistic trade-offs, and suggest practical alternatives.

SAFETY AND INTEGRITY RULES:
1. Do NOT invent external vendor availability or cancellation refund policies.
2. Clearly distinguish verified facts from estimates.
3. Be concise, strategic, and practical.
4. Ground all advice in the provided event facts and calculated math.

REQUIRED JSON OUTPUT FORMAT:
{
  "summary": "2-3 sentences explaining the holistic impact of these changes on the celebration.",
  "tradeoffs": [
    "Concrete trade-off item 1 explaining where budget or quality compromises occur",
    "Concrete trade-off item 2"
  ],
  "alternatives": [
    {
      "title": "Creative Alternative Strategy",
      "description": "Specific execution guidance",
      "estimatedSavingsOrCost": "e.g. Save ₹50,000 or Net neutral"
    }
  ],
  "risks": [
    {
      "risk": "Description of risk",
      "severity": "low" | "medium" | "high",
      "mitigation": "Practical action to prevent or soften the risk"
    }
  ]
}`;

  const prompt = `EVENT: "${currentEvent.title}" (${currentEvent.type})
CURRENCY: ${currentEvent.currency}

PROPOSED MODIFICATIONS:
- Guest Count: ${
    changes.guestCount
      ? `${changes.guestCount.before} pax -> ${changes.guestCount.after} pax (${
          changes.guestCount.after - changes.guestCount.before > 0 ? "+" : ""
        }${changes.guestCount.after - changes.guestCount.before})`
      : "Unchanged"
  }
- Budget: ${
    changes.totalBudget
      ? `${currentEvent.currency}${changes.totalBudget.before.toLocaleString()} -> ${currentEvent.currency}${changes.totalBudget.after.toLocaleString()} (${
          financialImpact.budgetDelta >= 0 ? "+" : ""
        }${currentEvent.currency}${financialImpact.budgetDelta.toLocaleString()})`
      : "Unchanged"
  }
- Date: ${
    changes.date
      ? `${changes.date.before} -> ${changes.date.after} (${changes.date.daysShifted} days ${
          changes.date.daysShifted > 0 ? "postponed" : "advanced"
        })`
      : "Unchanged"
  }
- Location: ${
    changes.location ? `${changes.location.before} -> ${changes.location.after}` : "Unchanged"
  }
- Theme: ${changes.theme ? `${changes.theme.before} -> ${changes.theme.after}` : "Unchanged"}

CALCULATED FINANCIAL FACTS:
- Current Committed: ${currentEvent.currency}${financialImpact.currentCommitted.toLocaleString()}
- Current Actual Paid: ${currentEvent.currency}${financialImpact.currentActualSpend.toLocaleString()}
- Projected Total Required: ${currentEvent.currency}${financialImpact.projectedTotalCost.toLocaleString()}
- Projected Variance: ${currentEvent.currency}${financialImpact.projectedVariance.toLocaleString()}
- Feasible: ${financialImpact.isBudgetFeasible ? "YES" : "NO (Deficit)"}
${
  financialImpact.deficitAmount
    ? `- Deficit Amount: ${currentEvent.currency}${financialImpact.deficitAmount.toLocaleString()}`
    : ""
}
- Affected Categories: ${JSON.stringify(financialImpact.affectedBudgetCategories)}

CALCULATED TIMELINE FACTS:
- Tasks Rescheduled: ${timelineImpact.affectedTasks.length} tasks
- Booked Vendors Requiring Manual Date Reconfirmation: ${
    timelineImpact.vendorsRequiringConfirmation.length
  } vendors

Please evaluate the trade-offs, construct 2-3 practical replanning alternatives, and highlight any risks. Return strictly JSON matching the required schema.`;

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
      reject(new Error(`AI replanning analysis request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  let response: { text?: string };
  try {
    response = await Promise.race([generatePromise, timeoutPromise]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return generateFallbackAnalysis(params, "AI service quota reached; using baseline domain analysis.");
    }
    return generateFallbackAnalysis(params, `AI analysis timed out; using baseline domain heuristics: ${msg}`);
  }

  const responseText = response.text || "";
  try {
    const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const rawJson = JSON.parse(cleaned);
    const parsed = aiChangeAnalysisSchema.safeParse(rawJson);
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // fallback below
  }

  return generateFallbackAnalysis(params, "Calculated using authoritative domain heuristics.");
}

export function generateFallbackAnalysis(
  params: GenerateChangeAnalysisParams,
  note: string
): AIChangeAnalysis {
  const { currentEvent, changes, financialImpact, timelineImpact } = params;
  const currency = currentEvent.currency;

  const tradeoffs: string[] = [];
  const alternatives: AIChangeAnalysis["alternatives"] = [];
  const risks: AIChangeAnalysis["risks"] = [];

  if (changes.guestCount && changes.guestCount.after > changes.guestCount.before) {
    tradeoffs.push(
      `Increasing guest count by ${changes.guestCount.after - changes.guestCount.before} increases per-head catering allocations and tableware requirements.`
    );
    alternatives.push({
      title: "Streamlined Banquet Format",
      description: "Shift secondary courses to interactive live chaat stations to reduce full seated banquet labor overhead.",
      estimatedSavingsOrCost: "Reduce catering surge by 15-20%",
    });
    risks.push({
      risk: "Venue capacity constraints",
      severity: "medium",
      mitigation: "Verify seating layout and fire egress limits with palace/venue coordinator.",
    });
  }

  if (changes.totalBudget && changes.totalBudget.after < changes.totalBudget.before) {
    tradeoffs.push(
      `Budget reduction of ${currency}${(
        changes.totalBudget.before - changes.totalBudget.after
      ).toLocaleString()} requires scaling back secondary decor, lighting, or discretionary floral upgrades.`
    );
    alternatives.push({
      title: "Botanical & Fabric Focus",
      description: "Replace imported exotic florals with local marigolds and rich draped silks for equal grandeur at lower cost.",
      estimatedSavingsOrCost: `Save approximately ${currency}${Math.round(
        (changes.totalBudget.before - changes.totalBudget.after) * 0.4
      ).toLocaleString()}`,
    });
  }

  if (changes.date && changes.date.daysShifted !== 0) {
    tradeoffs.push(
      `Moving event date by ${Math.abs(changes.date.daysShifted)} days (${
        changes.date.daysShifted > 0 ? "postponed" : "advanced"
      }) requires manual reconfirmation with ${
        timelineImpact.vendorsRequiringConfirmation.length
      } locked vendor partners.`
    );
    risks.push({
      risk: "Vendor double-booking on new date",
      severity: "high",
      mitigation: "Contact contracted vendors immediately to confirm calendar availability before formalizing invitations.",
    });
  }

  if (tradeoffs.length === 0) {
    tradeoffs.push("Planned modifications are balanced within existing operational headroom.");
  }
  if (alternatives.length === 0) {
    alternatives.push({
      title: "Maintain Phased Allocations",
      description: "Keep existing vendor milestones while reserving uncommitted funds in contingency.",
      estimatedSavingsOrCost: "Net neutral",
    });
  }
  if (risks.length === 0) {
    risks.push({
      risk: "Timeline synchronization",
      severity: "low",
      mitigation: "Regularly check weekly milestones to ensure deadlines remain on track.",
    });
  }

  return {
    summary: `Impact assessment for ${currentEvent.title}: ${note} Net budget variance is projected at ${currency}${financialImpact.projectedVariance.toLocaleString()}.`,
    tradeoffs,
    alternatives,
    risks,
  };
}
