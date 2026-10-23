import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { aiGenerateIdeasSchema } from "@/lib/validation/schemas";
import { generateEventIdeas } from "@/lib/ai/gemini";
import { checkRateLimit, getClientIdentifier } from "@/lib/auth/rate-limit";
import { apiSuccess, apiValidationError, apiError, apiUnauthorized } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session strictly from server session
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be logged in to generate AI ideas");
      }
      throw err;
    }

    // 2. Rate limit AI requests (max 15 generations per minute per user)
    const rateLimitKey = user.userId || getClientIdentifier(req.headers, "ai");
    const rateLimit = checkRateLimit(`ai:${rateLimitKey}`, 15, 60);
    if (!rateLimit.success) {
      return apiError(
        `AI generation limit reached. Please wait ${rateLimit.resetInSeconds} seconds.`,
        "RATE_LIMITED",
        429
      );
    }

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
