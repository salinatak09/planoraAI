import { clearSessionCookieOnResponse } from "@/lib/auth/cookies";
import { apiSuccess } from "@/lib/utils/response";

export async function POST() {
  const response = apiSuccess({
    message: "Logged out successfully",
  });

  clearSessionCookieOnResponse(response);
  return response;
}
