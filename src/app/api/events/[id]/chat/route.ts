import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/utils/response";
import {
  getConversationMessages,
  appendConversationMessage,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import {
  buildEventAssistantContext,
  generateAssistantChatResponse,
} from "@/lib/ai/assistant";
import { chatInputSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { isValidObjectId, serializeDocument } from "@/lib/utils/objectid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]/chat
 * Retrieves persisted conversation history and authorized event context.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to access the event copilot");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    // Build authorized, bounded event context
    const eventContext = await buildEventAssistantContext(id, user.userId);

    // Retrieve persisted conversation history
    let messages = await getConversationMessages(id, user.userId);

    const defaultPrompts = [
      "What should I finish this week?",
      "Suggest a vegetarian menu for 100 guests",
      `Reduce my budget by ${eventContext.currency}30,000`,
      "Suggest a backup plan for rain",
      "Help me compare these vendor quotations",
      "Create a checklist for the final seven days",
    ];

    // Seed initial greeting if this is a fresh conversation
    if (messages.length === 0) {
      const initialGreeting = `Namaste! 🌸 I am Planora AI, your executive event copilot for "${eventContext.title}". I am grounded in your ${eventContext.currency}${eventContext.totalBudget.toLocaleString()} budget ledger, ${eventContext.taskSummary.pending} pending tasks, and vendor coordination in ${eventContext.city}. How can I assist you right now?`;

      const initialMessage = await appendConversationMessage(
        id,
        user.userId,
        "assistant",
        initialGreeting,
        {
          suggestedPrompts: defaultPrompts,
        }
      );
      messages = [initialMessage];
    }

    return apiSuccess({
      messages: serializeDocument(messages),
      eventContext,
      suggestedPrompts: defaultPrompts,
    });
  } catch (err: unknown) {
    const isAuthError = err instanceof AuthorizationError || (err as { name?: string })?.name === "AuthorizationError";
    if (isAuthError) {
      return apiError("You do not have permission to access this event chat", "FORBIDDEN", 403);
    }
    const isNotFound = err instanceof ResourceNotFoundError || (err as { name?: string })?.name === "ResourceNotFoundError";
    if (isNotFound) {
      return apiError("Event not found", "NOT_FOUND", 404);
    }
    return apiError(
      err instanceof Error ? err.message : "Failed to load chat history",
      "SERVER_ERROR",
      500
    );
  }
}

/**
 * POST /api/events/[id]/chat
 * Sends a message to the AI copilot, evaluates event context, and persists the interaction.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to message the event copilot");
      }
      throw err;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError("Invalid event ID format", "INVALID_ID", 400);
    }

    // Rate limiting: max 20 requests per minute per user
    const rateCheck = checkRateLimit(`chat:${user.userId}`, 20, 60);
    if (!rateCheck.success) {
      return apiError(
        `Chat rate limit reached. Please wait ${rateCheck.resetInSeconds} seconds before sending another message.`,
        "RATE_LIMIT_EXCEEDED",
        429
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", "BAD_REQUEST", 400);
    }

    const parsed = chatInputSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const userMessageContent = parsed.data.message;

    // Retrieve authorized event context and conversation history
    const eventContext = await buildEventAssistantContext(id, user.userId);
    const existingMessages = await getConversationMessages(id, user.userId);

    // 1. Persist user message in MongoDB
    const savedUserMessage = await appendConversationMessage(
      id,
      user.userId,
      "user",
      userMessageContent
    );

    // 2. Generate contextual response from Gemini AI
    let aiResponse;
    try {
      aiResponse = await generateAssistantChatResponse({
        eventContext,
        recentHistory: existingMessages,
        userMessage: userMessageContent,
      });
    } catch (aiErr: unknown) {
      const errMsg = aiErr instanceof Error ? aiErr.message : "AI generation failed";
      // Fallback response so user is never stranded
      aiResponse = {
        reply: `I encountered a momentary issue processing your request: "${errMsg}". Please try asking again or select one of the suggested actions below.`,
        suggestedPrompts: [
          "What should I finish this week?",
          "Suggest a vegetarian menu for 100 guests",
          `Reduce my budget by ${eventContext.currency}30,000`,
        ],
        actionProposal: null,
      };
    }

    // 3. Persist AI assistant response in MongoDB with any structured proposal
    const savedAssistantMessage = await appendConversationMessage(
      id,
      user.userId,
      "assistant",
      aiResponse.reply,
      {
        actionProposal: aiResponse.actionProposal || undefined,
        suggestedPrompts: aiResponse.suggestedPrompts,
      }
    );

    return apiSuccess({
      userMessage: serializeDocument(savedUserMessage),
      assistantMessage: serializeDocument(savedAssistantMessage),
      eventContext,
    });
  } catch (err: unknown) {
    const isAuthError = err instanceof AuthorizationError || (err as { name?: string })?.name === "AuthorizationError";
    if (isAuthError) {
      return apiError("You do not have permission to message this event copilot", "FORBIDDEN", 403);
    }
    const isNotFound = err instanceof ResourceNotFoundError || (err as { name?: string })?.name === "ResourceNotFoundError";
    if (isNotFound) {
      return apiError("Event not found", "NOT_FOUND", 404);
    }
    return apiError(
      err instanceof Error ? err.message : "Internal chat processing error",
      "SERVER_ERROR",
      500
    );
  }
}
