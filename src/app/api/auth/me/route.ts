import { getAuthenticatedUser } from "@/lib/auth/session";
import { apiSuccess, apiUnauthorized } from "@/lib/utils/response";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiUnauthorized("No active session found or session has expired");
  }

  return apiSuccess({
    user,
  });
}
