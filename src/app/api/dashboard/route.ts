import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/utils/response";
import { getDashboardSummaryForOwner } from "@/lib/db/services";
import { serializeDocuments } from "@/lib/utils/objectid";

export async function GET(req: NextRequest) {
  try {
    // Explicitly access req.url to mark dynamic route execution
    void req.url;
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to access the dashboard");
      }
      throw err;
    }

    if (!process.env.MONGODB_URI) {
      // In offline / fallback mode without MongoDB
      return apiSuccess({
        totalEvents: 0,
        upcomingEvents: [],
        recentEvents: [],
        totalBudget: 0,
        totalEstimatedAmount: 0,
        totalActualSpent: 0,
        totalGuests: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
        taskCompletionRate: 0,
        upcomingDeadlines: [],
      });
    }

    const summary = await getDashboardSummaryForOwner(user.userId);

    return apiSuccess({
      ...summary,
      upcomingEvents: serializeDocuments(summary.upcomingEvents),
      recentEvents: serializeDocuments(summary.recentEvents),
      upcomingDeadlines: serializeDocuments(summary.upcomingDeadlines),
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return apiError("Failed to load dashboard metrics", "SERVER_ERROR", 500);
  }
}
