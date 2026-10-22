import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { aiGenerateIdeasSchema } from "@/lib/validation/schemas";
import { generateEventIdeas } from "@/lib/ai/gemini";
import { apiSuccess, apiValidationError, apiError } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user session
    await getAuthenticatedUser();

    const body = await req.json();
    const parsed = aiGenerateIdeasSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const ideas = await generateEventIdeas({
      eventType: parsed.data.eventType,
      theme: parsed.data.theme,
      guestCount: parsed.data.guestCount,
      budget: parsed.data.budget,
      focusArea: parsed.data.focusArea,
      customPrompt: parsed.data.customPrompt,
    });

    return apiSuccess({
      generatedCount: ideas.length,
      ideas,
    });
  } catch (error) {
    console.error("POST /api/ai/ideas error:", error);
    return apiError("Failed to generate event ideas with Gemini", "AI_ERROR", 500);
  }
}
